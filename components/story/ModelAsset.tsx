import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';

interface ModelAssetProps {
  /** Path under `public/` to a .glb/.gltf file (see `modelAssets.ts`). */
  src: string;
  /** Uniform scale applied on top of any `targetSize` normalization. */
  scale?: number;
  /** If set, the model is uniformly rescaled so its largest bounding-box dimension equals this many scene units. */
  targetSize?: number;
  /** Re-centers the model on X/Z and drops it so its lowest point sits at local y=0 (for objects that stand on a surface). Centers on Y instead when false (for objects like an aircraft that hang in open space). */
  alignToGround?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * Loads a GLTF/GLB model via drei's `useGLTF` (which caches one shared scene
 * per URL) and clones it — scene graph via `SkeletonUtils.clone` (handles
 * bones/skinned meshes so a future rigged model keeps working, a strict
 * superset of `Object3D.clone(true)`) and every material individually.
 *
 * Cloning is required, not optional: `useFadeGroup` mutates `material.opacity`
 * directly every frame. Without a clone, two instances of the same model
 * (e.g. the finale scene's smaller cargo plane) would share material objects
 * and fading one would silently fade the other too.
 */
export function ModelAsset({
  src,
  scale = 1,
  targetSize,
  alignToGround = false,
  castShadow = true,
  receiveShadow = true,
}: ModelAssetProps) {
  const { scene } = useGLTF(src);

  const prepared = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene) as THREE.Group;

    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!(mesh as unknown as { isMesh?: boolean }).isMesh) return;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((material) => material.clone());
      } else if (mesh.material) {
        mesh.material = (mesh.material as THREE.Material).clone();
      }
    });

    // Apply scale on the object itself (not as a JSX prop on <primitive> —
    // R3F re-applies JSX props every render, which would silently reset this
    // back to identity and clobber the normalization below).
    if (targetSize) {
      const rawBox = new THREE.Box3().setFromObject(cloned);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const largestDimension = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;
      cloned.scale.setScalar((targetSize / largestDimension) * scale);
    } else {
      cloned.scale.setScalar(scale);
    }

    // Recompute after rescaling so centering/grounding uses final coordinates.
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    cloned.position.x -= center.x;
    cloned.position.z -= center.z;
    cloned.position.y -= alignToGround ? box.min.y : center.y;

    return cloned;
  }, [scene, scale, targetSize, alignToGround, castShadow, receiveShadow]);

  // Dispose only the cloned materials this instance owns — geometries and
  // textures stay in drei's shared cache and must not be freed here.
  useEffect(() => {
    return () => {
      prepared.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!(mesh as unknown as { isMesh?: boolean }).isMesh) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => material?.dispose());
      });
    };
  }, [prepared]);

  return <primitive object={prepared} />;
}
