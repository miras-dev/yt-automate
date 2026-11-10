import React from 'react';
import {random} from 'remotion';
import {clamp, easeOutCubic, popInOut, prog} from './easing';
import {FONT_FAMILY, FONT_WEIGHT} from './fonts';
import {ballistic} from './physics';

/**
 * Effects drawn in code, in the same flat cartoon look as the pictures.
 * Rules: same outline weight as the pictures; flat colours; no gradients on characters; outlined things grow and
 * SHRINK away, never fade; an effect returns null when its beat is over.
 * All positions are world px (put the effect inside a <Layer>). All randomness is seeded: same frame, same picture.
 */
export const INK = '#111';
export const OUTLINE = 7;
export const LAVA = {main: '#FF6A2B', edge: '#E2501E', core: '#FFA445', hot: '#FFC867'};

type Pt = {x: number; y: number; r: number};

/** Circle cluster with ONE merged outline: all ink circles first, then all fills. White = steam, mid-grey = smoke. */
export const Cloud: React.FC<{blobs: Pt[]; fill?: string; shade?: string; outline?: number}> = ({blobs, fill = '#fff', shade, outline = OUTLINE}) => {
  const live = blobs.filter((b) => b.r > 0.5);
  if (!live.length) return null;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      {live.map((b, i) => (
        <circle key={`o${i}`} cx={b.x} cy={b.y} r={b.r + outline} fill={INK} />
      ))}
      {shade ? live.map((b, i) => <circle key={`s${i}`} cx={b.x} cy={b.y} r={b.r} fill={shade} />) : null}
      {live.map((b, i) => (
        <circle key={`f${i}`} cx={b.x - (shade ? b.r * 0.12 : 0)} cy={b.y - (shade ? b.r * 0.12 : 0)} r={shade ? b.r * 0.86 : b.r} fill={fill} />
      ))}
    </svg>
  );
};

/**
 * A puff of gas (smoke, steam, breath, dust) born at `at`: rises, spreads, then every circle shrinks away.
 * Use several with different `at`, `speed` and `seed` for pulses with gaps.
 */
export const Puff: React.FC<{
  t: number;
  at: number;
  x: number;
  y: number;
  life?: number;
  size?: number;
  rise?: number;
  drift?: number;
  count?: number;
  fill?: string;
  shade?: string;
  seed?: string | number;
}> = ({t, at, x, y, life = 1.4, size = 60, rise = 220, drift = 0, count = 5, fill = '#fff', shade, seed = 'puff'}) => {
  const age = t - at;
  if (age < 0 || age > life) return null;
  const p = age / life;
  const grow = popInOut(t, at, at + life, 0.18, life * 0.45);
  const blobs: Pt[] = Array.from({length: count}, (_, i) => {
    const a = random(`${seed}-a${i}`) * Math.PI * 2;
    const d = random(`${seed}-d${i}`) * size * (0.5 + p * 0.7);
    return {
      x: x + drift * p + Math.cos(a) * d,
      y: y - rise * easeOutCubic(p) + Math.sin(a) * d * 0.6,
      r: size * (0.55 + 0.5 * random(`${seed}-r${i}`)) * grow,
    };
  });
  return <Cloud blobs={blobs} fill={fill} shade={shade} />;
};

/** A smoke ring (smug): a flat outlined ring that rises, widens and shrinks its stroke to nothing. */
export const SmokeRing: React.FC<{t: number; at: number; x: number; y: number; life?: number; fill?: string}> = ({t, at, x, y, life = 1.6, fill = '#b9b4ae'}) => {
  const age = t - at;
  if (age < 0 || age > life) return null;
  const p = age / life;
  const rx = 40 + 90 * easeOutCubic(p);
  const stroke = 26 * (1 - p * p);
  if (stroke < 1) return null;
  const cy = y - 260 * p;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      <ellipse cx={x} cy={cy} rx={rx} ry={rx * 0.38} fill="none" stroke={INK} strokeWidth={stroke + OUTLINE * 2} />
      <ellipse cx={x} cy={cy} rx={rx} ry={rx * 0.38} fill="none" stroke={fill} strokeWidth={stroke} />
    </svg>
  );
};

