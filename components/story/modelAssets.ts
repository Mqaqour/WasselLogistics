/**
 * Central registry of external GLB model URLs used by the story scene.
 * Keep every model path here instead of scattering literal strings across
 * `SceneObjects.tsx` — swapping an asset (e.g. a licensed replacement for a
 * placeholder) is then a one-line change.
 *
 * Files live in `public/assets/models/` — see `ATTRIBUTIONS.md` in that
 * folder for the license/source of each current placeholder model.
 */
export const MODEL_ASSETS = {
  cargoPlane: '/assets/models/cargo-plane.glb',
  containerShip: '/assets/models/container-ship.glb',
  freightTruck: '/assets/models/freight-truck.glb',
} as const;

/** Real NASA Blue Marble texture, shared with the hero's CSS globe — see public/assets/earth/ATTRIBUTIONS.md. */
export const EARTH_TEXTURE_URL = '/assets/earth/earth-daymap.jpg';
