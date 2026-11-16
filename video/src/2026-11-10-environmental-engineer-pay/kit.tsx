import React from 'react';
import {random} from 'remotion';
import {
  ContactShadow, Eyes, INK, OUTLINE, Sprite, ballistic, bump, clamp, easeInCubic, easeOutBack, easeOutCubic, popInOut, prog,
  spring, type PoseXf,
} from '../lib';
import {EYES} from './points';
import {SPRITES} from './sprites';

/**
 * Shared pieces for "Why are environmental engineers paid so well?". World px everywhere (put them in a <Layer>).
 * Outlined things grow and shrink away, never fade. All randomness is seeded.
 */

export const SLUG = '2026-11-10-environmental-engineer-pay';
export const FONT = 'Arial Rounded MT Bold, Nunito, Arial, sans-serif';
export const C = {
  yellow: '#FFD21F', yellowShade: '#E9B200', red: '#E2453C', redDark: '#B8302A', green: '#3BB273', greenDark: '#2A8A57',
  water: '#6CC4F0', waterEdge: '#3E95C9', waterCore: '#A8E1FA', sludge: '#7A5A2E', sludgeEdge: '#5A4120', sludgeCore: '#9C7A44',
  paper: '#FFFDF6', paperShade: '#EDE6D3', pfas: '#B46BDB', pfasDark: '#8E45B8', face: '#F8F9FC', sky: '#9fd8ff',
};

export type Pose = 'idle' | 'talk_a' | 'talk_b' | 'point_right' | 'point_left' | 'shrug' | 'thinking' | 'happy' | 'hold_glass' | 'hero';

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
  const s = SPRITES[pose];
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
}> = ({pose, x, y, size, xf = XF0, flip = false, hat = false, tie = false, blink = false, breath = 1, dx = 0, dy = 0, shadow = true, lean = 0}) => {
  const s = SPRITES[pose];
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
        <Sprite s={s} x={0} y={0} anchor="feet" size={size} flip={flip} />
        {blink ? <Blink pose={pose} ox={0} oy={0} k={k} flip={flip} /> : null}
        {tie ? <Tie hx={hx} hy={hy} hr={hr} /> : null}
        {hat ? <HardHat hx={hx} hy={hy} hr={hr} /> : null}
      </div>
    </>
  );
};