/**
 * Liquid drops / sparks / crumbs: a burst of particles with random angle and speed, under gravity (use a negative
 * gravity for bubbles and embers). Blobs have no outline (liquids: deep edge colour + lighter core), are stretched
 * along their velocity and shrink over their life.
 *   spread: [minDeg, maxDeg] measured from "up" (0 = straight up, -90 = left, 90 = right)
 */
export const Burst: React.FC<{
  t: number;
  at: number;
  x: number;
  y: number;
  count?: number;
  speed?: [number, number];
  spread?: [number, number];
  gravity?: number;
  life?: [number, number];
  size?: [number, number];
  color?: string;
  core?: string;
  stretch?: number;
  floorY?: number;
  seed?: string | number;
}> = ({t, at, x, y, count = 14, speed = [500, 1300], spread = [-60, 60], gravity = 2600, life = [0.5, 1.0], size = [10, 24], color = LAVA.edge, core = LAVA.core, stretch = 1, floorY, seed = 'burst'}) => {
  const age = t - at;
  if (age < 0 || age > life[1] + 0.3) return null;
  const parts = Array.from({length: count}, (_, i) => {
    const r1 = random(`${seed}-1-${i}`);
    const r2 = random(`${seed}-2-${i}`);
    const r3 = random(`${seed}-3-${i}`);
    const r4 = random(`${seed}-4-${i}`);
    const ang = ((spread[0] + (spread[1] - spread[0]) * r1) * Math.PI) / 180;
    const v = speed[0] + (speed[1] - speed[0]) * r2;
    const L = life[0] + (life[1] - life[0]) * r3;
    const rad = size[0] + (size[1] - size[0]) * r4;
    let b = ballistic(x, y, Math.sin(ang) * v, -Math.cos(ang) * v, age, gravity);
    let landedFor = -1;
    if (floorY !== undefined && b.y >= floorY && b.vy > 0) {
      // time of landing: solve y(t) = floorY
      const vy0 = -Math.cos(ang) * v;
      const tl = (-vy0 + Math.sqrt(Math.max(0, vy0 * vy0 + 2 * gravity * (floorY - y)))) / gravity;
      landedFor = age - tl;
      b = {...ballistic(x, y, Math.sin(ang) * v, vy0, tl, gravity), vx: 0, vy: 0};
    }
    return {b, L, rad, landedFor};
  });
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      {parts.map(({b, L, rad, landedFor}, i) => {
        if (landedFor >= 0) {
          // a splat that shrinks away
          const k = 1 - clamp(landedFor / 0.5);
          if (k <= 0.02) return null;
          return <ellipse key={i} cx={b.x} cy={b.y} rx={rad * 1.8 * k} ry={rad * 0.5 * k} fill={color} />;
        }
        const k = 1 - clamp(age / L);
        if (k <= 0.02) return null;
        const sp = Math.hypot(b.vx, b.vy);
        const st = 1 + clamp(sp / 2200) * 0.9 * stretch;
        const rot = (Math.atan2(b.vy, b.vx) * 180) / Math.PI;
        return (
          <g key={i} transform={`translate(${b.x} ${b.y}) rotate(${rot})`}>
            <ellipse rx={rad * k * st} ry={(rad * k) / Math.sqrt(st)} fill={color} />
            {core ? <ellipse rx={rad * k * st * 0.55} ry={((rad * k) / Math.sqrt(st)) * 0.55} fill={core} /> : null}
          </g>
        );
      })}
    </svg>
  );
};

/**
 * Eruption / blast "crown": pulsing fingers fanning out from (x, y), never one tall column. Flat liquid look.
 * Runs from `at` for `dur` seconds: grows fast, pulses, then shrinks back.
 */
