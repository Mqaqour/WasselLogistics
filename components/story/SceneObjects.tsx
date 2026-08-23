import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, useGLTF, useTexture } from '@react-three/drei';
import { useFadeGroup } from './useFadeGroup';
import { ModelAsset } from './ModelAsset';
import { ModelErrorBoundary } from './ModelErrorBoundary';
import { MODEL_ASSETS, EARTH_TEXTURE_URL } from './modelAssets';
import { ProgressStore } from './types';

/**
 * Logistics objects for the scroll story. Most are lightweight procedural
 * "low-poly" shapes built from primitive three.js geometries. The three
 * "hero" vehicles (plane, ship, freight truck) load a real GLB model via
 * `ModelAsset`, wrapped in `ModelErrorBoundary` so a missing/broken asset
 * falls back to the original procedural shape instead of breaking the
 * canvas — see `public/assets/models/ATTRIBUTIONS.md` for current model
 * sources/licenses. Every object is wrapped in `useFadeGroup`, which
 * fades/scales it in and out around the scroll stage it belongs to (see
 * `center`/`spread`, wired up in `WasselScene.tsx`).
 */

// Preload the hero GLB models as soon as this module evaluates (i.e. as soon
// as the lazy-loaded story chunk itself downloads), so by the time the scene
// mounts behind DesktopStoryExperience's <Suspense>, they're already cached.
useGLTF.preload(MODEL_ASSETS.cargoPlane);
useGLTF.preload(MODEL_ASSETS.containerShip);
useGLTF.preload(MODEL_ASSETS.freightTruck);
useTexture.preload(EARTH_TEXTURE_URL);

// Brand palette (kept in sync with the Tailwind `wassel-*` theme colors).
const NAVY = '#002B49';
const DEEP_NAVY = '#001A2F';
const YELLOW = '#FFCD00';
const WHITE = '#F2F6F9';
const STEEL = '#95A9BC';
const GLASS = '#BFE3FF';

export interface ObjectProps {
  store: ProgressStore;
  /** Stage-unit this object fades in/out around (fractional units allowed for staggered reveals). */
  center: number;
  spread: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

// ---------------------------------------------------------------------------
// Scene 1 — Globe
// ---------------------------------------------------------------------------
export const Globe: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1 }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale });
  const earthTexture = useTexture(EARTH_TEXTURE_URL);
  const sphereRef = useRef<THREE.Mesh>(null);

  // Real Earth's axial tilt (~23.4°) plus a slow continuous spin — independent
  // of useFadeGroup's own position/scale/opacity animation on the parent group.
  useFrame((_, delta) => {
    if (sphereRef.current) sphereRef.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={ref} position={position}>
      <mesh ref={sphereRef} rotation={[0, 0, 0.41]}>
        <sphereGeometry args={[1.6, 64, 64]} />
        <meshStandardMaterial map={earthTexture} roughness={0.75} metalness={0.05} />
      </mesh>
      <mesh rotation={[0.5, 0.3, 0]}>
        <torusGeometry args={[1.78, 0.014, 8, 64]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.75} toneMapped={false} />
      </mesh>
      <mesh rotation={[1.05, 0.9, 0]}>
        <torusGeometry args={[1.72, 0.009, 8, 64]} />
        <meshStandardMaterial color={WHITE} transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[-0.6, 1.3, 0]}>
        <torusGeometry args={[1.72, 0.009, 8, 64]} />
        <meshStandardMaterial color={WHITE} transparent opacity={0.4} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — Hub + shipment items
// ---------------------------------------------------------------------------
export const LogisticsHub: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1 }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale });
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[2.6, 2.8, 0.3, 48]} />
        <meshPhysicalMaterial color={DEEP_NAVY} roughness={0.45} metalness={0.35} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <ringGeometry args={[1.9, 2.0, 48]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.8} side={2} toneMapped={false} />
      </mesh>
      <RoundedBox args={[0.7, 1.7, 0.7]} radius={0.06} smoothness={2} position={[0, 1.1, 0]} castShadow>
        <meshPhysicalMaterial color={WHITE} roughness={0.4} clearcoat={0.5} />
      </RoundedBox>
      <mesh position={[0, 2.05, 0]}>
        <coneGeometry args={[0.55, 0.6, 4]} />
        <meshStandardMaterial color={NAVY} roughness={0.5} />
      </mesh>
      {/* Perimeter beacon markers — read as functional hub lights rather than stray poles */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const x = Math.cos(angle) * 2.3;
        const z = Math.sin(angle) * 2.3;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.16, 16]} />
              <meshStandardMaterial color={DEEP_NAVY} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.045, 0.06, 0.6, 12]} />
              <meshStandardMaterial color={STEEL} metalness={0.4} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.62, 0]}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.7} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export const DocumentEnvelope: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1 }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale, riseDistance: 0.6 });
  return (
    // A slight prop-up tilt (vs. lying perfectly flat) reads far more clearly as an
    // envelope from the story's elevated camera angles — the flap actually catches light.
    <group ref={ref} position={position} rotation={[-0.1, 0.4, 0]}>
      <RoundedBox args={[0.75, 0.05, 0.5]} radius={0.02} smoothness={2} castShadow>
        <meshStandardMaterial color={WHITE} roughness={0.75} />
      </RoundedBox>
      <mesh position={[0, 0.055, -0.03]} rotation={[-0.55, 0, 0]}>
        <boxGeometry args={[0.68, 0.015, 0.34]} />
        <meshStandardMaterial color={NAVY} roughness={0.6} />
      </mesh>
      {/* Address lines — cheap but immediately reads as "document" rather than a blank slab */}
      {[-0.08, -0.01, 0.06].map((z, i) => (
        <mesh key={z} position={[i === 0 ? -0.05 : 0.02, 0.027, z]}>
          <boxGeometry args={[i === 0 ? 0.32 : 0.46, 0.005, 0.03]} />
          <meshStandardMaterial color={STEEL} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 0.1, 0.08]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
    </group>
  );
};

export const ParcelBox: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1 }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale, riseDistance: 0.6 });
  return (
    <group ref={ref} position={position}>
      <RoundedBox args={[0.6, 0.6, 0.6]} radius={0.035} smoothness={2} castShadow>
        <meshStandardMaterial color="#C9A567" roughness={0.85} />
      </RoundedBox>
      <mesh>
        <boxGeometry args={[0.63, 0.14, 0.63]} />
        <meshStandardMaterial color={YELLOW} roughness={0.4} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.63, 0.63, 0.14]} />
        <meshStandardMaterial color={YELLOW} roughness={0.4} />
      </mesh>
    </group>
  );
};

