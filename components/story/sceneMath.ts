/** Triangular falloff: 1 at `center`, fading linearly to 0 at `center ± spread`. */
export function tentWeight(value: number, center: number, spread: number): number {
  if (spread <= 0) return value === center ? 1 : 0;
  const distance = Math.abs(value - center);
  return Math.max(0, 1 - distance / spread);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpTuple3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** Frame-rate independent exponential smoothing factor for `Vector3.lerp` inside useFrame. */
export function dampingFactor(delta: number, halfLifeSeconds = 0.35): number {
  return 1 - Math.pow(0.5, delta / halfLifeSeconds);
}