export const Crown: React.FC<{t: number; at: number; dur?: number; x: number; y: number; fingers?: number; height?: number; width?: number; colors?: typeof LAVA; seed?: string | number}> = ({
  t,
  at,
  dur = 1.6,
  x,
  y,
  fingers = 7,
  height = 520,
  width = 90,
  colors = LAVA,
  seed = 'crown',
}) => {
  const k = popInOut(t, at, at + dur, 0.16, 0.35);
  if (k <= 0) return null;
  const finger = (scale: number, fill: string) =>
    Array.from({length: fingers}, (_, i) => {
      const u = fingers === 1 ? 0.5 : i / (fingers - 1);
      const ang = -62 + 124 * u + (random(`${seed}-a${i}`) - 0.5) * 10;
      const pulse = 0.82 + 0.18 * Math.sin(2 * Math.PI * (2.2 + random(`${seed}-f${i}`) * 1.6) * (t - at) + i * 1.7);
      const len = height * (0.55 + 0.45 * Math.cos(((u - 0.5) * Math.PI) / 1.25)) * pulse * k * scale;
      const w = width * (0.75 + 0.5 * random(`${seed}-w${i}`)) * scale;
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${ang})`}>
          <path d={`M ${-w / 2} 0 Q ${-w / 2} ${-len * 0.7} 0 ${-len} Q ${w / 2} ${-len * 0.7} ${w / 2} 0 Z`} fill={fill} />
        </g>
      );
    });
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      {finger(1, colors.edge)}
      {finger(0.82, colors.main)}
      {finger(0.5, colors.core)}
    </svg>
  );
};

/** Impact: a flat star burst for 4-6 frames + a few speed lines. Add shake() to the camera on the same T. */
export const Impact: React.FC<{t: number; at: number; x: number; y: number; size?: number; color?: string; points?: number; fps?: number}> = ({t, at, x, y, size = 150, color = '#fff', points = 9, fps = 60}) => {
  const f = Math.floor((t - at) * fps + 1e-6);
  if (f < 0 || f > 5) return null;
  const k = [0.6, 1, 1.12, 1.05, 0.8, 0.45][f];
  const star = Array.from({length: points * 2}, (_, i) => {
    const a = (Math.PI * i) / points - Math.PI / 2;
    const r = (i % 2 === 0 ? size : size * 0.48) * k;
    return `${x + Math.cos(a) * r},${y + Math.sin(a) * r}`;
  }).join(' ');
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      <polygon points={star} fill={color} stroke={INK} strokeWidth={OUTLINE} strokeLinejoin="round" />
      {Array.from({length: 6}, (_, i) => {
        const a = (Math.PI * 2 * i) / 6 + 0.4;
        const r0 = size * 1.25 * k;
        const r1 = size * (1.6 + 0.25 * (i % 2)) * k;
        return <line key={i} x1={x + Math.cos(a) * r0} y1={y + Math.sin(a) * r0} x2={x + Math.cos(a) * r1} y2={y + Math.sin(a) * r1} stroke={INK} strokeWidth={OUTLINE} strokeLinecap="round" />;
      })}
    </svg>
  );
};

/** Speed lines behind something fast: a few short strokes along `angle` (deg) that shrink away. */
export const SpeedLines: React.FC<{t: number; at: number; x: number; y: number; angle?: number; length?: number; count?: number; life?: number; seed?: string | number}> = ({t, at, x, y, angle = 0, length = 160, count = 4, life = 0.25, seed = 'speed'}) => {
  const p = prog(t, at, at + life);
  if (t < at || p >= 1) return null;
  const a = (angle * Math.PI) / 180;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      {Array.from({length: count}, (_, i) => {
        const off = (i - (count - 1) / 2) * 34;
        const len = length * (0.6 + 0.4 * random(`${seed}-${i}`)) * (1 - p);
        const sx = x - Math.sin(a) * off - Math.cos(a) * length * p;
        const sy = y + Math.cos(a) * off - Math.sin(a) * length * p;
        return <line key={i} x1={sx} y1={sy} x2={sx - Math.cos(a) * len} y2={sy - Math.sin(a) * len} stroke={INK} strokeWidth={OUTLINE} strokeLinecap="round" />;
      })}
    </svg>
  );
};

/** Sweat drop: a light-blue outlined teardrop with a glint; pops on, slides down, pops off. */
export const SweatDrop: React.FC<{t: number; at: number; x: number; y: number; life?: number; slide?: number; size?: number}> = ({t, at, x, y, life = 1.1, slide = 70, size = 26}) => {
  const k = popInOut(t, at, at + life, 0.1, 0.08);
  if (k <= 0) return null;
  const dy = slide * prog(t, at + 0.15, at + life);
  return (
    <svg style={{position: 'absolute', left: x - size * 2, top: y + dy - size * 2, overflow: 'visible', transform: `scale(${k})`, transformOrigin: `${size * 2}px ${size * 2}px`}} width={size * 4} height={size * 4}>
      <path
        d={`M ${size * 2} ${size * 0.7} C ${size * 2.9} ${size * 1.9} ${size * 3} ${size * 3.1} ${size * 2} ${size * 3.2} C ${size} ${size * 3.1} ${size * 1.1} ${size * 1.9} ${size * 2} ${size * 0.7} Z`}
        fill="#9fdcff"
        stroke={INK}
        strokeWidth={OUTLINE}
        strokeLinejoin="round"
      />
      <ellipse cx={size * 1.7} cy={size * 2.3} rx={size * 0.16} ry={size * 0.3} fill="#fff" />
    </svg>
  );
};

/** Energy: a zig-zag polyline redrawn every few frames (electricity). Stops when the beat is over. */
export const ZigZag: React.FC<{t: number; from: number; to: number; x1: number; y1: number; x2: number; y2: number; color?: string; jag?: number; segments?: number; hold?: number; fps?: number; seed?: string | number}> = ({t, from, to, x1, y1, x2, y2, color = '#ffe94a', jag = 46, segments = 7, hold = 3, fps = 60, seed = 'zap'}) => {
  if (t < from || t > to) return null;
  const step = Math.floor((t * fps) / hold);
  const pts = Array.from({length: segments + 1}, (_, i) => {
    const u = i / segments;
    const nx = -(y2 - y1);
    const ny = x2 - x1;
    const n = Math.hypot(nx, ny) || 1;
    const j = i === 0 || i === segments ? 0 : (random(`${seed}-${step}-${i}`) - 0.5) * 2 * jag;
    return `${x1 + (x2 - x1) * u + (nx / n) * j},${y1 + (y2 - y1) * u + (ny / n) * j}`;
  }).join(' ');
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      <polyline points={pts} fill="none" stroke={INK} strokeWidth={OUTLINE * 2 + 8} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

/** Glow (heat, light, sky glow): a radial gradient at LOW opacity. Never on characters. */
export const Glow: React.FC<{x: number; y: number; r: number; color?: string; opacity?: number}> = ({x, y, r, color = '#ffb04a', opacity = 0.35}) =>
  opacity <= 0.01 ? null : (
    <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity}} />
  );

/**
 * Flow (lava stream, water, slime): a thick round-capped path revealed along its length; deep colour under, main,
 * hot core on top. `d` is an SVG path in world px - route it around faces. reveal 0..1.
 */
export const Flow: React.FC<{d: string; reveal: number; width?: number; colors?: {edge: string; main: string; core: string}}> = ({d, reveal, width = 70, colors = LAVA}) => {
  const r = clamp(reveal);
  if (r <= 0) return null;
  const layer = (w: number, c: string) => <path d={d} pathLength={1} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${r} 1`} />;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      {layer(width, colors.edge)}
      {layer(width * 0.72, colors.main)}
      {layer(width * 0.3, colors.core)}
    </svg>
  );
};

/** Clip children above a liquid surface: everything below world y is hidden (sinking props). */
export const ClipAbove: React.FC<{y: number; children: React.ReactNode}> = ({y, children}) => (
  <div style={{position: 'absolute', left: -20000, top: -20000, width: 40000, height: 20000 + y, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 20000, top: 20000}}>{children}</div>
  </div>
);

/** On-screen label or number (long videos only, when it helps the explanation): flat, same outline. */
export const Label: React.FC<{t: number; from: number; to: number; x: number; y: number; text: string; size?: number; color?: string; bg?: string}> = ({t, from, to, x, y, text, size = 64, color = INK, bg = '#fff'}) => {
  const k = popInOut(t, from, to);
  if (k <= 0) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${k})`, background: bg, color, border: `${OUTLINE}px solid ${INK}`, borderRadius: size * 0.45, padding: `${size * 0.2}px ${size * 0.5}px`, fontFamily: FONT_FAMILY, fontWeight: FONT_WEIGHT, fontSize: size, lineHeight: 1.1, whiteSpace: 'nowrap'}}>
      {text}
    </div>
  );
};
