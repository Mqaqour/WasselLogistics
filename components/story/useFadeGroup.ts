import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { tentWeight } from './sceneMath';
import { STAGE_COUNT } from './stagesConfig';
import { ProgressStore } from './types';

interface FadeGroupOptions {
  /** Stage-unit (0..STAGE_COUNT-1, fractional allowed) this object is centered on. */
  center: number;
  /** How many stage-units on either side of `center` the object stays partially visible. */
  spread: number;
  /** Extra downward offset applied while hidden, so objects gently rise into place as they fade in. */
  riseDistance?: number;
  baseScale?: number;
}

/**
 * Drives visibility/opacity/scale of a 3D object group from the shared scroll
 * progress store, entirely inside the R3F render loop (no React state), so
 * scroll-driven fades never trigger a re-render.
 */
interface FadedMaterial {
  material: THREE.Material & { opacity: number };
  /** The material's own authored opacity (e.g. 0.88 for a translucent wrap) — the fade weight multiplies this rather than replacing it. */
  baseOpacity: number;
}

export function useFadeGroup(store: ProgressStore, options: FadeGroupOptions) {
  const { center, spread, riseDistance = 0, baseScale = 1 } = options;
  const groupRef = useRef<THREE.Group>(null!);
  const materialsRef = useRef<FadedMaterial[]>([]);
  const basePositionRef = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    basePositionRef.current = group.position.clone();

    const materials: FadedMaterial[] = [];
    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if ((mesh as { isMesh?: boolean }).isMesh && mesh.material) {
        const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        list.forEach((mat) => {
          const material = mat as THREE.Material & { opacity: number };
          materials.push({ material, baseOpacity: material.opacity });
        });
      }
    });
    materialsRef.current = materials;
  }, []);

  useFrame(() => {
    const group = groupRef.current;
    const basePosition = basePositionRef.current;
    if (!group || !basePosition) return;

    const stageProgress = store.progress * (STAGE_COUNT - 1);
    const weight = tentWeight(stageProgress, center, spread);
    const visible = weight > 0.015;
    group.visible = visible;
    if (!visible) return;

    for (const { material, baseOpacity } of materialsRef.current) {
      const finalOpacity = baseOpacity * weight;
      const shouldBeTransparent = baseOpacity < 0.999 || weight < 0.999;
      if (material.transparent !== shouldBeTransparent) {
        material.transparent = shouldBeTransparent;
        material.needsUpdate = true;
      }
      material.opacity = finalOpacity;
      material.depthWrite = finalOpacity > 0.4;
    }
    group.scale.setScalar(baseScale * (0.86 + 0.14 * weight));
    if (riseDistance) {
      group.position.y = basePosition.y - riseDistance * (1 - weight);
    }
  });

  return groupRef;
}
