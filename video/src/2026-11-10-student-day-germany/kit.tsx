import React from 'react';
import {random} from 'remotion';
import {
  ContactShadow, Eyes, INK, OUTLINE, Sprite, ballistic, bump, clamp, easeInCubic, easeOutBack, easeOutCubic, popInOut, prog,
  spring, type PoseXf, type SpriteInfo,
} from '../lib';
import {EYES} from './points';
import {SPRITES} from './sprites';

/**
 * Shared pieces for "Why are environmental engineers paid so well?". World px everywhere (put them in a <Layer>).
 * Outlined things grow and shrink away, never fade. All randomness is seeded.
 */

export const SLUG = '2026-11-10-student-day-germany';
export const FONT = 'Arial Rounded MT Bold, Nunito, Arial, sans-serif';
export const C = {
  yellow: '#FFD21F', yellowShade: '#E9B200', red: '#E2453C', redDark: '#B8302A', green: '#3BB273', greenDark: '#2A8A57',
  water: '#6CC4F0', waterEdge: '#3E95C9', waterCore: '#A8E1FA', sludge: '#7A5A2E', sludgeEdge: '#5A4120', sludgeCore: '#9C7A44',
  paper: '#FFFDF6', paperShade: '#EDE6D3', pfas: '#B46BDB', pfasDark: '#8E45B8', face: '#F8F9FC', sky: '#9fd8ff',
};

export type Pose =
  | 'idle' | 'talk_a' | 'talk_b' | 'point_right' | 'shrug' | 'thinking' | 'happy' | 'hero'
  | 'tray_hold' | 'bottle_bag' | 'walk_a' | 'walk_b' | 'knock_up' | 'knock_down' | 'laptop_sit' | 'closeup_react';

const XF0: PoseXf = {scaleX: 1, scaleY: 1, rotate: 0, swapped: false, dy: 0};

/** Hard hat drawn in code (head-radius units), sits on the round head above the brows. */
const HardHat: React.FC<{hx: number; hy: number; hr: number}> = ({hx, hy, hr}) => {
  const r = hr;
  const sw = Math.max(2, 0.03 * r);
  const P = (x: number, y: number) => `${hx + x * r} ${hy + y * r}`;
  const dome = `M ${P(-0.99, -0.4)} C ${P(-1.0, -1.06)} ${P(-0.56, -1.27)} ${P(0, -1.27)} C ${P(0.56, -1.27)} ${P(1.0, -1.06)} ${P(0.99, -0.4)} Q ${P(0, -0.27)} ${P(-0.99, -0.4)} Z`;
  const shade = `M ${P(-0.99, -0.4)} C ${P(-1.0, -1.0)} ${P(-0.62, -1.2)} ${P(-0.3, -1.25)} C ${P(-0.62, -1.0)} ${P(-0.72, -0.7)} ${P(-0.7, -0.36)} Q ${P(-0.85, -0.37)} ${P(-0.99, -0.4)} Z`;
  const ridge = `M ${P(-0.16, -0.3)} L ${P(-0.14, -1.17)} Q ${P(0, -1.36)} ${P(0.14, -1.17)} L ${P(0.16, -0.3)} Z`;
  const brim = `M ${P(-1.13, -0.43)} Q ${P(0, -0.25)} ${P(1.13, -0.43)} L ${P(1.1, -0.33)} Q ${P(0, -0.13)} ${P(-1.1, -0.33)} Z`;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      <path d={dome} fill={C.yellow} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <path d={shade} fill={C.yellowShade} opacity={0.55} />
      <path d={ridge} fill="#FFE066" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <path d={brim} fill="#F5C400" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    </svg>
  );
};

/** A plain red necktie under the head (the "typical worker"). */
const Tie: React.FC<{hx: number; hy: number; hr: number}> = ({hx, hy, hr}) => {
  const r = hr;
  const sw = Math.max(2, 0.03 * r);
  const P = (x: number, y: number) => `${hx + x * r} ${hy + y * r}`;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      <path d={`M ${P(-0.12, 1.02)} L ${P(0.12, 1.02)} L ${P(0.08, 1.17)} L ${P(-0.08, 1.17)} Z`} fill={C.redDark} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <path d={`M ${P(-0.08, 1.17)} L ${P(0.08, 1.17)} L ${P(0.17, 1.82)} L ${P(0, 1.98)} L ${P(-0.17, 1.82)} Z`} fill={C.red} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    </svg>
  );
};