/** World position of the head centre (and radius) of a pose drawn by <Person>. */
export const headOf = (pose: Pose, x: number, y: number, size: number, flip = false) => {
  const s = SPRITES[pose];
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

export const fmtMoney = (v: number) => `$${Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

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

/**
 * A pile of cash bundles that drop in one after another and stack. landAt[i] = landing time of bundle i.
 * (x, y) = bottom centre of the pile on the ground.
 */
export const CashPile: React.FC<{t: number; x: number; y: number; landAt: readonly number[]; size?: number; seed?: string; drop?: number}> = ({
  t, x, y, landAt, size = 0.12, seed = 'cash', drop = 1500,
}) => {
  const {w, h} = propSize('cash_bundle', size);
  const step = h * 0.4;
  return (
    <>
      {landAt.map((at, i) => {
        const jx = (random(`${seed}-x${i}`) - 0.5) * w * 0.14;
        const rot = (random(`${seed}-r${i}`) - 0.5) * 7;
        const yi = y - h / 2 - i * step;
        const f = fallY(t, at, yi, drop);
        if (!f.on) return null;
        const [sx, sy] = landSquash(t, at, 0.12);
        const spin = f.landed ? rot : rot + (1 - prog(t, at - 0.35, at)) * 25 * (random(`${seed}-s${i}`) - 0.5);
        return <Prop key={i} name="cash_bundle" x={x + jx} y={f.y} size={size} sx={sx} sy={sy} rotate={spin} />;
      })}
    </>
  );
};

/** A coin-count style money label that counts up from 0 between t0 and t1. */
export const MoneyCounter: React.FC<{t: number; t0: number; t1: number; to?: number; x: number; y: number; value: number; suffix?: string; size?: number; bg?: string; bounceAt?: number}> = ({
  t, t0, t1, to = 1e9, x, y, value, suffix = '', size = 64, bg = '#E8FFE2', bounceAt,
}) => {
  const v = value * easeOutCubic(prog(t, t0, t1));
  // fixed width from the final text: the label does not jump when the number gains a digit
  const minChars = `${fmtMoney(value)}${suffix}`.length;
  return <Tag t={t} from={t0 - 0.12} to={to} x={x} y={y} text={`${fmtMoney(v)}${suffix}`} size={size} bg={bg} color={C.greenDark} bounceAt={bounceAt} minChars={minChars} />;
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

/** A permit: paper with a green tick and a round seal. Flies in to (x, y) and lands at `at`. */
export const Permit: React.FC<{t: number; at: number; to?: number; x: number; y: number; w?: number; fromX?: number; fromY?: number; rotate?: number}> = ({
  t, at, to = 1e9, x, y, w = 230, fromX = -900, fromY = -300, rotate = -6,
}) => {
  const fly = 0.32;
  if (t < at - fly || t > to) return null;
  const p = easeOutCubic(prog(t, at - fly, at));
  const px = x + (1 - p) * fromX;
  const py = y + (1 - p) * fromY - Math.sin(Math.PI * p) * 80;
  const [sx, sy] = landSquash(t, at, 0.1);
  const out = t > to - 0.14 ? 1 - easeInCubic(prog(t, to - 0.14, to)) : 1;
  const h = w * 1.3;
  return (
    <div style={{position: 'absolute', left: px, top: py, transform: `rotate(${rotate + (1 - p) * -30}deg) scale(${sx * out}, ${sy * out})`}}>
      {paperCard(
        w,
        h,
        <>
          <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h * 0.2, background: C.green, borderBottom: `${OUTLINE}px solid ${INK}`, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: w * 0.15, textAlign: 'center', lineHeight: `${h * 0.2}px`}}>PERMIT</div>
          {lines(4, w, h * 0.3, h * 0.11)}
          <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
            <circle cx={w * 0.72} cy={h * 0.8} r={w * 0.14} fill={C.green} stroke={INK} strokeWidth={6} />
            <path d={`M ${w * 0.65} ${h * 0.8} L ${w * 0.7} ${h * 0.85} L ${w * 0.8} ${h * 0.75}`} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>,
      )}
    </div>
  );
};

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

/** A checklist card: rows tick in at their times. */
export const Checklist: React.FC<{t: number; at: number; to?: number; x: number; y: number; w?: number; font?: number; rows: readonly {text: string; at: number}[]}> = ({t, at, to = 1e9, x, y, w = 760, font = 46, rows}) => {
  const k = pop(t, at, to, 0.2);
  if (k <= 0.001) return null;
  const rowH = 132;
  const h = 70 + rows.length * rowH;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${k})`}}>
      {paperCard(
        w,
        h,
        <>
          {rows.map((r, i) => {
            const kr = pop(t, r.at, 1e9, 0.2);
            const ty = 40 + i * rowH;
            return (
              <div key={i} style={{position: 'absolute', left: 30, top: ty, width: w - 60, height: rowH - 24, display: 'flex', alignItems: 'center'}}>
                <svg width={86} height={86} style={{flex: '0 0 auto'}}>
                  <rect x={6} y={6} width={74} height={74} rx={14} fill="#fff" stroke={INK} strokeWidth={7} />
                  {kr > 0.01 ? (
                    <path d="M 18 44 L 36 62 L 70 20" fill="none" stroke={C.green} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" transform={`translate(43 43) scale(${kr}) translate(-43 -43)`} />
                  ) : null}
                </svg>
                <div style={{marginLeft: 22, fontFamily: FONT, fontWeight: 900, fontSize: font, color: kr > 0.01 ? INK : '#B9B2A2', lineHeight: 1.05}}>{r.text}</div>
              </div>
            );
          })}
        </>,
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

/** A flat river band with a wavy top edge. `dirty` 0..1 tints a growing brown patch around dirtyX. */
export const River: React.FC<{t: number; x0: number; x1: number; y: number; h?: number; dirty?: number; dirtyX?: number; clean?: number}> = ({t, x0, x1, y, h = 150, dirty = 0, dirtyX = 0, clean = 0}) => {
  const n = 40;
  const wave = (x: number) => 8 * Math.sin(x * 0.012 + t * 2.2) + 5 * Math.sin(x * 0.027 - t * 1.4);
  const top = Array.from({length: n + 1}, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / n;
    return `${x},${y + wave(x)}`;
  });
  const body = `M ${x0},${y + h} L ${top.join(' L ')} L ${x1},${y + h} Z`;
  const r = 60 + 520 * clamp(dirty);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      <defs>
        <clipPath id="riverclip">
          <path d={body} />
        </clipPath>
      </defs>
      <path d={body} fill={C.water} stroke={INK} strokeWidth={OUTLINE} strokeLinejoin="round" />
      <g clipPath="url(#riverclip)">
        <rect x={x0} y={y + h * 0.55} width={x1 - x0} height={h} fill={C.waterEdge} opacity={0.35} />
        {dirty > 0.01 ? <ellipse cx={dirtyX} cy={y + h * 0.45} rx={r * (1 - 0.6 * clean)} ry={h * 0.8} fill={C.sludgeCore} /> : null}
        {Array.from({length: 7}, (_, i) => {
          const sx = x0 + ((x1 - x0) * (i + 0.5)) / 7 + ((t * 60) % ((x1 - x0) / 7));
          return <path key={i} d={`M ${sx - 30} ${y + h * 0.4} q 30 -14 60 0`} fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.8} />;
        })}
      </g>
    </svg>
  );
};

