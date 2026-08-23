import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, MeshReflectorMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { ProgressStore } from './types';
import { STAGES, STAGE_COUNT } from './stagesConfig';
import { dampingFactor, lerpTuple3 } from './sceneMath';
import {
  Globe,
  LogisticsHub,
  DocumentEnvelope,
  ParcelBox,
  Pallet,
  CargoContainer,
  CargoPlane,
  CloudPuff,
  Ocean,
  CargoShip,
  PortCrane,
  Warehouse,
  Forklift,
  Road,
  DeliveryVan,
  FreightTruck,
  CityBlock,
  MapPinMarker,
} from './SceneObjects';

/** Moves/aims the camera along the stage keyframes, smoothly interpolating between them every frame. */
const CameraRig: React.FC<{ store: ProgressStore }> = ({ store }) => {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(...STAGES[0].camera.position));
  const targetLookAt = useRef(new THREE.Vector3(...STAGES[0].camera.lookAt));
  const currentLookAt = useRef(new THREE.Vector3(...STAGES[0].camera.lookAt));

  useFrame((_, delta) => {
    const stageProgress = THREE.MathUtils.clamp(store.progress, 0, 1) * (STAGE_COUNT - 1);
    const index = Math.min(Math.floor(stageProgress), STAGE_COUNT - 1);
    const nextIndex = Math.min(index + 1, STAGE_COUNT - 1);
    const fraction = stageProgress - index;

    const current = STAGES[index];
    const next = STAGES[nextIndex];

    targetPosition.current.set(...lerpTuple3(current.camera.position, next.camera.position, fraction));
    targetLookAt.current.set(...lerpTuple3(current.camera.lookAt, next.camera.lookAt, fraction));

    const smoothing = dampingFactor(Math.min(delta, 0.1), 0.4);
    camera.position.lerp(targetPosition.current, smoothing);
    currentLookAt.current.lerp(targetLookAt.current, smoothing);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};

/** Soft, glossy "product page" floor under the intro/hub cluster — skipped on lowPower devices. */
const ReflectiveGround: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.42, 0]} receiveShadow>
    <circleGeometry args={[9, 48]} />
    <MeshReflectorMaterial
      color="#012a44"
      roughness={0.55}
      metalness={0.3}
      blur={[300, 100]}
      mixBlur={0.9}
      mixStrength={35}
      resolution={512}
      depthScale={0.4}
      minDepthThreshold={0.85}
      mirror={0}
    />
  </mesh>
);

/** Cheaper matte fallback ground used on lowPower devices. */
const MatteGround: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.42, 0]}>
    <circleGeometry args={[9, 24]} />
    <meshStandardMaterial color="#012a44" roughness={0.9} />
  </mesh>
);

interface WasselSceneProps {
  store: ProgressStore;
  /** Disables shadows, reflections, and post-processing on constrained devices. */
  lowPower?: boolean;
}

/**
 * Pure scene content (no <Canvas> here — see `DesktopStoryExperience`).
 * Every logistics object below is positioned once and then fades in/out on
 * its own around a stage index via `useFadeGroup`; the camera sweeps through
 * the same 8 stage keyframes defined in `stagesConfig.ts`.
 */