/** Closed eyes for a blink: a face-coloured patch over each eye and a short black arc. */
const Blink: React.FC<{pose: Pose; ox: number; oy: number; k: number; flip: boolean}> = ({pose, ox, oy, k, flip}) => {
  const eyes = EYES[pose];
  if (!eyes) return null;
  const s: SpriteInfo = SPRITES[pose];
  const f = s.feet ?? {x: s.w / 2, y: s.h};
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      {eyes.map((e, i) => {
        const x = ox + (e.x - f.x) * k * (flip ? -1 : 1);
        const y = oy + (e.y - f.y) * k;
        const rx = e.w * k * 0.78;
        const ry = e.h * k * 0.66;
        return (
          <g key={i}>
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={C.face} />
            <path d={`M ${x - rx * 0.85} ${y + ry * 0.05} Q ${x} ${y + ry * 0.55} ${x + rx * 0.85} ${y + ry * 0.05}`} fill="none" stroke={INK} strokeWidth={Math.max(2, e.w * k * 0.22)} strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
};


/** A student backpack: the pack peeks out behind the torso, two straps run over the shoulders (head-radius units). */
const BackpackBack: React.FC<{hx: number; hy: number; hr: number}> = ({hx, hy, hr}) => {
  const r = hr;
  const sw = Math.max(2, 0.03 * r);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      <rect x={hx - 0.78 * r} y={hy + 1.0 * r} width={1.56 * r} height={1.55 * r} rx={0.32 * r} fill="#2F6FD6" stroke={INK} strokeWidth={sw} />
      <rect x={hx - 0.78 * r} y={hy + 1.0 * r} width={0.3 * r} height={1.55 * r} rx={0.15 * r} fill="#2558AE" />
    </svg>
  );
};
const BackpackStraps: React.FC<{hx: number; hy: number; hr: number}> = ({hx, hy, hr}) => {
  const r = hr;
  const sw = Math.max(2, 0.03 * r);
  const P = (x: number, y: number) => `${hx + x * r} ${hy + y * r}`;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      {[-1, 1].map((side) => (
        <path key={side} d={`M ${P(side * 0.2, 1.0)} Q ${P(side * 0.38, 1.4)} ${P(side * 0.36, 2.0)} L ${P(side * 0.27, 2.0)} Q ${P(side * 0.28, 1.45)} ${P(side * 0.1, 1.02)} Z`} fill="#2F6FD6" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      ))}
    </svg>
  );
};
/** Round glasses on the eyes (the lecturer). */
const Glasses: React.FC<{pose: Pose; ox: number; oy: number; k: number; flip: boolean}> = ({pose, ox, oy, k, flip}) => {
  const eyes = EYES[pose];
  if (!eyes) return null;
  const s: SpriteInfo = SPRITES[pose];
  const f = s.feet ?? {x: s.w / 2, y: s.h};
  const pts = eyes.map((e) => ({x: ox + (e.x - f.x) * k * (flip ? -1 : 1), y: oy + (e.y - f.y) * k, r: e.h * k * 0.95}));
  const sw = Math.max(2, pts[0].r * 0.16);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      {pts.map((q, i) => <circle key={i} cx={q.x} cy={q.y} r={q.r} fill="rgba(255,255,255,0.15)" stroke={INK} strokeWidth={sw} />)}
      {pts.length === 2 ? <line x1={pts[0].x + pts[0].r} y1={pts[0].y} x2={pts[1].x - pts[1].r} y2={pts[1].y} stroke={INK} strokeWidth={sw} /> : null}
    </svg>
  );
};

/**
 * One cut-out person: a library / video pose drawn by its feet, with a hard hat (engineer) or a tie (worker),
 * an optional code blink, and the pose transform (squash / lean about the feet) applied to everything together.
 */
export const Person: React.FC<{
  pose: Pose;
  x: number;
  y: number;
  size: number;
  xf?: PoseXf;
  flip?: boolean;
  hat?: boolean;
  tie?: boolean;
  blink?: boolean;
  breath?: number;
  dx?: number;
  dy?: number;
  shadow?: boolean;
  lean?: number;
  backpack?: boolean;
  glasses?: boolean;
}> = ({pose, x, y, size, xf = XF0, flip = false, hat = false, tie = false, blink = false, breath = 1, dx = 0, dy = 0, shadow = true, lean = 0, backpack = false, glasses = false}) => {
  const s: SpriteInfo = SPRITES[pose];
  const k = s.scale * size;
  const f = s.feet ?? {x: s.w / 2, y: s.h};
  const h = s.head ?? {x: s.w / 2, y: s.h * 0.2, r: s.w * 0.3};
  const hx = (h.x - f.x) * k * (flip ? -1 : 1);
  const hy = (h.y - f.y) * k;
  const hr = h.r * k;
  return (
    <>
      {shadow ? <ContactShadow x={x + dx} y={y + 4} width={hr * 2.1} squash={1 / Math.max(0.8, xf.scaleY)} /> : null}
      <div
        style={{
          position: 'absolute',
          left: x + dx,
          top: y + dy + xf.dy,
          width: 0,
          height: 0,
          transformOrigin: '0 0',
          transform: `rotate(${xf.rotate + lean}deg) scale(${xf.scaleX}, ${xf.scaleY * breath})`,
        }}
      >
        {backpack ? <BackpackBack hx={hx} hy={hy} hr={hr} /> : null}
        <Sprite s={s} x={0} y={0} anchor="feet" size={size} flip={flip} />
        {blink ? <Blink pose={pose} ox={0} oy={0} k={k} flip={flip} /> : null}
        {glasses ? <Glasses pose={pose} ox={0} oy={0} k={k} flip={flip} /> : null}
        {tie ? <Tie hx={hx} hy={hy} hr={hr} /> : null}
        {backpack ? <BackpackStraps hx={hx} hy={hy} hr={hr} /> : null}
        {hat ? <HardHat hx={hx} hy={hy} hr={hr} /> : null}
      </div>
    </>
  );
};

/** World position of the head centre (and radius) of a pose drawn by <Person>. */
export const headOf = (pose: Pose, x: number, y: number, size: number, flip = false) => {
  const s: SpriteInfo = SPRITES[pose];
  const k = s.scale * size;
  const f = s.feet ?? {x: s.w / 2, y: s.h};
  const h = s.head ?? {x: s.w / 2, y: s.h * 0.2, r: s.w * 0.3};
  return {x: x + (h.x - f.x) * k * (flip ? -1 : 1), y: y + (h.y - f.y) * k, r: h.r * k};
};

/** A prop sprite drawn by its centre, with scale / rotation about that centre (props pop and squash). */
export const Prop: React.FC<{
  name: keyof typeof SPRITES;
  x: number;
  y: number;
  size: number;
  sx?: number;
  sy?: number;
  rotate?: number;
  flip?: boolean;
  anchor?: 'centre' | 'bottom';
  style?: React.CSSProperties;
}> = ({name, x, y, size, sx = 1, sy = 1, rotate = 0, flip = false, anchor = 'centre', style}) => {
  const s = SPRITES[name];
  const ay = anchor === 'bottom' ? s.h : s.h / 2;
  if (sx <= 0.001 || sy <= 0.001) return null;
  return <Sprite s={s} x={x} y={y} anchor={[s.w / 2, ay]} size={size} scaleX={sx} scaleY={sy} rotate={rotate} flip={flip} style={style} />;
};

/** World size of a prop at a given size. */
export const propSize = (name: keyof typeof SPRITES, size: number) => {
  const s = SPRITES[name];
  return {w: s.w * s.scale * size, h: s.h * s.scale * size};
};

/** Pop-in scale with overshoot at t0, shrink away at t1 (outlined things never fade). */
export const pop = (t: number, t0: number, t1 = 1e9, inDur = 0.16, outDur = 0.14) => popInOut(t, t0, t1, inDur, outDur);

/** Squash on landing: returns [sx, sy] for a thing that lands at `at`. */
export const landSquash = (t: number, at: number, amt = 0.16) => {
  if (t < at) return [1, 1] as const;
  const k = spring(t - at, 4, 8);
  return [1 + amt * 0.6 * k, 1 - amt * k] as const;
};

/** Falling from above with gravity, landing exactly at `land` on y1. Returns y and whether it is visible. */
export const fallY = (t: number, land: number, y1: number, drop = 1400, g = 5200) => {
  const T = Math.sqrt((2 * drop) / g);
  const t0 = land - T;
  if (t < t0) return {y: y1 - drop, on: false, landed: false};
  if (t >= land) return {y: y1, on: true, landed: true};
  const dt = t - t0;
  return {y: y1 - drop + 0.5 * g * dt * dt, on: true, landed: false};
};

/* ------------------------------------------------------------------------------------------------------------ */
/* Labels                                                                                                         */

/** Euro amounts in English style: €11,904 / €37.80 (decimals only when asked). */
export const fmtMoney = (v: number, decimals = 0) => {
  const [i, d] = v.toFixed(decimals).split('.');
  return `€${i.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${d ? `.${d}` : ''}`;
};

/** A flat outlined label that pops on at `from` and shrinks away at `to`. */
export const Tag: React.FC<{
  t: number;
  from: number;
  to?: number;
  x: number;
  y: number;
  text: string;
  size?: number;
  color?: string;
  bg?: string;
  rotate?: number;
  sub?: string;
  bounceAt?: number;
  minChars?: number;
}> = ({t, from, to = 1e9, x, y, text, size = 60, color = INK, bg = '#fff', rotate = 0, sub, bounceAt, minChars}) => {
  const k = pop(t, from, to);
  if (k <= 0.001) return null;
  const b = bounceAt !== undefined ? 1 + 0.12 * bump(t, bounceAt, 0.22) : 1;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${k * b})`,
        background: bg,
        color,
        border: `${OUTLINE}px solid ${INK}`,
        borderRadius: size * 0.42,
        padding: `${size * 0.16}px ${size * 0.42}px`,
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.08,
        whiteSpace: 'nowrap',
        textAlign: 'center',
        fontVariantNumeric: 'tabular-nums',
        minWidth: minChars ? minChars * size * 0.6 : undefined,
        boxShadow: `0 ${size * 0.1}px 0 ${INK}`,
      }}
    >
      {text}
      {sub ? <div style={{fontSize: size * 0.48, marginTop: size * 0.06}}>{sub}</div> : null}
    </div>
  );
};

/** Red rubber-stamp text, slammed on at `at` (grows from big to its size with a bump). */
export const StampText: React.FC<{t: number; at: number; to?: number; x: number; y: number; text: string; size?: number; rotate?: number; color?: string}> = ({
  t, at, to = 1e9, x, y, text, size = 70, rotate = -8, color = C.red,
}) => {
  if (t < at - 0.08 || t > to) return null;
  const p = prog(t, at - 0.08, at);
  const outK = t > to - 0.12 ? 1 - easeInCubic(prog(t, to - 0.12, to)) : 1;
  const scale = (t < at ? 1.9 - 0.9 * easeInCubic(p) : 1 + 0.06 * spring(t - at, 6, 10)) * outK;
  if (scale <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
        color,
        border: `${size * 0.11}px solid ${color}`,
        borderRadius: size * 0.22,
        padding: `${size * 0.05}px ${size * 0.3}px`,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: size * 0.04,
        whiteSpace: 'nowrap',
        background: 'rgba(255,255,255,0.85)',
      }}
    >
      {text}
    </div>
  );
};

/* ------------------------------------------------------------------------------------------------------------ */
/* Money                                                                                                          */

/** A coin-count style money label that counts up from 0 between t0 and t1. */
export const MoneyCounter: React.FC<{t: number; t0: number; t1: number; to?: number; x: number; y: number; value: number; suffix?: string; prefix?: string; size?: number; bg?: string; color?: string; bounceAt?: number; decimals?: number}> = ({
  t, t0, t1, to = 1e9, x, y, value, suffix = '', prefix = '', size = 64, bg = '#E8FFE2', color = C.greenDark, bounceAt, decimals = 0,
}) => {
  const v = value * easeOutCubic(prog(t, t0, t1));
  // fixed width from the final text: the label does not jump when the number gains a digit
  const minChars = `${prefix}${fmtMoney(value, decimals)}${suffix}`.length;
  return <Tag t={t} from={t0 - 0.12} to={to} x={x} y={y} text={`${prefix}${fmtMoney(v, decimals)}${suffix}`} size={size} bg={bg} color={color} bounceAt={bounceAt} minChars={minChars} />;
};

/* ------------------------------------------------------------------------------------------------------------ */
/* Paper: permits, fines, plans                                                                                   */

const paperCard = (w: number, h: number, children: React.ReactNode, bg = C.paper) => (
  <div
    style={{
      position: 'absolute',
      left: -w / 2,
      top: -h / 2,
      width: w,
      height: h,
      background: bg,
      border: `${OUTLINE}px solid ${INK}`,
      borderRadius: 14,
      boxShadow: `inset -${w * 0.06}px -${h * 0.04}px 0 ${C.paperShade}`,
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

const lines = (n: number, w: number, top: number, gap: number, color = '#C9C1AE') =>
  Array.from({length: n}, (_, i) => (
    <div key={i} style={{position: 'absolute', left: w * 0.14, top: top + i * gap, width: w * (i % 3 === 2 ? 0.46 : 0.72), height: 9, borderRadius: 5, background: color}} />
  ));

/** A fine ticket: pink paper with FINE and an amount; slaps on at `at`. */
export const Ticket: React.FC<{t: number; at: number; to?: number; x: number; y: number; w?: number; amount?: string; rotate?: number; sub?: string}> = ({
  t, at, to = 1e9, x, y, w = 250, amount = '$68,445', rotate = 6, sub = 'PER DAY',
}) => {
  if (t < at - 0.1 || t > to) return null;
  const p = prog(t, at - 0.1, at);
  const s = t < at ? 1.6 - 0.6 * easeInCubic(p) : 1 + 0.08 * spring(t - at, 6, 9);
  const out = t > to - 0.14 ? 1 - easeInCubic(prog(t, to - 0.14, to)) : 1;
  const h = w * 0.9;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg) scale(${s * out})`}}>
      {paperCard(
        w,
        h,
        <div style={{fontFamily: FONT, fontWeight: 900, textAlign: 'center', color: INK}}>
          <div style={{background: C.red, color: '#fff', fontSize: w * 0.17, lineHeight: `${h * 0.27}px`, borderBottom: `${OUTLINE}px solid ${INK}`}}>FINE</div>
          <div style={{fontSize: w * 0.17, marginTop: h * 0.08, color: C.redDark}}>{amount}</div>
          <div style={{fontSize: w * 0.1, marginTop: h * 0.02}}>{sub}</div>
        </div>,
        '#FFF1F0',
      )}
    </div>
  );
};