export const Pallet: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1 }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale, riseDistance: 0.5 });
  return (
    <group ref={ref} position={position}>
      <RoundedBox args={[1.3, 0.1, 1.1]} radius={0.02} smoothness={2} position={[0, 0.12, 0]} castShadow>
        <meshStandardMaterial color="#B08454" roughness={0.9} />
      </RoundedBox>
      {[-0.5, 0, 0.5].map((x) => (
        <mesh key={x} position={[x, 0.02, 0]}>
          <boxGeometry args={[0.15, 0.16, 1.1]} />
          <meshStandardMaterial color="#8A6238" roughness={0.9} />
        </mesh>
      ))}
      {/* Goods stacked underneath, visible through the translucent wrap */}
      <RoundedBox args={[0.85, 0.6, 0.75]} radius={0.02} smoothness={1} position={[0, 0.47, 0]}>
        <meshStandardMaterial color="#C9A567" roughness={0.85} />
      </RoundedBox>
      {/* Stretch-wrap shell */}
      <RoundedBox args={[1.0, 0.75, 0.9]} radius={0.03} smoothness={2} position={[0, 0.55, 0]} castShadow>
        <meshPhysicalMaterial color={WHITE} roughness={0.2} transparent opacity={0.48} clearcoat={0.8} />
      </RoundedBox>
      {/* Diagonal wrap-film texture, criss-crossing the front and back faces like real stretch wrap */}
      {[0.452, -0.452].map((z) =>
        [0.4, -0.4].map((tilt) => (
          <mesh key={`${z}-${tilt}`} position={[0, 0.55, z]} rotation={[0, 0, tilt]}>
            <boxGeometry args={[1.12, 0.07, 0.01]} />
            <meshStandardMaterial color={WHITE} transparent opacity={0.4} roughness={0.15} />
          </mesh>
        )),
      )}
      {/* Gathered film, twisted into a knot at the top — the telltale sign of a shrink-wrapped load */}
      <mesh position={[0, 0.97, 0]} scale={[1, 0.65, 1]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color={WHITE} transparent opacity={0.65} roughness={0.3} />
      </mesh>
    </group>
  );
};

