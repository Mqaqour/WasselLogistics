import type { Language } from '../../types';

export interface Bilingual {
  en: string;
  ar: string;
}

/** Resolve a bilingual string for the active language. */
export const pick = (value: Bilingual, lang: Language): string => (lang === 'en' ? value.en : value.ar);

export type StageId = 'intro' | 'shipments' | 'air' | 'sea' | 'cargo' | 'trucking' | 'domestic' | 'network';

export interface CameraKeyframe {
  /** Camera world position [x, y, z]. */
  position: [number, number, number];
  /** Point the camera looks at [x, y, z]. */
  lookAt: [number, number, number];
}

export interface StageConfig {
  id: StageId;
  /** 0-based position in the timeline; also used as the "center" scroll unit objects fade around. */
  index: number;
  /** Short label shown on the vertical progress rail. */
  dotLabel: Bilingual;
  eyebrow?: Bilingual;
  title: Bilingual;
  subtitle: Bilingual;
  badge?: Bilingual;
  /** Optional step chain, e.g. Pickup -> Hub -> City -> Delivery (domestic stage). */
  journey?: Bilingual[];
  camera: CameraKeyframe;
}

/** Mutable, non-reactive scroll progress shared between GSAP and the R3F render loop (0..1). */
export interface ProgressStore {
  progress: number;
}