/** The orange license card: P.E. and a gold seal. */
export const LicenseCard: React.FC<{t: number; at: number; to?: number; x: number; y: number; w?: number; rotate?: number; title?: string}> = ({t, at, to = 1e9, x, y, w = 300, rotate = -4, title}) => {
  const k = pop(t, at, to, 0.18);
  if (k <= 0.001) return null;
  const h = w * 0.62;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg) scale(${k})`}}>
      {paperCard(
        w,
        h,
        <>
          <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h * 0.3, background: '#3A6FD8', borderBottom: `${OUTLINE}px solid ${INK}`, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: w * 0.06, lineHeight: `${h * 0.3}px`, textAlign: 'center', whiteSpace: 'nowrap'}}>{title ?? ''}</div>
          <div style={{position: 'absolute', left: w * 0.08, top: h * 0.38, fontFamily: FONT, fontWeight: 900, fontSize: w * 0.22, color: INK}}>P.E.</div>
          {lines(2, w, h * 0.8, h * 0.1)}
          <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
            <circle cx={w * 0.76} cy={h * 0.58} r={w * 0.13} fill="#F2C230" stroke={INK} strokeWidth={6} />
            <circle cx={w * 0.76} cy={h * 0.58} r={w * 0.07} fill="none" stroke="#B88A12" strokeWidth={5} />
          </svg>
        </>,
      )}
    </div>
  );
};

/** An exam paper with a red A+. */
export const ExamPaper: React.FC<{t: number; at: number; to?: number; x: number; y: number; w?: number; rotate?: number}> = ({t, at, to = 1e9, x, y, w = 150, rotate = 0}) => {
  const k = pop(t, at, to);
  if (k <= 0.001) return null;
  const h = w * 1.28;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg) scale(${k})`}}>
      {paperCard(
        w,
        h,
        <>
          {lines(5, w, h * 0.16, h * 0.13)}
          <div style={{position: 'absolute', right: w * 0.06, bottom: h * 0.02, fontFamily: FONT, fontWeight: 900, fontSize: w * 0.34, color: C.red, transform: 'rotate(-12deg)'}}>A+</div>
        </>,
      )}
    </div>
  );
};