export const CargoContainer: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1, rotation }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale, riseDistance: 0.7 });
  return (
    <group ref={ref} position={position} rotation={rotation}>
      <RoundedBox args={[2.2, 1, 1]} radius={0.035} smoothness={2} castShadow>
        <meshPhysicalMaterial color={NAVY} roughness={0.5} metalness={0.25} clearcoat={0.3} />
      </RoundedBox>
      {[-0.7, -0.2, 0.3, 0.8].map((x) => (
        <mesh key={x} position={[x, 0, 0.505]}>
          <boxGeometry args={[0.06, 0.9, 0.02]} />
          <meshStandardMaterial color={DEEP_NAVY} />
        </mesh>
      ))}
      <mesh position={[1.1, 0, 0]}>
        <boxGeometry args={[0.05, 1.02, 1.02]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — Air
// ---------------------------------------------------------------------------
const CargoPlaneProcedural: React.FC = () => (
  <group rotation={[0, Math.PI / 10, 0]}>
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
      <capsuleGeometry args={[0.3, 2.3, 8, 16]} />
      <meshPhysicalMaterial color={WHITE} roughness={0.28} metalness={0.3} clearcoat={0.7} />
    </mesh>
    <mesh position={[0.95, 0.05, 0]} rotation={[0, 0, -Math.PI / 2]}>
      <coneGeometry args={[0.3, 0.65, 16]} />
      <meshPhysicalMaterial color={NAVY} roughness={0.25} clearcoat={0.6} />
    </mesh>
    {/* Wings, slightly tapered via two stacked boxes */}
    <mesh position={[0, 0.05, 0]}>
      <boxGeometry args={[0.55, 0.06, 2.6]} />
      <meshStandardMaterial color={STEEL} roughness={0.35} metalness={0.2} />
    </mesh>
    <mesh position={[0.05, 0.05, 0]}>
      <boxGeometry args={[0.4, 0.05, 3.0]} />
      <meshStandardMaterial color={STEEL} roughness={0.35} metalness={0.2} />
    </mesh>
    {[-0.9, 0.9].map((z) => (
      <mesh key={z} position={[-0.05, -0.14, z]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.45, 12]} />
        <meshStandardMaterial color={DEEP_NAVY} roughness={0.4} />
      </mesh>
    ))}
    <mesh position={[-1.05, 0.38, 0]} rotation={[0, 0, 0.5]}>
      <boxGeometry args={[0.06, 0.75, 0.5]} />
      <meshStandardMaterial color={NAVY} roughness={0.4} />
    </mesh>
    <mesh position={[-1, 0, 0]}>
      <boxGeometry args={[0.32, 0.5, 0.05]} />
      <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.35} />
    </mesh>
  </group>
);

export const CargoPlane: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1 }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale });
  return (
    <group ref={ref} position={position}>
      <ModelErrorBoundary fallback={<CargoPlaneProcedural />}>
        <group rotation={[0, -Math.PI / 2, 0]}>
          <ModelAsset src={MODEL_ASSETS.cargoPlane} targetSize={3.4} />
        </group>
      </ModelErrorBoundary>
    </group>
  );
};

// Varied puff sizes/offsets (rather than a uniform 4-sphere cross) read as an
// actual cumulus cloud silhouette instead of a cluster of identical balls.
const CLOUD_PUFFS: Array<[number, number, number, number]> = [
  [0, 0, 0, 0.48],
  [0.55, 0.1, 0.12, 0.38],
  [-0.55, 0.04, -0.08, 0.4],
  [0.15, 0.34, 0.02, 0.32],
  [-0.22, 0.3, -0.15, 0.28],
  [0.9, -0.06, -0.05, 0.26],
  [-0.85, -0.1, 0.12, 0.24],
  [0.35, -0.18, 0.2, 0.3],
  [-0.15, -0.16, -0.22, 0.27],
];

export const CloudPuff: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1 }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale });
  return (
    <group ref={ref} position={position}>
      {CLOUD_PUFFS.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} scale={[1, 0.82, 1]}>
          <sphereGeometry args={[r, 12, 12]} />
          <meshStandardMaterial color={WHITE} transparent opacity={0.65} roughness={1} />
        </mesh>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — Sea
// ---------------------------------------------------------------------------
export const Ocean: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1 }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale });
  return (
    <group ref={ref} position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[10, 48]} />
        <meshPhysicalMaterial color="#0B4A73" roughness={0.2} metalness={0.15} clearcoat={0.5} clearcoatRoughness={0.2} />
      </mesh>
    </group>
  );
};