/** A "forever chemical": a small purple spiky ball with eyes and a smug or scared face. */
export const Critter: React.FC<{x: number; y: number; r?: number; t: number; phase?: number; mood?: 'smug' | 'scared' | 'happy'; k?: number; look?: {x: number; y: number}}> = ({
  x, y, r = 34, t, phase = 0, mood = 'smug', k = 1,
}) => {
  if (k <= 0.001) return null;
  const spikes = 9;
  const wob = 1 + 0.05 * Math.sin(2 * Math.PI * 1.7 * t + phase);
  const pts = Array.from({length: spikes * 2}, (_, i) => {
    const a = (Math.PI * i) / spikes + phase;
    const rr = (i % 2 === 0 ? r * 1.32 : r * 0.98) * wob;
    return `${Math.cos(a) * rr},${Math.sin(a) * rr}`;
  }).join(' ');
  const sw = Math.max(3, r * 0.14);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${k}) rotate(${6 * Math.sin(t * 2 + phase)}deg)`}}>
      <svg width={1} height={1} style={{position: 'absolute', overflow: 'visible'}}>
        <polygon points={pts} fill={C.pfas} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        <circle cx={-r * 0.25} cy={-r * 0.25} r={r * 0.25} fill="#D7A3F2" />
        {mood === 'smug' ? <path d={`M ${-r * 0.35} ${r * 0.35} Q 0 ${r * 0.62} ${r * 0.4} ${r * 0.28}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" /> : null}
        {mood === 'happy' ? <path d={`M ${-r * 0.35} ${r * 0.3} Q 0 ${r * 0.72} ${r * 0.35} ${r * 0.3}`} fill="#3a1418" stroke={INK} strokeWidth={sw} strokeLinecap="round" /> : null}
        {mood === 'scared' ? <ellipse cx={0} cy={r * 0.42} rx={r * 0.18} ry={r * 0.24} fill="#3a1418" stroke={INK} strokeWidth={sw * 0.8} /> : null}
      </svg>
      <Eyes x={0} y={-r * 0.12} r={r * 0.24} gap={r * 0.14} outline={Math.max(3, r * 0.1)} lid={mood === 'smug' ? 0.45 : 0} squeeze={mood === 'scared'} />
    </div>
  );
};

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