/** A calendar whose number flips from `from` to `to` between t0 and t1. */
export const Calendar: React.FC<{t: number; at: number; until?: number; x: number; y: number; w?: number; label?: string; n0?: number; n1?: number; t1?: number}> = ({
  t, at, until = 1e9, x, y, w = 170, label = 'YEARS', n0 = 1, n1 = 4, t1,
}) => {
  const k = pop(t, at, until);
  if (k <= 0.001) return null;
  const end = t1 ?? at + 0.8;
  const n = Math.round(n0 + (n1 - n0) * easeOutCubic(prog(t, at + 0.1, end)));
  const h = w * 1.05;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${k})`}}>
      {paperCard(
        w,
        h,
        <div style={{fontFamily: FONT, fontWeight: 900, textAlign: 'center', color: INK}}>
          <div style={{background: C.red, height: h * 0.24, borderBottom: `${OUTLINE}px solid ${INK}`}} />
          <div style={{fontSize: w * 0.46, lineHeight: 1.05, marginTop: h * 0.03}}>{n}</div>
          <div style={{fontSize: w * 0.13}}>{label}</div>
        </div>,
      )}
    </div>
  );
};

/** A price tag on a string that swings in. */
export const PriceTag: React.FC<{t: number; at: number; to?: number; x: number; y: number; text?: string; w?: number}> = ({t, at, to = 1e9, x, y, text = '$$$', w = 300}) => {
  const k = pop(t, at, to, 0.2);
  if (k <= 0.001) return null;
  const swing = 14 * Math.exp(-3 * Math.max(0, t - at)) * Math.sin(2 * Math.PI * 1.6 * Math.max(0, t - at));
  const h = w * 0.55;
  return (
    <div style={{position: 'absolute', left: x, top: y, transformOrigin: '0 0', transform: `rotate(${swing - 10}deg) scale(${k})`}}>
      <svg width={w * 1.4} height={h * 2.2} style={{position: 'absolute', left: -w * 0.2, top: -h * 1.2, overflow: 'visible'}}>
        <path d={`M ${w * 0.2} ${h * 0.1} Q ${w * 0.32} ${h * 0.7} ${w * 0.42} ${h * 1.25}`} fill="none" stroke={INK} strokeWidth={6} />
        <path d={`M ${w * 0.32} ${h * 1.2} L ${w * 0.62} ${h * 0.85} L ${w * 1.32} ${h * 0.85} L ${w * 1.32} ${h * 1.85} L ${w * 0.62} ${h * 1.85} Z`} fill="#FFE3A1" stroke={INK} strokeWidth={OUTLINE} strokeLinejoin="round" />
        <circle cx={w * 0.5} cy={h * 1.35} r={w * 0.04} fill="#fff" stroke={INK} strokeWidth={5} />
        <text x={w * 0.98} y={h * 1.55} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={w * 0.26} fill={C.greenDark}>{text}</text>
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------------------------------------------------ */
/* Water, sludge, chemicals                                                                                        */

/** A water drop with an optional face. */
export const Drop: React.FC<{x: number; y: number; r?: number; k?: number; face?: boolean; t?: number; stretch?: number}> = ({x, y, r = 40, k = 1, face = true, stretch = 1}) => {
  if (k <= 0.001) return null;
  const sw = Math.max(3, r * 0.14);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${k / Math.sqrt(stretch)}, ${k * stretch})`}}>
      <svg width={1} height={1} style={{position: 'absolute', overflow: 'visible'}}>
        <path d={`M 0 ${-r * 1.7} C ${r * 0.5} ${-r * 0.9} ${r} ${-r * 0.4} ${r} ${r * 0.15} C ${r} ${r * 0.75} ${r * 0.5} ${r} 0 ${r} C ${-r * 0.5} ${r} ${-r} ${r * 0.75} ${-r} ${r * 0.15} C ${-r} ${-r * 0.4} ${-r * 0.5} ${-r * 0.9} 0 ${-r * 1.7} Z`} fill={C.water} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        <ellipse cx={-r * 0.42} cy={-r * 0.1} rx={r * 0.14} ry={r * 0.3} fill="#fff" />
      </svg>
      {face ? <Eyes x={r * 0.08} y={r * 0.12} r={r * 0.2} gap={r * 0.16} outline={Math.max(3, r * 0.09)} /> : null}
    </div>
  );
};