const CargoShipProcedural: React.FC = () => {
  const containerColors = [YELLOW, WHITE, NAVY, STEEL];
  return (
    <group>
      <RoundedBox args={[3.2, 0.6, 1.1]} radius={0.05} smoothness={2} castShadow>
        <meshPhysicalMaterial color={DEEP_NAVY} roughness={0.4} metalness={0.35} clearcoat={0.4} />
      </RoundedBox>
      <mesh position={[1.5, 0, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <coneGeometry args={[0.6, 0.9, 3]} />
        <meshPhysicalMaterial color={DEEP_NAVY} roughness={0.4} metalness={0.35} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <RoundedBox key={i} args={[0.38, 0.4, 0.9]} radius={0.02} smoothness={1} position={[-1.1 + i * 0.42, 0.55, 0]} castShadow>
          <meshStandardMaterial color={containerColors[i % containerColors.length]} roughness={0.55} />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.4, 0.6, 0.7]} radius={0.03} smoothness={2} position={[-1.4, 0.75, 0]} castShadow>
        <meshPhysicalMaterial color={WHITE} roughness={0.4} clearcoat={0.5} />
      </RoundedBox>
      <mesh position={[-1.4, 1.15, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
        <meshStandardMaterial color={STEEL} />
      </mesh>
    </group>
  );
};

export const CargoShip: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1 }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale });
  return (
    <group ref={ref} position={position}>
      <ModelErrorBoundary fallback={<CargoShipProcedural />}>
        <ModelAsset src={MODEL_ASSETS.containerShip} targetSize={4.6} alignToGround />
      </ModelErrorBoundary>
    </group>
  );
};

export const PortCrane: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1 }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale });
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.2, 2.4, 0.2]} />
        <meshStandardMaterial color={YELLOW} roughness={0.45} />
      </mesh>
      <mesh position={[0.9, 2.3, 0]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[2, 0.14, 0.14]} />
        <meshStandardMaterial color={YELLOW} roughness={0.45} />
      </mesh>
      <mesh position={[-0.5, 2.3, 0]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.9, 0.12, 0.12]} />
        <meshStandardMaterial color={YELLOW} roughness={0.45} />
      </mesh>
      <mesh position={[1.7, 1.6, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
        <meshStandardMaterial color={DEEP_NAVY} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 — Warehouse / cargo terminal
// ---------------------------------------------------------------------------
export const Warehouse: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1 }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale });
  return (
    <group ref={ref} position={position}>
      <RoundedBox args={[4, 1.8, 3]} radius={0.06} smoothness={2} position={[0, 0.9, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color={WHITE} roughness={0.6} clearcoat={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.65, 1.505]}>
        <boxGeometry args={[4.02, 0.22, 0.02]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 1.95, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.5, 0.9, 4]} />
        <meshStandardMaterial color={NAVY} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.55, 1.51]}>
        <boxGeometry args={[1.1, 1.1, 0.04]} />
        <meshStandardMaterial color={DEEP_NAVY} />
      </mesh>
      {[-1.4, 1.4].map((x) => (
        <mesh key={x} position={[x, 1.3, 1.51]}>
          <boxGeometry args={[0.7, 0.4, 0.02]} />
          <meshPhysicalMaterial color={GLASS} transparent opacity={0.75} roughness={0.15} clearcoat={0.8} />
        </mesh>
      ))}
    </group>
  );
};

export const Forklift: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1 }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale });
  return (
    <group ref={ref} position={position}>
      <RoundedBox args={[0.7, 0.4, 0.45]} radius={0.03} smoothness={2} position={[0, 0.32, 0]} castShadow>
        <meshStandardMaterial color={YELLOW} roughness={0.45} />
      </RoundedBox>
      <mesh position={[-0.15, 0.75, 0]}>
        <boxGeometry args={[0.05, 0.7, 0.4]} />
        <meshStandardMaterial color={DEEP_NAVY} />
      </mesh>
      <mesh position={[0.4, 0.18, 0]}>
        <boxGeometry args={[0.5, 0.04, 0.42]} />
        <meshStandardMaterial color={STEEL} metalness={0.3} />
      </mesh>
      {[[-0.22, 0.1, 0.24], [-0.22, 0.1, -0.24], [0.22, 0.1, 0.24], [0.22, 0.1, -0.24]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 14]} />
          <meshStandardMaterial color={DEEP_NAVY} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------------------
// Scene 6 — Trucking / road
// ---------------------------------------------------------------------------
export const Road: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1 }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale });
  return (
    <group ref={ref} position={position} rotation={[0, 0.15, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[16, 0.05, 2.6]} />
        <meshStandardMaterial color="#2B3238" roughness={0.9} />
      </mesh>
      {Array.from({ length: 13 }).map((_, i) => (
        <mesh key={i} position={[-7.2 + i * 1.2, 0.03, 0]}>
          <boxGeometry args={[0.5, 0.01, 0.1]} />
          <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.15} />
        </mesh>
      ))}
    </group>
  );
};