/** A green microbe blob with eyes (biology). */
export const Microbe: React.FC<{x: number; y: number; r?: number; t: number; k?: number}> = ({x, y, r = 60, t, k = 1}) => {
  if (k <= 0.001) return null;
  const n = 48;
  const pts = Array.from({length: n}, (_, i) => {
    const a = (2 * Math.PI * i) / n;
    const rr = r * (1 + 0.07 * Math.sin(5 * a + t * 3) + 0.04 * Math.sin(3 * a - t * 2));
    return `${Math.cos(a) * rr * 1.15},${Math.sin(a) * rr * 0.9}`;
  }).join(' ');
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${k})`}}>
      <svg width={1} height={1} style={{position: 'absolute', overflow: 'visible'}}>
        {Array.from({length: 10}, (_, i) => {
          const a = (2 * Math.PI * i) / 10 + 0.2 * Math.sin(t * 4 + i);
          return <line key={i} x1={Math.cos(a) * r * 1.05} y1={Math.sin(a) * r * 0.85} x2={Math.cos(a) * r * 1.45} y2={Math.sin(a) * r * 1.15} stroke={INK} strokeWidth={6} strokeLinecap="round" />;
        })}
        <polygon points={pts} fill="#7FD36B" stroke={INK} strokeWidth={OUTLINE} strokeLinejoin="round" />
        <circle cx={r * 0.45} cy={r * 0.35} r={r * 0.12} fill="#5BB24A" />
        <circle cx={-r * 0.5} cy={r * 0.3} r={r * 0.08} fill="#5BB24A" />
      </svg>
      <Eyes x={0} y={-r * 0.1} r={r * 0.24} gap={r * 0.18} outline={5} />
    </div>
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

/** A red dashed LIMIT line with a tag. reveal 0..1 draws it from left to right. */
export const LimitLine: React.FC<{x0: number; x1: number; y: number; reveal: number; label?: string}> = ({x0, x1, y, reveal, label = 'LIMIT'}) => {
  if (reveal <= 0.001) return null;
  const xe = x0 + (x1 - x0) * clamp(reveal);
  return (
    <>
      <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <line x1={x0} y1={y} x2={xe} y2={y} stroke={INK} strokeWidth={22} strokeLinecap="round" strokeDasharray="44 30" />
        <line x1={x0} y1={y} x2={xe} y2={y} stroke={C.red} strokeWidth={10} strokeLinecap="round" strokeDasharray="44 30" />
      </svg>
      <div style={{position: 'absolute', left: xe, top: y, transform: `translate(-30%, -50%) scale(${easeOutBack(clamp(reveal * 1.2))})`, background: C.red, color: '#fff', border: `${OUTLINE}px solid ${INK}`, borderRadius: 18, padding: '4px 20px', fontFamily: FONT, fontWeight: 900, fontSize: 44}}>
        {label}
      </div>
    </>
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

/** A simple pen (for "who's allowed to sign them?"). */
export const Pen: React.FC<{x: number; y: number; rotate?: number; k?: number; len?: number}> = ({x, y, rotate = 30, k = 1, len = 260}) => {
  if (k <= 0.001) return null;
  const w = len * 0.13;
  return (
    <div style={{position: 'absolute', left: x, top: y, transformOrigin: '0 0', transform: `rotate(${rotate}deg) scale(${k})`}}>
      <svg width={1} height={1} style={{position: 'absolute', overflow: 'visible'}}>
        <path d={`M 0 0 L ${-w / 2} ${-w * 1.2} L ${w / 2} ${-w * 1.2} Z`} fill="#F4D9A8" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M 0 0 L ${-w * 0.18} ${-w * 0.45} L ${w * 0.18} ${-w * 0.45} Z`} fill={INK} />
        <rect x={-w / 2} y={-len} width={w} height={len - w * 1.2} rx={w * 0.3} fill="#3A6FD8" stroke={INK} strokeWidth={6} />
        <rect x={-w / 2} y={-len} width={w} height={len * 0.18} rx={w * 0.3} fill="#2B54A8" stroke={INK} strokeWidth={6} />
      </svg>
    </div>
  );
};

