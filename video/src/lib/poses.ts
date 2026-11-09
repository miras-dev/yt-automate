import {bump, clamp, easeInOutCubic, easeOutCubic, prog, spring} from './easing';

/**
 * Cut-out pose changes. NEVER cross-fade two drawings: swap on the frame where motion hides it.
 * Every helper returns the transform for <Sprite scaleX scaleY rotate> plus `swapped` = show the new pose.
 */
export type PoseXf = {scaleX: number; scaleY: number; rotate: number; swapped: boolean; dy: number};
const still: PoseXf = {scaleX: 1, scaleY: 1, rotate: 0, swapped: false, dy: 0};

/** Turn: squash scaleX to 0.8 (scaleY 1.03) about the feet, swap at the narrowest frame. */
export const turnSwap = (t: number, at: number, dur = 0.2): PoseXf => {
  const p = prog(t, at - dur / 2, at + dur / 2);
  if (p <= 0) return still;
  if (p >= 1) return {...still, swapped: true};
  const s = Math.sin(Math.PI * p);
  return {scaleX: 1 - 0.2 * s, scaleY: 1 + 0.03 * s, rotate: 0, swapped: p >= 0.5, dy: 0};
};

/** Action: anticipation squash (Y 0.94, X 1.04) -> swap -> stretch 1.03 -> damped spring. */
export const actionSwap = (t: number, at: number, antic = 0.12): PoseXf => {
  if (t < at - antic) return still;
  if (t < at) {
    const p = easeInOutCubic(prog(t, at - antic, at));
    return {scaleX: 1 + 0.04 * p, scaleY: 1 - 0.06 * p, rotate: 0, swapped: false, dy: 0};
  }
  const k = spring(t - at, 4.5, 9);
  return {scaleX: 1 - 0.02 * k, scaleY: 1 + 0.03 * k, rotate: 0, swapped: true, dy: 0};
};

/** Throw: swap to the follow-through pose at the release, lean -5 deg -> +5 deg -> settle. */
export const throwSwap = (t: number, release: number, windup = 0.25): PoseXf => {
  if (t < release - windup) return still;
  if (t < release) {
    const p = easeInOutCubic(prog(t, release - windup, release));
    return {scaleX: 1, scaleY: 1 - 0.03 * p, rotate: -5 * p, swapped: false, dy: 0};
  }
  const dt = t - release;
  const lean = 5 * Math.exp(-6 * dt) * Math.cos(2 * Math.PI * 1.4 * dt);
  return {scaleX: 1, scaleY: 1 + 0.03 * spring(dt, 4, 8), rotate: lean, swapped: true, dy: 0};
};

/** Catch: swap to the holding pose on the frame the object reaches the hand, plus a small weight dip. */
export const catchSwap = (t: number, at: number, dip = 14): PoseXf => {
  if (t < at) return still;
  const dt = t - at;
  const k = Math.exp(-7 * dt) * Math.sin(2 * Math.PI * 2.2 * dt + Math.PI / 2);
  return {scaleX: 1 + 0.025 * k, scaleY: 1 - 0.04 * k, rotate: 0, swapped: true, dy: dip * Math.max(0, k)};
};

/** Pick the current pose from a list of [time, name] swaps (sorted): the last one whose time has passed. */
export const poseAt = <N extends string>(t: number, first: N, swaps: readonly (readonly [number, N])[]): N => {
  let p = first;
  for (const [at, name] of swaps) if (t >= at) p = name;
  return p;
};

/* Life on holds --------------------------------------------------------------------------------------------- */

/** Breathing: scaleY 1 +- 0.9 % at ~0.6 Hz (about the feet). */
export const breathe = (t: number, phase = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t + phase);

/** Tremble when scared: 1-2 px sines. Add to x / y. amount 0..1 fades it in and out. */
export const tremble = (t: number, amount = 1) => ({
  x: amount * (1.3 * Math.sin(2 * Math.PI * 17 * t) + 0.7 * Math.sin(2 * Math.PI * 23 * t + 1)),
  y: amount * (0.9 * Math.sin(2 * Math.PI * 19 * t + 2)),
});

/** A small bounce on a key word: returns -dy (px up) and a squash for the landing. */
export const wordBounce = (t: number, at: number, height = 18, dur = 0.28) => {
  const b = bump(t, at, dur);
  const land = spring(t - (at + dur), 5, 10);
  return {dy: -height * b, scaleY: 1 + 0.02 * b - 0.03 * (t > at + dur ? land : 0)};
};

/** Blink schedule for long holds: true while the eyes are shut (about every 3-4 s, 0.1 s long). */
export const blinking = (t: number, period = 3.4, phase = 0.7) => (t + phase) % period < 0.1;

/** Small idle sway so nothing freezes on long holds (degrees). */
export const idleSway = (t: number) => 0.6 * Math.sin(2 * Math.PI * 0.23 * t) + 0.3 * Math.sin(2 * Math.PI * 0.41 * t + 1.7);

/**
 * Talking mouth for long videos: which of the two mouth shapes to show, from words.json.
 * Returns 0 (closed / rest pose) or 1 (open pose) - a swap, not a blend. Alternates ~8 times a second inside words.
 */
export const talkShape = (t: number, words: readonly {start: number; end: number}[]) => {
  const w = words.find((x) => t >= x.start && t < x.end);
  if (!w) return 0;
  return Math.floor((t - w.start) * 8) % 2 === 0 ? 1 : 0;
};

export const settle = (t: number, at: number, dur = 0.4) => easeOutCubic(clamp((t - at) / dur));