const truckBody = (cabColor: string, boxColor: string, boxLength: number) => (
  <>
    <RoundedBox args={[0.7, 0.7, 0.9]} radius={0.05} smoothness={2} position={[-boxLength / 2 - 0.35, 0.35, 0]} castShadow>
      <meshPhysicalMaterial color={cabColor} roughness={0.35} clearcoat={0.5} />
    </RoundedBox>
    <mesh position={[-boxLength / 2 - 0.3, 0.42, 0.44]}>
      <boxGeometry args={[0.32, 0.32, 0.02]} />
      <meshPhysicalMaterial color={GLASS} transparent opacity={0.85} roughness={0.1} clearcoat={0.9} />
    </mesh>
    <RoundedBox args={[boxLength, 0.9, 0.95]} radius={0.04} smoothness={2} position={[0.15, 0.45, 0]} castShadow>
      <meshStandardMaterial color={boxColor} roughness={0.5} />
    </RoundedBox>
    {[-0.85, boxLength / 2 - 0.3].map((x, i) => (
      <group key={i}>
        <mesh position={[x, -0.02, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.16, 16]} />
          <meshStandardMaterial color={DEEP_NAVY} roughness={0.7} />
        </mesh>
        <mesh position={[x, -0.02, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.16, 16]} />
          <meshStandardMaterial color={DEEP_NAVY} roughness={0.7} />
        </mesh>
      </group>
    ))}
  </>
);

export const DeliveryVan: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1, rotation }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale });
  return (
    <group ref={ref} position={position} rotation={rotation}>
      {truckBody(WHITE, YELLOW, 0.9)}
    </group>
  );
};

export const FreightTruck: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1, rotation }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale });
  return (
    <group ref={ref} position={position} rotation={rotation}>
      <ModelErrorBoundary fallback={<group>{truckBody(NAVY, STEEL, 1.7)}</group>}>
        <group rotation={[0, -Math.PI / 2, 0]}>
          <ModelAsset src={MODEL_ASSETS.freightTruck} targetSize={3.1} alignToGround />
        </group>
      </ModelErrorBoundary>
    </group>
  );
};

// ---------------------------------------------------------------------------
// Scene 7 — Domestic / city
// ---------------------------------------------------------------------------
export const CityBlock: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1 }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale });
  const buildings = [
    { x: -3, z: -1.5, h: 1.6, w: 0.9 },
    { x: -1.6, z: 0.6, h: 2.4, w: 1.1 },
    { x: 0, z: -2, h: 1.1, w: 0.8 },
    { x: 1.6, z: 0.3, h: 2.9, w: 1.0 },
    { x: 3.1, z: -1, h: 1.8, w: 0.9 },
    { x: -0.6, z: 2.2, h: 1.4, w: 0.85 },
  ];
  return (
    <group ref={ref} position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#0B3554" roughness={0.85} />
      </mesh>
      {buildings.map((b, i) => (
        <RoundedBox key={i} args={[b.w, b.h, b.w]} radius={0.04} smoothness={2} position={[b.x, b.h / 2, b.z]} castShadow>
          <meshPhysicalMaterial color={i % 2 === 0 ? WHITE : STEEL} roughness={0.5} clearcoat={0.3} />
        </RoundedBox>
      ))}
    </group>
  );
};

export const MapPinMarker: React.FC<ObjectProps> = ({ store, center, spread, position = [0, 0, 0], scale = 1 }) => {
  const ref = useFadeGroup(store, { center, spread, baseScale: scale, riseDistance: 0.8 });
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.22, 0.5, 16]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={NAVY} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.22, 0.32, 24]} />
        <meshStandardMaterial color={YELLOW} transparent opacity={0.45} side={2} />
      </mesh>
    </group>
  );
};