/** Code steps (stairs) seen from the side: n steps rising to the right. */
export const Stairs: React.FC<{x: number; y: number; n: number; w: number; h: number; k?: number}> = ({x, y, n, w, h, k = 1}) => {
  if (k <= 0.001) return null;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {Array.from({length: n}, (_, i) => {
        const sh = h * (i + 1) * k;
        return (
          <g key={i}>
            <rect x={x + i * w} y={y - sh} width={w} height={sh} fill={i % 2 ? '#D9C3A0' : '#E6D3B3'} stroke={INK} strokeWidth={OUTLINE} strokeLinejoin="round" />
            <rect x={x + i * w} y={y - sh} width={w} height={Math.min(sh, h * 0.18)} fill="#F2E6CF" stroke={INK} strokeWidth={OUTLINE} />
          </g>
        );
      })}
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

/** Blobs of sludge flung from a point (no outline, deep edge + core), landing on floorY. */
export const SludgeBurst: React.FC<{t: number; at: number; x: number; y: number; dir?: number; floorY?: number; count?: number; seed?: string}> = ({
  t, at, x, y, dir = -1, floorY, count = 9, seed = 'sludge',
}) => {
  const age = t - at;
  if (age < 0 || age > 1.6) return null;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {Array.from({length: count}, (_, i) => {
        const vx = dir * (180 + 520 * random(`${seed}-vx${i}`));
        const vy = -(250 + 520 * random(`${seed}-vy${i}`));
        const r = 12 + 16 * random(`${seed}-r${i}`);
        let b = ballistic(x, y, vx, vy, age, 2600);
        let splat = -1;
        if (floorY !== undefined && b.y > floorY) {
          const tl = (-vy + Math.sqrt(vy * vy + 2 * 2600 * (floorY - y))) / 2600;
          splat = age - tl;
          b = {...ballistic(x, y, vx, vy, tl, 2600), vx: 0, vy: 0};
        }
        if (splat >= 0) {
          const k = 1 - clamp(splat / 0.8);
          if (k < 0.03) return null;
          return <ellipse key={i} cx={b.x} cy={b.y} rx={r * 1.9 * k} ry={r * 0.55 * k} fill={C.sludgeEdge} />;
        }
        const sp = Math.hypot(b.vx, b.vy);
        const st = 1 + clamp(sp / 2200) * 0.9;
        const rot = (Math.atan2(b.vy, b.vx) * 180) / Math.PI;
        return (
          <g key={i} transform={`translate(${b.x} ${b.y}) rotate(${rot})`}>
            <ellipse rx={r * st} ry={r / Math.sqrt(st)} fill={C.sludgeEdge} />
            <ellipse rx={r * st * 0.55} ry={(r / Math.sqrt(st)) * 0.55} fill={C.sludgeCore} />
          </g>
        );
      })}
    </svg>
  );
};

/** Rising bubbles that pop (poisoned puddle). */
export const Bubbles: React.FC<{t: number; at: number; x: number; y: number; w?: number; count?: number; seed?: string; color?: string}> = ({
  t, at, x, y, w = 160, count = 6, seed = 'bub', color = '#9DBA5A',
}) => (
  <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {Array.from({length: count}, (_, i) => {
      const t0 = at + i * 0.13 + 0.1 * random(`${seed}-t${i}`);
      const life = 0.55 + 0.3 * random(`${seed}-l${i}`);
      const p = prog(t, t0, t0 + life);
      if (t < t0 || p >= 1) return null;
      const bx = x + (random(`${seed}-x${i}`) - 0.5) * w;
      const r = (10 + 14 * random(`${seed}-r${i}`)) * (p < 0.85 ? easeOutBack(clamp(p / 0.3)) : 1 + 0.6 * (p - 0.85) / 0.15);
      if (p > 0.97) return null;
      return <circle key={i} cx={bx} cy={y - 30 * p} r={r} fill={color} stroke={INK} strokeWidth={5} />;
    })}
  </svg>
);

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

/** World point at depth z that shows at screen (sx, sy) for the reference camera (1080 x 1920 composition). */
export const place = (z: number, sx: number, sy: number, ref = {x: 540, y: 960, z: 0}) => ({
  x: ref.x + ((sx - 540) * (z - ref.z)) / 1000,
  y: ref.y + ((sy - 960) * (z - ref.z)) / 1000,
});

/** World length at depth z that shows as `px` screen pixels for the reference camera. */
export const worldLen = (z: number, px: number, ref = {x: 540, y: 960, z: 0}) => (px * (z - ref.z)) / 1000;

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
