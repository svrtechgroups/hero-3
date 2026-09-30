export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0 before a, 1 after b, smoothstepped in between. */
export const range = (s: number, a: number, b: number) => smooth(clamp01((s - a) / (b - a)));

/** Smooth bell: 1 at c, 0 at c±w. */
export const bump = (s: number, c: number, w: number) => {
  const d = Math.abs(s - c) / w;
  return d >= 1 ? 0 : smooth(1 - d);
};

/** Frame-rate independent exponential smoothing. */
export const damp = (a: number, b: number, lambda: number, dt: number) => lerp(a, b, 1 - Math.exp(-lambda * dt));

/** Wraps v into [-h/2, h/2) — used for endless parallax layers. */
export const wrap = (v: number, h: number) => ((((v + h / 2) % h) + h) % h) - h / 2;
