import React from 'react';
import {clamp, easeOutBack, prog} from './easing';

const INK = '#111';

/**
 * A face on an object: white ellipses + black pupils + glint, eyelids clipped to the eye with a black lid line.
 *   open    0..1  (use eyesPop() to pop open with overshoot; 0 = no eyes at all)
 *   lid     0..1  how far the upper lid is down (0.5 = smug half lids, 1 = shut / blink)
 *   tilt    degrees, inner ends down = angry
 *   look    {x, y} -1..1 where the pupils point (look at the action)
 *   squeeze true = "> <" eyes
 *   brows   true = thick round brows; browLift px
 * Position (x, y) is the middle between the eyes in world px; r = eye radius.
 */
export const Eyes: React.FC<{
  x: number;
  y: number;
  r?: number;
  gap?: number;
  open?: number;
  lid?: number;
  tilt?: number;
  look?: {x: number; y: number};
  squeeze?: boolean;
  brows?: boolean;
  browLift?: number;
  outline?: number;
}> = ({x, y, r = 34, gap = 30, open = 1, lid = 0, tilt = 0, look = {x: 0, y: 0}, squeeze = false, brows = false, browLift = 0, outline = 7}) => {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  if (open <= 0.01) return null;
  const w = r * 2 + gap + r * 2 + outline * 2 + 40;
  const h = r * 3.4 + outline * 2 + 40;
  const cy = h / 2 + 10;
  const eye = (side: -1 | 1, i: number) => {
    const cx = w / 2 + side * (gap / 2 + r);
    const id = `eyeclip-${uid}-${i}`;
    if (squeeze) {
      const d = r * 0.8;
      // "> <": two strokes meeting towards the nose
      const pts = `${cx - side * d},${cy - d} ${cx + side * d * 0.2},${cy} ${cx - side * d},${cy + d}`;
      return <polyline key={i} points={pts} fill="none" stroke={INK} strokeWidth={outline + 2} strokeLinecap="round" strokeLinejoin="round" />;
    }
    const ry = r * 1.18;
    const lidY = cy - ry + 2 * ry * clamp(lid);
    const px = cx + clamp(look.x, -1, 1) * r * 0.38;
    const py = cy + clamp(look.y, -1, 1) * ry * 0.38;
    const tiltDeg = -side * tilt;
    return (
      <g key={i}>
        <clipPath id={id}>
          <ellipse cx={cx} cy={cy} rx={r} ry={ry} />
        </clipPath>
        <ellipse cx={cx} cy={cy} rx={r} ry={ry} fill="#fff" stroke={INK} strokeWidth={outline} />
        <g clipPath={`url(#${id})`}>
          <circle cx={px} cy={py} r={r * 0.46} fill={INK} />
          <circle cx={px - r * 0.16} cy={py - r * 0.18} r={r * 0.13} fill="#fff" />
          {lid > 0.01 || tilt !== 0 ? (
            <g transform={`rotate(${tiltDeg} ${cx} ${lidY})`}>
              <rect x={cx - r * 2} y={lidY - ry * 3} width={r * 4} height={ry * 3} fill="#e9e2d8" />
              <line x1={cx - r * 2} y1={lidY} x2={cx + r * 2} y2={lidY} stroke={INK} strokeWidth={outline} />
            </g>
          ) : null}
        </g>
        <ellipse cx={cx} cy={cy} rx={r} ry={ry} fill="none" stroke={INK} strokeWidth={outline} />
        {brows ? (
          <line
            x1={cx - r * 0.8}
            y1={cy - ry - 16 - browLift + (side * tilt * r) / 60}
            x2={cx + r * 0.8}
            y2={cy - ry - 16 - browLift - (side * tilt * r) / 60}
            stroke={INK}
            strokeWidth={outline + 4}
            strokeLinecap="round"
          />
        ) : null}
      </g>
    );
  };
  return (
    <svg
      width={w}
      height={h}
      style={{position: 'absolute', left: x - w / 2, top: y - cy, overflow: 'visible', transform: `scale(${open})`, transformOrigin: `${w / 2}px ${cy}px`}}
    >
      {eye(-1, 0)}
      {eye(1, 1)}
    </svg>
  );
};

/** Eyes pop open with overshoot at `at`; 0 before. Feed into <Eyes open=...>. */
export const eyesPop = (t: number, at: number, dur = 0.16) => (t < at ? 0 : easeOutBack(prog(t, at, at + dur), 2.4));

/** Lid value for a blink at `at` (0.1 s). Combine: lid = Math.max(base, blink(t, T.blink)). */
export const blink = (t: number, at: number, dur = 0.1) => (t >= at && t < at + dur ? 1 : 0);

/** An object inhales before a blast (stretch up 6 %) and squashes to 0.9 on it. Returns scaleY about its base. */
export const inhaleBlast = (t: number, blast: number, inhale = 0.5) => {
  if (t < blast - inhale) return 1;
  if (t < blast) return 1 + 0.06 * prog(t, blast - inhale, blast);
  const dt = t - blast;
  return 1 - 0.1 * Math.exp(-5 * dt) * Math.cos(2 * Math.PI * 3 * dt);
};

/** Simple mouth: a line (smile > 0 curves up), or an open oval with a pink tongue when open > 0. */
export const Mouth: React.FC<{x: number; y: number; width?: number; smile?: number; open?: number; outline?: number}> = ({
  x,
  y,
  width = 60,
  smile = 0.3,
  open = 0,
  outline = 7,
}) => (
  <svg width={width + 40} height={width + 40} style={{position: 'absolute', left: x - width / 2 - 20, top: y - width / 2 - 20, overflow: 'visible'}}>
    {open > 0.05 ? (
      <g>
        <ellipse cx={width / 2 + 20} cy={width / 2 + 20} rx={width * 0.36} ry={width * 0.42 * open} fill="#3a1418" stroke={INK} strokeWidth={outline} />
        <ellipse cx={width / 2 + 20} cy={width / 2 + 20 + width * 0.2 * open} rx={width * 0.2} ry={width * 0.14 * open} fill="#ff8fa3" />
      </g>
    ) : (
      <path
        d={`M 20 ${width / 2 + 20} Q ${width / 2 + 20} ${width / 2 + 20 + smile * width * 0.6} ${width + 20} ${width / 2 + 20}`}
        fill="none"
        stroke={INK}
        strokeWidth={outline}
        strokeLinecap="round"
      />
    )}
  </svg>
);