export const WasselScene: React.FC<WasselSceneProps> = ({ store, lowPower = false }) => {
  return (
    <>
      <color attach="background" args={[0x00131f]} />
      <fog attach="fog" args={[0x00131f, 13, 34]} />

      {/* Lighting rig: warm key light, cool rim light for depth, soft ambient fill */}
      <ambientLight intensity={0.5} color={0xdbe9ff} />
      <directionalLight
        position={[7, 11, 6]}
        intensity={1.35}
        color={0xfff4e0}
        castShadow={!lowPower}
        shadow-mapSize={lowPower ? undefined : [1024, 1024]}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-8, 5, -6]} intensity={0.4} color={0x5ea8ff} />
      <pointLight position={[-7, 4, -3]} intensity={0.5} color={0xffcd00} distance={16} />

      <CameraRig store={store} />

      {lowPower ? <MatteGround /> : <ReflectiveGround />}
      {!lowPower && (
        <ContactShadows position={[0, -1.4, 0]} opacity={0.55} scale={20} blur={2.4} far={4} frames={1} />
      )}

      {/* Scene 1 — Intro */}
      <Globe store={store} center={0} spread={1.15} position={[0, 1.5, 0]} />

      {/* Scene 2 — Shipment prep */}
      <LogisticsHub store={store} center={1} spread={1.3} position={[0, -1.3, 0]} />
      <DocumentEnvelope store={store} center={0.75} spread={0.85} position={[-2.6, -1.05, 1.8]} />
      <ParcelBox store={store} center={0.9} spread={0.85} position={[-1.3, -1.1, 2.1]} scale={0.8} />
      <ParcelBox store={store} center={1.05} spread={0.85} position={[0.5, -1.1, 2.3]} scale={1.05} />
      <Pallet store={store} center={1.2} spread={0.85} position={[2.1, -1.42, 1.6]} />
      <CargoContainer store={store} center={1.35} spread={0.85} position={[3.6, -1.05, 0.4]} scale={0.6} rotation={[0, 0.3, 0]} />

      {/* Scene 3 — Air */}
      <CargoPlane store={store} center={2} spread={1.3} position={[5, 3.4, 3]} />
      <CloudPuff store={store} center={1.9} spread={1.4} position={[2.6, 4.4, 0.5]} scale={1.2} />
      <CloudPuff store={store} center={2.3} spread={1.4} position={[7.4, 3.2, 5.5]} scale={0.9} />

      {/* Scene 4 — Sea */}
      <Ocean store={store} center={3} spread={1.4} position={[-6.5, -1.44, 4]} />
      <CargoShip store={store} center={3} spread={1.25} position={[-6.5, -1.05, 5]} />
      <PortCrane store={store} center={3.15} spread={1.1} position={[-9.6, -1.05, 3]} />

      {/* Scene 5 — Cargo / warehouse */}
      <Warehouse store={store} center={4} spread={1.3} position={[2, -1.1, -8]} />
      {!lowPower && (
        <ContactShadows position={[1.5, -1.41, -7]} opacity={0.5} scale={12} blur={2} far={3} frames={1} />
      )}
      <Forklift store={store} center={4.15} spread={1.05} position={[-0.6, -1.42, -6]} rotation={[0, 0.5, 0]} />
      <Pallet store={store} center={4.3} spread={1.05} position={[0.8, -1.42, -6.6]} scale={0.85} />
      <CargoContainer store={store} center={4.45} spread={1.05} position={[4.1, -1.05, -7.6]} scale={0.85} rotation={[0, -0.4, 0]} />

      {/* Scene 6 — Trucking */}
      <Road store={store} center={5} spread={1.3} position={[-8, -1.4, -3]} />
      <DeliveryVan store={store} center={5} spread={1.1} position={[-9.6, -1.05, -2.4]} rotation={[0, 0.2, 0]} />
      <FreightTruck store={store} center={5.35} spread={1.1} position={[-6.4, -1.05, -3.6]} rotation={[0, 0.15, 0]} />

      {/* Scene 7 — Domestic / city */}
      <CityBlock store={store} center={6} spread={1.3} position={[0, -1.3, 4]} />
      <DeliveryVan store={store} center={6.2} spread={1.05} position={[1.6, -0.95, 6.4]} scale={0.7} />
      <MapPinMarker store={store} center={5.95} spread={1.1} position={[-2.2, -0.9, 4.6]} />
      <MapPinMarker store={store} center={6.35} spread={1.1} position={[2.6, -0.9, 6.8]} />

      {/* Scene 8 — Complete network: smaller versions of every mode, together */}
      <CargoPlane store={store} center={7} spread={1.1} position={[6, 5.4, -2]} scale={0.45} />
      <CargoShip store={store} center={7} spread={1.1} position={[-7.5, -0.6, 2]} scale={0.45} />
      <FreightTruck store={store} center={7} spread={1.1} position={[3.2, -1, 6.5]} scale={0.55} rotation={[0, -0.5, 0]} />
      <DeliveryVan store={store} center={7} spread={1.1} position={[-3.2, -1, 6.5]} scale={0.55} rotation={[0, 0.5, 0]} />
      <LogisticsHub store={store} center={7} spread={1.1} position={[0, -1.3, 0]} scale={0.55} />

      {!lowPower && (
        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={0.65} luminanceSmoothing={0.3} mipmapBlur intensity={0.55} radius={0.6} />
          <Vignette eskil={false} offset={0.15} darkness={0.55} />
        </EffectComposer>
      )}
    </>
  );
};