/** Expanding ripple rings on a water surface (outlined, they widen and their stroke shrinks away). */
export const Ripple: React.FC<{t: number; at: number; x: number; y: number; size?: number; life?: number; color?: string}> = ({t, at, x, y, size = 120, life = 0.9, color = '#fff'}) => {
  if (t < at || t > at + life) return null;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {[0, 0.22].map((d, i) => {
        const p = prog(t, at + d, at + d + life * 0.8);
        if (p <= 0 || p >= 1) return null;
        const rx = size * (0.2 + 0.8 * easeOutCubic(p));
        return <ellipse key={i} cx={x} cy={y} rx={rx} ry={rx * 0.32} fill="none" stroke={color} strokeWidth={10 * (1 - p)} />;
      })}
    </svg>
  );
};

/** A small sparkle star that pops on and shrinks away. */
export const Sparkle: React.FC<{t: number; at: number; x: number; y: number; size?: number; life?: number; color?: string}> = ({t, at, x, y, size = 40, life = 0.6, color = '#FFF27A'}) => {
  const k = popInOut(t, at, at + life, 0.12, 0.3);
  if (k <= 0.001) return null;
  const s = size * k;
  const d = `M 0 ${-s} Q ${s * 0.18} ${-s * 0.18} ${s} 0 Q ${s * 0.18} ${s * 0.18} 0 ${s} Q ${-s * 0.18} ${s * 0.18} ${-s} 0 Q ${-s * 0.18} ${-s * 0.18} 0 ${-s} Z`;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
      <path d={d} fill={color} stroke={INK} strokeWidth={Math.max(3, s * 0.12)} strokeLinejoin="round" transform={`rotate(${(t - at) * 90})`} />
    </svg>
  );
};

/** A thick outlined arrow growing upwards from (x, y) to height h*grow. */
export const UpArrow: React.FC<{x: number; y: number; h: number; grow: number; w?: number; color?: string}> = ({x, y, h, grow, w = 90, color = C.green}) => {
  if (grow <= 0.01) return null;
  const L = h * grow;
  const head = w * 1.1;
  const d = `M ${x - w / 2} ${y} L ${x - w / 2} ${y - L + head} L ${x - w} ${y - L + head} L ${x} ${y - L} L ${x + w} ${y - L + head} L ${x + w / 2} ${y - L + head} L ${x + w / 2} ${y} Z`;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <path d={d} fill={color} stroke={INK} strokeWidth={OUTLINE} strokeLinejoin="round" />
    </svg>
  );
};

/** A tiny engineer seen from afar: white head with a yellow hat (for crowds). */
export const Mini: React.FC<{x: number; y: number; r?: number; k?: number}> = ({x, y, r = 16, k = 1}) => {
  if (k <= 0.001) return null;
  const R = r * k;
  return (
    <>
      <circle cx={x} cy={y} r={R} fill="#fff" stroke={INK} strokeWidth={Math.max(2, R * 0.22)} />
      <path d={`M ${x - R * 1.05} ${y - R * 0.25} A ${R * 1.05} ${R * 0.95} 0 0 1 ${x + R * 1.05} ${y - R * 0.25} Z`} fill={C.yellow} stroke={INK} strokeWidth={Math.max(2, R * 0.2)} strokeLinejoin="round" />
    </>
  );
};

/** Dust puffs at a landing: a few light clouds that shrink away. */
export const Dust: React.FC<{t: number; at: number; x: number; y: number; spread?: number; size?: number; color?: string; shade?: string}> = ({
  t, at, x, y, spread = 160, size = 46, color = '#F1E6D2', shade = '#D9C7A6',
}) => {
  if (t < at || t > at + 0.9) return null;
  const p = prog(t, at, at + 0.9);
  const k = p < 0.15 ? easeOutBack(p / 0.15) : 1 - easeInCubic((p - 0.15) / 0.85);
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {[-1, 1].map((side) =>
        [0, 1, 2].map((j) => {
          const cx = x + side * (spread * 0.35 + j * spread * 0.32) * (0.6 + 0.6 * easeOutCubic(p));
          const cy = y - 10 - j * 6 - 40 * easeOutCubic(p);
          const r = size * (1 - j * 0.22) * k;
          if (r < 1) return null;
          return (
            <g key={`${side}${j}`}>
              <circle cx={cx} cy={cy} r={r + OUTLINE} fill={INK} />
              <circle cx={cx} cy={cy} r={r} fill={shade} />
              <circle cx={cx - r * 0.12} cy={cy - r * 0.12} r={r * 0.82} fill={color} />
            </g>
          );
        }),
      )}
    </svg>
  );
};

/** A cut-out prop that drops in from above and lands on y (bottom anchor) with a squash. */
export const DropIn: React.FC<{t: number; at: number; name: keyof typeof SPRITES; x: number; y: number; size: number; drop?: number; to?: number; flip?: boolean}> = ({
  t, at, name, x, y, size, drop = 1400, to = 1e9, flip = false,
}) => {
  const f = fallY(t, at, y, drop);
  if (!f.on || t > to) return null;
  const [sx, sy] = landSquash(t, at, 0.14);
  const out = t > to - 0.14 ? 1 - easeInCubic(prog(t, to - 0.14, to)) : 1;
  return <Prop name={name} x={x} y={f.y} size={size} sx={sx * out} sy={sy * out} anchor="bottom" flip={flip} />;
};

/* ------------------------------------------------------------------------------------------------------------ */
/* Placement and pose helpers                                                                                     */

/** World point at depth z that shows at screen (sx, sy) for the reference camera (1920 x 1080 composition). */
export const place = (z: number, sx: number, sy: number, ref = {x: 960, y: 540, z: 0}) => ({
  x: ref.x + ((sx - 960) * (z - ref.z)) / 1000,
  y: ref.y + ((sy - 540) * (z - ref.z)) / 1000,
});

/** World length at depth z that shows as `px` screen pixels for the reference camera. */
export const worldLen = (z: number, px: number, ref = {x: 960, y: 540, z: 0}) => (px * (z - ref.z)) / 1000;

