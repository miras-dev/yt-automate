import {clamp, easeInOutCubic, lerp, type Ease} from './easing';

/** Camera in world space. z moves towards the scene (the character plane is at depth 1000). */
export type Cam = {x: number; y: number; z: number};
export const F = 1000;
export const DEPTH = {foreground: 650, character: 1000, mid: 1800, far: 3000} as const;

/** Screen scale of a layer at `depth` for this camera. */
export const scaleAt = (cam: Cam, depth: number) => F / (depth - cam.z);

export type CamKey = Cam & {t: number; ease?: Ease};

/**
 * Piecewise eased camera path. Each key is a pose at time t (seconds); the ease of a key shapes the move INTO it
 * (default easeInOutCubic: glides; use easeOutCubic for a blast pull-back). Two keys with the same pose = a hold,
 * perfectly still. Scale is interpolated in log space, so a dolly feels constant. Keep glides >= 1 s.
 */
export const camPath = (keys: CamKey[], t: number, ref: number = DEPTH.character): Cam => {
  if (t <= keys[0].t) return {x: keys[0].x, y: keys[0].y, z: keys[0].z};
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (t <= b.t) {
      const e = (b.ease ?? easeInOutCubic)(clamp((t - a.t) / Math.max(1e-6, b.t - a.t)));
      const d = Math.exp(lerp(Math.log(ref - a.z), Math.log(ref - b.z), e));
      return {x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: ref - d};
    }
  }
  const last = keys[keys.length - 1];
  return {x: last.x, y: last.y, z: last.z};
};

/**
 * Camera shake: sums of sines x a decaying envelope. Never random per-frame jumps.
 * Returns an offset to add to cam.x / cam.y. amp in world px at the character plane.
 */
export const shake = (t: number, t0: number, amp = 14, dur = 0.5) => {
  const dt = t - t0;
  if (dt < 0 || dt > dur) return {x: 0, y: 0};
  const env = Math.pow(1 - dt / dur, 2);
  const x = Math.sin(2 * Math.PI * 13.3 * dt) * 0.6 + Math.sin(2 * Math.PI * 7.1 * dt + 1.3) * 0.4;
  const y = Math.sin(2 * Math.PI * 11.7 * dt + 0.7) * 0.6 + Math.sin(2 * Math.PI * 5.3 * dt + 2.1) * 0.4;
  return {x: x * amp * env, y: y * amp * env};
};

export const addShake = (cam: Cam, ...s: {x: number; y: number}[]): Cam => ({
  x: cam.x + s.reduce((a, b) => a + b.x, 0),
  y: cam.y + s.reduce((a, b) => a + b.y, 0),
  z: cam.z,
});

/**
 * Depth of field: blur (px) for a far layer, only while the camera is close on the character.
 * closeness 0 at z <= zWide, 1 at z >= zClose. Far layers get 2.5-3.6 px.
 */
export const dofBlur = (cam: Cam, depth: number, zWide = 0, zClose = 350, max = 3.6) => {
  const c = clamp((cam.z - zWide) / Math.max(1, zClose - zWide));
  const far = clamp((depth - DEPTH.character) / (DEPTH.far - DEPTH.character));
  const b = c * far * max;
  return b < 0.3 ? 0 : b;
};
