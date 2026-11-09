export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0..1 progress of time t between t0 and t1 (clamped). */
export const prog = (t: number, t0: number, t1: number) => (t1 <= t0 ? (t >= t1 ? 1 : 0) : clamp((t - t0) / (t1 - t0)));

export const linear = (x: number) => x;
export const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInCubic = (x: number) => x * x * x;
export const easeOutBack = (x: number, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);

export type Ease = (x: number) => number;

/** Damped spring that settles on 0: use as 1 + amp * spring(t - t0) for overshoot after a swap. */
export const spring = (dt: number, freq = 5, damping = 7) => (dt <= 0 ? 0 : Math.exp(-damping * dt) * Math.cos(2 * Math.PI * freq * dt));

/** Smooth bump 0 -> 1 -> 0 over [t0, t0 + dur]. */
export const bump = (t: number, t0: number, dur: number) => {
  const p = prog(t, t0, t0 + dur);
  return p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * p);
};

/** Grow in with overshoot, hold, then SHRINK away (outlined things never fade). */
export const popInOut = (t: number, t0: number, t1: number, inDur = 0.14, outDur = 0.12) => {
  if (t < t0 || t > t1) return 0;
  if (t < t0 + inDur) return easeOutBack(prog(t, t0, t0 + inDur));
  if (t > t1 - outDur) return 1 - easeInCubic(prog(t, t1 - outDur, t1));
  return 1;
};
