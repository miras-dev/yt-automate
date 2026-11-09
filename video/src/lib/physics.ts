import {clamp} from './easing';

export type P3 = {x: number; y: number; z: number};

/**
 * 3D projectile for a thrown prop: x and z move at constant speed, y follows a gravity parabola whose apex is at
 * apexFrac of the flight. (y grows downwards, so the apex has the smallest y.) Perspective does the shrinking:
 * draw the prop in a <Layer z={pos.z}>.
 *   const fly = projectile({x: 620, y: 700, z: 1000}, {x: 540, y: 880, z: 3000}, 1.1, 0.4);
 *   const p = fly.at(t - T.release);   // p.x, p.y, p.z, p.spin (deg), p.done
 * A return flight must end EXACTLY on the object drawn in the next pose: use spritePoint() for `to`.
 */
export const projectile = (from: P3, to: P3, flight: number, apexFrac = 0.4, turns = 1) => {
  const ta = clamp(apexFrac, 0.05, 0.95) * flight;
  const denom = ta * ta - (flight - ta) * (flight - ta);
  // apex exactly in the middle needs equal heights; nudge to keep the maths finite
  const g = Math.abs(denom) < 1e-6 ? 0 : (2 * (from.y - to.y)) / denom;
  const ya = from.y - 0.5 * g * ta * ta;
  const at = (tau: number) => {
    const u = clamp(tau, 0, flight);
    const k = u / flight;
    return {
      x: from.x + (to.x - from.x) * k,
      y: g === 0 ? from.y + (to.y - from.y) * k : ya + 0.5 * g * (u - ta) * (u - ta),
      z: from.z + (to.z - from.z) * k,
      spin: 360 * turns * k,
      flying: tau >= 0 && tau <= flight,
      done: tau > flight,
    };
  };
  return {at, g, apexY: ya, flight};
};

/** Simple 2D ballistic particle: position at age (s) with gravity (px/s^2). */
export const ballistic = (x0: number, y0: number, vx: number, vy: number, age: number, gravity = 2600) => ({
  x: x0 + vx * age,
  y: y0 + vy * age + 0.5 * gravity * age * age,
  vx,
  vy: vy + gravity * age,
});

/** Sinking into liquid: keeps moving down with a wobble. Wrap the prop in <ClipAbove y={surface}>. */
export const sink = (t: number, at: number, depth = 220, dur = 1.2) => {
  const p = clamp((t - at) / dur);
  return {dy: depth * p, rotate: 6 * Math.sin(2 * Math.PI * 1.3 * (t - at)) * (1 - p)};
};

/** Height (world y) of a set piece's top edge at world x, from the profile prep.py measured (--profile NAME). */
export const surfaceY = (profile: readonly (readonly number[])[], spriteX: number, originX = 0, originY = 0, scale = 1) => {
  const lx = (spriteX - originX) / scale;
  if (!profile.length) return originY;
  let best = profile[0];
  for (const p of profile) if (Math.abs(p[0] - lx) < Math.abs(best[0] - lx)) best = p;
  return originY + best[1] * scale;
};