/** The pose transform for a list of swap times: the anticipation of the next swap or the spring of the last one. */
export const swapXf = (t: number, times: readonly number[], fn: (t: number, at: number) => PoseXf): PoseXf => {
  let best: PoseXf = XF0;
  for (const a of times) if (t >= a - 0.13) best = fn(t, a);
  return best;
};

/** A continuous liquid stream (edge, main, core) with dashes that run along it so it reads as flowing. */
export const Stream: React.FC<{d: string; t: number; width?: number; colors?: {edge: string; main: string; core: string}; k?: number; speed?: number}> = ({
  d, t, width = 34, colors = {edge: C.sludgeEdge, main: C.sludge, core: C.sludgeCore}, k = 1, speed = 1.6,
}) => {
  if (k <= 0.01) return null;
  const w = width * k;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <path d={d} fill="none" stroke={colors.edge} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={colors.main} strokeWidth={w * 0.7} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} pathLength={1} fill="none" stroke={colors.core} strokeWidth={w * 0.28} strokeLinecap="round" strokeDasharray="0.08 0.12" strokeDashoffset={-t * speed} />
    </svg>
  );
};

/* ------------------------------------------------------------------------------------------------------------ */
/* Student-day pieces (all drawn in code, same outline and flat colours)                                         */

/** An analog wall clock. minutes since midnight; `slice` = [fromMin, toMin] drawn as a pie (the academic quarter). */
export const Clock: React.FC<{x: number; y: number; r: number; minutes: number; k?: number; slice?: readonly [number, number]; sliceColor?: string; face?: string}> = ({
  x, y, r, minutes, k = 1, slice, sliceColor = '#FFD54A', face = '#FFFDF6',
}) => {
  if (k <= 0.001) return null;
  const hA = (((minutes / 60) % 12) / 12) * 360 - 90;
  const mA = ((minutes % 60) / 60) * 360 - 90;
  const hand = (a: number, len: number, w: number) => (
    <line x1={0} y1={0} x2={Math.cos((a * Math.PI) / 180) * len} y2={Math.sin((a * Math.PI) / 180) * len} stroke={INK} strokeWidth={w} strokeLinecap="round" />
  );
  let slicePath: string | null = null;
  if (slice && slice[1] > slice[0]) {
    const a0 = ((slice[0] % 60) / 60) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((slice[1] - slice[0]) / 60) * 2 * Math.PI + a0;
    const rr = r * 0.86;
    slicePath = `M 0 0 L ${Math.cos(a0) * rr} ${Math.sin(a0) * rr} A ${rr} ${rr} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${Math.cos(a1) * rr} ${Math.sin(a1) * rr} Z`;
  }
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: x, top: y, overflow: 'visible', transform: `scale(${k})`}}>
      <circle r={r + OUTLINE} fill={INK} />
      <circle r={r} fill={face} />
      <circle r={r * 0.94} fill="none" stroke="#E2D8C3" strokeWidth={r * 0.06} />
      {slicePath ? <path d={slicePath} fill={sliceColor} /> : null}
      {Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * 2 * Math.PI;
        const big = i % 3 === 0;
        return <line key={i} x1={Math.cos(a) * r * (big ? 0.74 : 0.8)} y1={Math.sin(a) * r * (big ? 0.74 : 0.8)} x2={Math.cos(a) * r * 0.88} y2={Math.sin(a) * r * 0.88} stroke={INK} strokeWidth={big ? r * 0.06 : r * 0.035} strokeLinecap="round" />;
      })}
      {hand(hA, r * 0.5, r * 0.085)}
      {hand(mA, r * 0.76, r * 0.06)}
      <circle r={r * 0.07} fill={INK} />
    </svg>
  );
};

/** A gold euro coin. */
export const Coin: React.FC<{x: number; y: number; r?: number; k?: number; rotate?: number}> = ({x, y, r = 34, k = 1, rotate = 0}) => {
  if (k <= 0.001) return null;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: x, top: y, overflow: 'visible', transform: `rotate(${rotate}deg) scale(${k})`}}>
      <circle r={r + 5} fill={INK} />
      <circle r={r} fill="#F2C230" />
      <circle r={r * 0.78} fill="none" stroke="#C99A12" strokeWidth={r * 0.1} />
      <text x={0} y={r * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={r * 1.05} fill="#8A6508">€</text>
    </svg>
  );
};

/** Coins flung from a point under gravity, spinning, shrinking away at the end of their life. */
export const CoinBurst: React.FC<{t: number; at: number; x: number; y: number; count?: number; seed?: string; speed?: [number, number]; spread?: [number, number]; r?: number; life?: number; gravity?: number}> = ({
  t, at, x, y, count = 8, seed = 'coins', speed = [500, 1100], spread = [-60, 60], r = 26, life = 1.1, gravity = 2400,
}) => {
  const age = t - at;
  if (age < 0 || age > life) return null;
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const a = ((spread[0] + (spread[1] - spread[0]) * random(`${seed}-a${i}`)) * Math.PI) / 180;
        const v = speed[0] + (speed[1] - speed[0]) * random(`${seed}-v${i}`);
        const b = ballistic(x, y, Math.sin(a) * v, -Math.cos(a) * v, age, gravity);
        const k = age > life * 0.7 ? 1 - prog(age, life * 0.7, life) : 1;
        return <Coin key={i} x={b.x} y={b.y} r={r} k={k} rotate={age * 400 * (random(`${seed}-s${i}`) - 0.5)} />;
      })}
    </>
  );
};

/** A flat info card: coloured header band + big text lines. Pops in at `at` (or flies in from `from`), shrinks away at `to`. */
export const InfoCard: React.FC<{
  t: number; at: number; to?: number; x: number; y: number; w?: number; title?: string; lines?: readonly string[]; header?: string; headerText?: string;
  size?: number; rotate?: number; bg?: string; from?: {x: number; y: number}; fly?: number; children?: React.ReactNode; h?: number;
}> = ({t, at, to = 1e9, x, y, w = 420, title, lines = [], header = C.red, headerText = '#fff', size = 46, rotate = -3, bg = C.paper, from, fly = 0.35, children, h}) => {
  let px = x;
  let py = y;
  let k = pop(t, at, to, 0.18);
  if (from) {
    if (t < at - fly || t > to) return null;
    const p = easeOutCubic(prog(t, at - fly, at));
    px = from.x + (x - from.x) * p;
    py = from.y + (y - from.y) * p - Math.sin(Math.PI * p) * 120;
    k = t > to - 0.14 ? 1 - easeInCubic(prog(t, to - 0.14, to)) : 1;
  }
  if (k <= 0.001) return null;
  const hh = h ?? (title ? size * 1.5 : 0) + lines.length * size * 1.25 + size * 0.7;
  const [sx, sy] = landSquash(t, at, 0.06);
  return (
    <div style={{position: 'absolute', left: px, top: py, transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${k * sx}, ${k * sy})`}}>
      <div style={{position: 'relative', width: w, height: hh, background: bg, border: `${OUTLINE}px solid ${INK}`, borderRadius: 18, overflow: 'hidden', boxShadow: `0 ${size * 0.12}px 0 ${INK}`, fontFamily: FONT, fontWeight: 900, color: INK}}>
        {title ? <div style={{background: header, color: headerText, fontSize: size * 0.8, lineHeight: `${size * 1.5}px`, textAlign: 'center', borderBottom: `${OUTLINE}px solid ${INK}`, whiteSpace: 'nowrap'}}>{title}</div> : null}
        {lines.map((l, i) => (
          <div key={i} style={{fontSize: size, lineHeight: `${size * 1.25}px`, textAlign: 'center', marginTop: i === 0 ? size * 0.3 : 0, whiteSpace: 'nowrap'}}>{l}</div>
        ))}
        {children}
      </div>
    </div>
  );
};

/** "Z z z" rising from a sleeping head. */
export const Zzz: React.FC<{t: number; x: number; y: number; size?: number; on?: boolean}> = ({t, x, y, size = 46, on = true}) => {
  if (!on) return null;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const p = ((t * 0.45 + i / 3) % 1 + 1) % 1;
        const k = p < 0.15 ? p / 0.15 : p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1;
        const s = size * (0.6 + 0.5 * p);
        return (
          <div key={i} style={{position: 'absolute', left: x + 60 * p + 14 * Math.sin(p * 6), top: y - 160 * p, transform: `translate(-50%, -50%) scale(${k})`, fontFamily: FONT, fontWeight: 900, fontSize: s, color: '#fff', WebkitTextStroke: `${Math.max(3, s * 0.12)}px ${INK}`, paintOrder: 'stroke fill'}}>
            z
          </div>
        );
      })}
    </>
  );
};

/** A route on a flat map: two pins, a dashed line drawn by `reveal`, and the travelled part highlighted up to `p`. */
export const Route: React.FC<{a: {x: number; y: number; label: string}; b: {x: number; y: number; label: string}; reveal: number; p?: number; size?: number}> = ({a, b, reveal, p = 0, size = 44}) => {
  if (reveal <= 0.001) return null;
  const xe = a.x + (b.x - a.x) * clamp(reveal);
  const ye = a.y + (b.y - a.y) * clamp(reveal);
  const xp = a.x + (b.x - a.x) * clamp(p);
  const yp = a.y + (b.y - a.y) * clamp(p);
  const pin = (q: {x: number; y: number; label: string}, k: number, color: string) =>
    k <= 0.01 ? null : (
      <g transform={`translate(${q.x} ${q.y}) scale(${k})`}>
        <path d="M 0 0 C -30 -40 -42 -60 -42 -82 A 42 42 0 1 1 42 -82 C 42 -60 30 -40 0 0 Z" fill={color} stroke={INK} strokeWidth={OUTLINE} />
        <circle cx={0} cy={-84} r={16} fill="#fff" stroke={INK} strokeWidth={5} />
        <text x={0} y={52} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={INK} stroke="#fff" strokeWidth={10} paintOrder="stroke">{q.label}</text>
      </g>
    );
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <line x1={a.x} y1={a.y} x2={xe} y2={ye} stroke={INK} strokeWidth={18} strokeLinecap="round" strokeDasharray="34 26" />
      <line x1={a.x} y1={a.y} x2={xe} y2={ye} stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeDasharray="34 26" />
      {p > 0.001 ? <line x1={a.x} y1={a.y} x2={xp} y2={yp} stroke={C.red} strokeWidth={10} strokeLinecap="round" /> : null}
      {pin(a, easeOutBack(clamp(reveal * 4)), C.red)}
      {pin(b, easeOutBack(clamp((reveal - 0.85) * 7)), '#3A6FD8')}
    </svg>
  );
};

/** A week of work: up to `hours` filled as blocks, five day columns (Mon-Fri), 4 h per block. */
export const WeekBars: React.FC<{t: number; at: number; to?: number; x: number; y: number; fill: number; cell?: number}> = ({t, at, to = 1e9, x, y, fill, cell = 70}) => {
  const k = pop(t, at, to, 0.18);
  if (k <= 0.001) return null;
  const days = ['MO', 'TU', 'WE', 'TH', 'FR'];
  const n = Math.round(clamp(fill) * 5);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${k})`}}>
      <svg width={days.length * (cell + 14) + 20} height={cell * 2.2} style={{overflow: 'visible'}}>
        {days.map((d, i) => (
          <g key={d} transform={`translate(${10 + i * (cell + 14)} 0)`}>
            <rect width={cell} height={cell * 1.4} rx={12} fill={i < n ? C.green : '#fff'} stroke={INK} strokeWidth={6} />
            {i < n ? <text x={cell / 2} y={cell * 0.9} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={cell * 0.42} fill="#fff">4h</text> : null}
            <text x={cell / 2} y={cell * 1.95} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={cell * 0.38} fill={INK}>{d}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

/** A year as 365 small squares (25 per row); the first `n` are filled. */
export const YearGrid: React.FC<{t: number; at: number; to?: number; x: number; y: number; n: number; cell?: number; color?: string}> = ({t, at, to = 1e9, x, y, n, cell = 22, color = C.green}) => {
  const k = pop(t, at, to, 0.2);
  if (k <= 0.001) return null;
  const cols = 25;
  const gap = 5;
  const rows = Math.ceil(365 / cols);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${k})`}}>
      <svg width={cols * (cell + gap) + 20} height={rows * (cell + gap) + 20} style={{overflow: 'visible'}}>
        <rect x={-10} y={-10} width={cols * (cell + gap) + 30} height={rows * (cell + gap) + 30} rx={22} fill={C.paper} stroke={INK} strokeWidth={7} />
        {Array.from({length: 365}, (_, i) => (
          <rect key={i} x={10 + (i % cols) * (cell + gap)} y={10 + Math.floor(i / cols) * (cell + gap)} width={cell} height={cell} rx={4} fill={i < n ? color : '#E9E2D1'} />
        ))}
      </svg>
    </div>
  );
};

/** A pie chart: one slice of `frac` (from 12 o'clock, clockwise) in `color`, the rest in `rest`. `bite` 0..1 eats the slice. */
export const Pie: React.FC<{x: number; y: number; r: number; frac: number; k?: number; color?: string; rest?: string; bite?: number}> = ({x, y, r, frac, k = 1, color = C.red, rest = '#8FD06A', bite = 0}) => {
  if (k <= 0.001) return null;
  const a1 = -Math.PI / 2 + 2 * Math.PI * frac;
  const big = frac > 0.5 ? 1 : 0;
  const slice = `M 0 0 L 0 ${-r} A ${r} ${r} 0 ${big} 1 ${Math.cos(a1) * r} ${Math.sin(a1) * r} Z`;
  const sk = 1 - easeInCubic(clamp(bite));
  const mid = -Math.PI / 2 + Math.PI * frac;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: x, top: y, overflow: 'visible', transform: `scale(${k})`}}>
      <circle r={r + OUTLINE} fill={INK} />
      <circle r={r} fill={rest} />
      {sk > 0.01 ? (
        <g transform={`translate(${Math.cos(mid) * r * 0.08 * (1 - sk)} ${Math.sin(mid) * r * 0.08 * (1 - sk)}) scale(${sk})`}>
          <path d={slice} fill={color} stroke={INK} strokeWidth={OUTLINE} strokeLinejoin="round" />
        </g>
      ) : (
        <path d={slice} fill="#3A2A20" opacity={0.18} />
      )}
    </svg>
  );
};

/** A padlock. */
export const Lock: React.FC<{x: number; y: number; s?: number; k?: number; open?: number}> = ({x, y, s = 60, k = 1, open = 0}) => {
  if (k <= 0.001) return null;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: x, top: y, overflow: 'visible', transform: `scale(${k})`}}>
      <path d={`M ${-s * 0.5} ${-s * 0.1 - open * s * 0.4} L ${-s * 0.5} ${-s * 0.6 - open * s * 0.4} A ${s * 0.5} ${s * 0.5} 0 0 1 ${s * 0.5} ${-s * 0.6 - open * s * 0.4} L ${s * 0.5} ${-s * 0.1}`} fill="none" stroke={INK} strokeWidth={s * 0.3} strokeLinecap="round" />
      <path d={`M ${-s * 0.5} ${-s * 0.1 - open * s * 0.4} L ${-s * 0.5} ${-s * 0.6 - open * s * 0.4} A ${s * 0.5} ${s * 0.5} 0 0 1 ${s * 0.5} ${-s * 0.6 - open * s * 0.4} L ${s * 0.5} ${-s * 0.1}`} fill="none" stroke="#B9C2CC" strokeWidth={s * 0.14} strokeLinecap="round" />
      <rect x={-s * 0.8} y={-s * 0.15} width={s * 1.6} height={s * 1.25} rx={s * 0.2} fill="#F2C230" stroke={INK} strokeWidth={OUTLINE} />
      <circle cx={0} cy={s * 0.4} r={s * 0.16} fill={INK} />
    </svg>
  );
};

/** A small wooden nightstand (top at y). */
export const Nightstand: React.FC<{x: number; y: number; w?: number; h?: number}> = ({x, y, w = 190, h = 200}) => (
  <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <rect x={x - w / 2} y={y} width={w} height={h} rx={10} fill="#B07A45" stroke={INK} strokeWidth={OUTLINE} />
    <rect x={x - w / 2 - 10} y={y - 6} width={w + 20} height={26} rx={8} fill="#C98D52" stroke={INK} strokeWidth={OUTLINE} />
    <rect x={x - w * 0.32} y={y + h * 0.35} width={w * 0.64} height={h * 0.26} rx={8} fill="#9B6A3C" stroke={INK} strokeWidth={5} />
    <circle cx={x} cy={y + h * 0.48} r={7} fill={INK} />
  </svg>
);

/** A desk lamp standing on (x, y): base, arm, shade; `on` lights a soft cone. */
export const Lamp: React.FC<{x: number; y: number; s?: number; on?: boolean}> = ({x, y, s = 1, on = true}) => (
  <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {on ? <path d={`M ${x + 36 * s} ${y - 150 * s} L ${x + 150 * s} ${y + 6} L ${x - 60 * s} ${y + 6} Z`} fill="#FFE9A3" opacity={0.45} /> : null}
    <ellipse cx={x} cy={y - 6 * s} rx={46 * s} ry={14 * s} fill="#3B4A5C" stroke={INK} strokeWidth={6} />
    <path d={`M ${x} ${y - 12 * s} L ${x - 30 * s} ${y - 110 * s} L ${x + 30 * s} ${y - 170 * s}`} fill="none" stroke={INK} strokeWidth={14 * s} strokeLinecap="round" strokeLinejoin="round" />
    <path d={`M ${x} ${y - 12 * s} L ${x - 30 * s} ${y - 110 * s} L ${x + 30 * s} ${y - 170 * s}`} fill="none" stroke="#5B6F86" strokeWidth={6 * s} strokeLinecap="round" strokeLinejoin="round" />
    <path d={`M ${x + 6 * s} ${y - 190 * s} L ${x + 80 * s} ${y - 150 * s} L ${x + 50 * s} ${y - 120 * s} Z`} fill="#E2453C" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
  </svg>
);

/** A roller shutter that comes down over an opening (x, y, w, h) as `down` goes 0 -> 1. */
export const Shutter: React.FC<{x: number; y: number; w: number; h: number; down: number}> = ({x, y, w, h, down}) => {
  if (down <= 0.001) return null;
  const hh = h * clamp(down);
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <rect x={x} y={y} width={w} height={hh} fill="#AEB6BF" stroke={INK} strokeWidth={OUTLINE} />
      {Array.from({length: Math.floor(hh / 28)}, (_, i) => <line key={i} x1={x + 6} y1={y + (i + 1) * 28} x2={x + w - 6} y2={y + (i + 1) * 28} stroke="#8A939C" strokeWidth={5} />)}
    </svg>
  );
};
