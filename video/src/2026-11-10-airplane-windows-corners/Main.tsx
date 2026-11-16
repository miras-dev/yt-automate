import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  Burst,
  ContactShadow,
  DEPTH,
  FORMATS,
  Impact,
  Label,
  Layer,
  Sky,
  SoundCues,
  SpeedLines,
  Sprite,
  SweatDrop,
  Voice,
  addShake,
  breathe,
  camPath,
  clamp,
  dofBlur,
  easeInOutCubic,
  easeOutCubic,
  popInOut,
  prog,
  shake,
  tremble,
  useT,
  wordBounce,
  type Format,
} from '../lib';
import cuesJson from './cues.json';
import {SPRITES} from './sprites';
import {DURATION, FPS, T, VO_OFFSET} from './timing';

export const AIRPLANE_SECONDS = DURATION;

const CUES = cuesJson as readonly {cue: string; key: keyof typeof T; dt?: number; role?: string; f: string; db: number; lead?: number}[];

/**
 * "Why don't airplane windows have corners?" - 28.6 s Short.
 * World layout: hero stands on the character plane (left). The plane is a flat set piece at DEPTH.far
 * that swaps between round-window and square-window pictures. A fuselage close-up is a separate layer at DEPTH.mid
 * for the crack sequence. Demo windows are drawn in screen space for the side-by-side compare.
 */
export const Main: React.FC<{format: Format; slug: string}> = ({format, slug}) => {
  const t = useT();
  const {width: W, height: H} = FORMATS[format];

  // --- world geometry ---
  const ground = H * 0.78;
  const hero = {x: W * 0.28, y: ground};
  const planeDepth = DEPTH.far;
  const planeCentre = {x: W / 2 + 180, y: H * 0.42}; // where the plane sits in world space (set piece)
  // on the far plane, 3 world px = 1 screen px at the wide camera, so this is comfortably in the sky

  // --- stages ---
  const stage = (() => {
    if (t < 3.6) return 'premise';            // close on hero + one round window
    if (t < 7.6) return 'wide-round';          // the whole plane, round windows
    if (t < 10.0) return 'zoom-round';         // close on fuselage round, "NOT A CHOICE"
    if (t < 12.7) return 'swap';               // round swaps to square (and we hold on it)
    if (t < 15.1) return 'breathe';            // plane square, inflate/deflate
    if (t < 17.5) return 'cracks';             // zig-zag cracks grow at corners
    if (t < 22.0) return 'tear';               // 1954 + window tears
    if (t < 24.7) return 'demo';               // side-by-side square vs round, arrows
    return 'resolve';                           // round plane flies out calmly
  })();

  // --- camera ---
  // world-centre coords for the far plane centre. keys use screen-centre-based x/y with z.
  // camera at (W/2, H/2, 0) + wide shows the full plane.
  const cam = addShake(
    camPath(
      [
        // premise: close on the hero (right side of frame) and the window beside him
        {t: 0, x: hero.x + W * 0.1, y: hero.y - H * 0.25, z: 260},
        {t: 3.4, x: hero.x + W * 0.1, y: hero.y - H * 0.25, z: 260},
        // wide: whole plane in frame, held
        {t: 4.4, x: W / 2, y: H / 2, z: 0, ease: easeInOutCubic},
        {t: 7.4, x: W / 2, y: H / 2, z: 0},
        // zoom in on the round fuselage close-up (centre of frame, further in)
        {t: 8.4, x: W / 2, y: H / 2, z: 360, ease: easeInOutCubic},
        {t: 12.6, x: W / 2, y: H / 2, z: 360},
        // pull back to wide for the breathing beat
        {t: 13.1, x: W / 2, y: H / 2, z: 0, ease: easeInOutCubic},
        {t: 15.0, x: W / 2, y: H / 2, z: 0},
        // close on the square fuselage for cracks
        {t: 15.7, x: W / 2, y: H / 2, z: 420, ease: easeInOutCubic},
        {t: 17.4, x: W / 2, y: H / 2, z: 420},
        // pull back for the 1954 tear beat (dramatic)
        {t: 18.0, x: W / 2, y: H / 2, z: 60, ease: easeInOutCubic},
        {t: 21.5, x: W / 2, y: H / 2, z: 60},
        // kick back for the tear boom
        {t: 21.9, x: W / 2, y: H / 2, z: -180, ease: easeOutCubic},
        // demo scene is screen-space; hold wide
        {t: 24.8, x: W / 2, y: H / 2, z: 0, ease: easeInOutCubic},
        // resolve: pan with the plane a little
        {t: 26.5, x: W / 2 + 160, y: H / 2, z: 0, ease: easeInOutCubic},
        // loop back to the premise frame
        {t: DURATION, x: hero.x + W * 0.1, y: hero.y - H * 0.25, z: 260, ease: easeInOutCubic},
      ],
      t,
    ),
    shake(t, T.pressurised, 4, 0.25),
    shake(t, T.cracks, 5, 0.35),
    shake(t, T.corners2, 6, 0.3),
    shake(t, T.tearBoom, 36, 0.7),
    shake(t, T.disaster, 10, 0.3),
  );

  // --- helpers ---
  // during "pressurised", scale up; during "relaxed", scale back down
  const planeInflate =
    t < T.pressurised ? 1 :
    t < T.relaxed ? 1 + 0.06 * easeInOutCubic(prog(t, T.pressurised, T.relaxed - 0.2)) :
    1 + 0.06 * (1 - easeInOutCubic(prog(t, T.relaxed, T.relaxed + 0.9)));

  const showSquare = t >= T.square && t < 24.7; // square windows visible during the central beats
  const showRound = !showSquare;

  // the plane is visible when NOT in the fuselage close-up or demo scenes
  const planeVisible = (t < 7.6) || (t >= 12.6 && t < 15.1) || (t >= T.resolution - 0.1);

  // the fuselage close-up appears during the zoom-round, swap, cracks and tear stages
  const fuselageVisible = (t >= 7.6 && t < 12.6) || (t >= 15.1 && t < 22.5);

  // --- hero animation ---
  const heroShrug = (t >= T.disaster - 0.2 && t < T.comet) || (t >= T.tearBoom - 0.1 && t < 23.5) ? 1 : 0;
  const heroSpr = heroShrug ? SPRITES.hero_shrug : SPRITES.hero;
  const trembleAmt = t > T.cracks - 0.1 && t < T.tearBoom + 0.5 ? 1 : 0;
  const tr = tremble(t, trembleAmt);
  // hero appears during the premise and during the final resolve
  const heroVisible = t < 7.6 || (t >= T.resolution && t < 27.8);
  const heroBounce = wordBounce(t, T.look, 12, 0.3);
  const heroBreath = breathe(t);

  // --- frame 0 window: a single round window beside the hero ---
  const premiseWinX = hero.x + W * 0.28;
  const premiseWinY = hero.y - H * 0.28;
  const premiseWinR = Math.min(W, H) * 0.09;

  return (
    <AbsoluteFill style={{background: '#9cd3ff'}}>
      {/* sky, screen-space. Darkens slightly during the tear beat. */}
      <Sky top="#aee0ff" bottom="#e3f3ff">
        <AbsoluteFill style={{opacity: t > T.tearBoom && t < 23.0 ? 0.35 * Math.exp(-2 * (t - T.tearBoom)) : 0, background: '#1a1f2a'}} />
      </Sky>

      {/* a few far-away flat clouds for parallax - world space, far layer */}
      <Layer cam={cam} z={DEPTH.far + 400} blur={dofBlur(cam, DEPTH.far + 400)}>
        <Cloud x={W * 0.15} y={H * 0.22} s={1} />
        <Cloud x={W * 0.75} y={H * 0.3} s={0.8} />
        <Cloud x={W * 0.5} y={H * 0.15} s={0.6} />
      </Layer>

      {/* The plane as a set piece at DEPTH.far. Inflates on "pressurised", pops swap round->square.
          At DEPTH.far (3000) the layer scale is 1000/3000 = 0.333, so size=1.2 → 2400*1.2*0.333 = 960 px wide at wide cam. */}
      {planeVisible ? (
        <Layer cam={cam} z={planeDepth} blur={dofBlur(cam, planeDepth)}>
          <div
            style={{
              position: 'absolute',
              left: planeCentre.x,
              top: planeCentre.y,
              transformOrigin: '50% 50%',
              transform: `translate(-50%, -50%) scale(${planeInflate})`,
            }}
          >
            <Sprite
              s={showRound ? SPRITES.plane_round : SPRITES.plane_square}
              x={0}
              y={0}
              anchor="centre"
              size={1.2}
            />
          </div>
        </Layer>
      ) : null}

      {/* Fuselage close-up: appears from zoom-round through the cracks stage. Drawn in screen space (a card)
          so the camera glide reads as a "zoom into the window" without the sprite pixellating. The subtle pop-on
          and pop-off are keyed to the stage boundaries. */}
      {fuselageVisible ? (
        <FuselageCard
          t={t}
          cx={W / 2}
          cy={H / 2}
          W={W}
          H={H}
          square={t >= T.square}
        />
      ) : null}
      {/* cracks grow from the corners during the cracks stage */}
      {t >= T.cracks && t < 23.0 ? (
        <CrackOverlay
          t={t}
          cx={W / 2}
          cy={H / 2}
          windowW={W * 0.26}
          windowH={W * 0.26}
          startAt={T.cracks}
          endAt={T.tearBoom}
        />
      ) : null}
      {/* the tear: a dark hole + speed lines when it tears */}
      {t >= T.tearBoom - 0.05 && t < 23.0 ? (
        <TearHole t={t} cx={W / 2} cy={H / 2} at={T.tearBoom} r={W * 0.2} />
      ) : null}

      {/* Mid cloud band for parallax. Only in sky shots. */}
      <Layer cam={cam} z={DEPTH.mid + 200} blur={dofBlur(cam, DEPTH.mid + 200)}>
        <Cloud x={W * 0.1} y={H * 0.68} s={0.6} fill="#f6fbff" />
        <Cloud x={W * 0.9} y={H * 0.74} s={0.7} fill="#f6fbff" />
      </Layer>

      {/* Hero - character plane. Hero sprite is 2400 px tall natively; size 0.35 makes it ~840 world px (about H*0.44). */}
      {heroVisible ? (
        <Layer cam={cam} z={DEPTH.character}>
          <ContactShadow x={hero.x + tr.x} y={hero.y + 4} width={260} />
          <Sprite
            s={heroSpr}
            x={hero.x + tr.x}
            y={hero.y + tr.y + heroBounce.dy}
            anchor="feet"
            scaleY={heroBounce.scaleY * heroBreath}
            size={0.35}
          />
          {/* a sweat drop while the plane is breaking */}
          {t > T.tearBoom && t < 22.5 ? (
            <SweatDrop t={t} at={T.tearBoom + 0.1} x={hero.x + 90} y={hero.y - 560} />
          ) : null}
        </Layer>
      ) : null}

      {/* Screen-space overlays -------------------------------------------------- */}

      {/* Frame 0 premise: a single round window right of the hero, sitting in the sky. */}
      {t < 4.0 ? (
        <RoundWindowBadge
          x={premiseWinX}
          y={premiseWinY}
          r={premiseWinR}
          opacity={1 - clamp((t - 3.2) / 0.7)}
        />
      ) : null}

      {/* "NOT A CHOICE" stamp on the round window during zoom-round */}
      {t >= T.disaster && t < 10.3 ? (
        <Label
          t={t}
          from={T.disaster}
          to={10.1}
          x={W / 2}
          y={H * 0.86}
          text="NOT A CHOICE"
          size={66}
          color="#c22a2a"
          bg="#fff5d1"
        />
      ) : null}

      {/* 1954 card */}
      {t >= T.in1954 && t < 24.6 ? (
        <Label
          t={t}
          from={T.in1954}
          to={24.5}
          x={W / 2}
          y={H * 0.22}
          text="1954"
          size={96}
          color="#111"
          bg="#ffe36b"
        />
      ) : null}

      {/* Comet year sub-label */}
      {t >= T.comet && t < T.cracks ? (
        <Label
          t={t}
          from={T.comet}
          to={T.cracks - 0.1}
          x={W / 2}
          y={H * 0.84}
          text="de Havilland Comet"
          size={44}
          color="#111"
          bg="#fff"
        />
      ) : null}

      {/* The side-by-side demo: two full-width windows with arrows. Screen-space, flat drawn in SVG. */}
      {t >= T.round - 0.05 && t < T.resolution ? (
        <DemoCompare t={t} W={W} H={H} />
      ) : null}

      {/* audio */}
      <Voice slug={slug} offset={VO_OFFSET} />
      <SoundCues slug={slug} cues={CUES} T={T} />
    </AbsoluteFill>
  );
};

/* ---------- small sub-components ---------- */

/** Full-screen fuselage card. Drawn in screen space so cracks and the tear can be positioned precisely.
 * Swaps round -> square pictures without cross-fading (hard switch between two <Sprite> cards). */
const FuselageCard: React.FC<{t: number; cx: number; cy: number; W: number; H: number; square: boolean}> = ({cx, cy, W, H, square}) => {
  // the fuselage sprite is 2400 x 1608, with 3 windows across its full width.
  // we want it to cover the screen width with a small margin: scale ≈ W * 0.95 / 2400 = 0.428 for a 1080 comp.
  const scale = (W * 0.95) / 2400;
  const spr = square ? SPRITES.fuselage_square : SPRITES.fuselage_round;
  return (
    <div
      style={{
        position: 'absolute',
        left: cx,
        top: cy,
        transformOrigin: '50% 50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      <Sprite s={spr} x={0} y={0} anchor="centre" size={1.0} />
    </div>
  );
};

const Cloud: React.FC<{x: number; y: number; s?: number; fill?: string}> = ({x, y, s = 1, fill = '#ffffff'}) => (
  <svg style={{position: 'absolute', left: x - 200 * s, top: y - 70 * s, overflow: 'visible'}} width={400 * s} height={140 * s}>
    <g>
      <ellipse cx={200 * s} cy={80 * s} rx={180 * s} ry={50 * s} fill="#111" />
      <ellipse cx={140 * s} cy={60 * s} rx={60 * s} ry={50 * s} fill="#111" />
      <ellipse cx={260 * s} cy={55 * s} rx={70 * s} ry={55 * s} fill="#111" />
      <ellipse cx={200 * s} cy={80 * s} rx={180 * s - 10} ry={50 * s - 10} fill={fill} />
      <ellipse cx={140 * s} cy={60 * s} rx={60 * s - 10} ry={50 * s - 10} fill={fill} />
      <ellipse cx={260 * s} cy={55 * s} rx={70 * s - 10} ry={55 * s - 10} fill={fill} />
    </g>
  </svg>
);

/** A hand-drawn round window used in the premise frame, screen-space. */
const RoundWindowBadge: React.FC<{x: number; y: number; r: number; opacity?: number}> = ({x, y, r, opacity = 1}) => (
  <svg style={{position: 'absolute', left: x - r * 1.5, top: y - r * 1.5, overflow: 'visible', opacity}} width={r * 3} height={r * 3}>
    {/* fuselage white backing panel */}
    <rect x={10} y={r * 0.6} width={r * 3 - 20} height={r * 1.9} rx={30} fill="#ffffff" stroke="#111" strokeWidth={8} />
    {/* window outer ring */}
    <circle cx={r * 1.5} cy={r * 1.5} r={r * 0.95} fill="#ffffff" stroke="#111" strokeWidth={10} />
    {/* window inner glass */}
    <circle cx={r * 1.5} cy={r * 1.5} r={r * 0.78} fill="#425a86" stroke="#111" strokeWidth={8} />
    {/* highlight */}
    <path d={`M ${r * 1.1} ${r * 1.1} q ${r * 0.1} ${-r * 0.2} ${r * 0.35} ${-r * 0.15}`} stroke="#ffffff" strokeWidth={10} fill="none" strokeLinecap="round" />
  </svg>
);

/** Cracks that grow from each corner of a centred square window (screen-space inside the layer). */
const CrackOverlay: React.FC<{t: number; cx: number; cy: number; windowW: number; windowH: number; startAt: number; endAt: number}> = ({t, cx, cy, windowW, windowH, startAt, endAt}) => {
  const p = clamp((t - startAt) / (endAt - startAt));
  if (p <= 0) return null;
  const half = windowW / 2;
  const corners = [
    {x: cx - half, y: cy - half, a: 180 + 45}, // top-left -> down-left
    {x: cx + half, y: cy - half, a: -45},      // top-right -> down-right
    {x: cx - half, y: cy + half, a: 180 - 45}, // bottom-left -> up-left
    {x: cx + half, y: cy + half, a: 45},        // bottom-right -> up-right
  ];
  const path = (cx: number, cy: number, dir: number, len: number, seed: number) => {
    const pts: string[] = [`${cx},${cy}`];
    let x = cx;
    let y = cy;
    const rad = (dir * Math.PI) / 180;
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      const u = i / steps;
      const l = len * u;
      const jitter = Math.sin(seed + i * 2.3) * 22 * (1 - u * 0.4);
      x = cx + Math.cos(rad) * l + Math.cos(rad + Math.PI / 2) * jitter;
      y = cy + Math.sin(rad) * l + Math.sin(rad + Math.PI / 2) * jitter;
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  };
  const maxLen = windowW * 0.9;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      {corners.map((c, i) => {
        const len = maxLen * clamp(p * 1.6 - i * 0.05);
        if (len < 4) return null;
        const d = path(c.x, c.y, c.a - 180, len, i * 3.1 + 0.7);
        return (
          <g key={i}>
            <polyline points={d} fill="none" stroke="#111" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={d} fill="none" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
    </svg>
  );
};

/** The window tearing: a dark irregular hole that grows, plus speed lines and chunks flying out. */
const TearHole: React.FC<{t: number; cx: number; cy: number; at: number; r: number}> = ({t, cx, cy, at, r}) => {
  const p = clamp((t - at) / 0.9);
  if (p <= 0) return null;
  // star-shaped hole that grows
  const points = 11;
  const outer = r * p;
  const inner = outer * 0.65;
  const path = Array.from({length: points * 2}, (_, i) => {
    const a = (Math.PI * i) / points - Math.PI / 2;
    const rr = i % 2 === 0 ? outer : inner * (0.8 + 0.4 * Math.sin(i * 1.7));
    return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
  }).join(' ');
  return (
    <>
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
        <polygon points={path} fill="#111" />
      </svg>
      <SpeedLines t={t} at={at} x={cx} y={cy} angle={0} length={r * 2.2} count={6} life={0.5} seed="tear" />
      <Burst t={t} at={at} x={cx} y={cy} count={22} speed={[800, 2200]} size={[14, 36]} color="#445474" core="#aab8ca" gravity={2000} seed="chunks" />
      <Impact t={t} at={at} x={cx} y={cy} size={240} />
    </>
  );
};

/** Side-by-side demo: SQUARE window on the left with concentrated arrows at the corners,
 * ROUND window on the right with arrows spread evenly around the ring. Flat cartoon arrows. */
const DemoCompare: React.FC<{t: number; W: number; H: number}> = ({t, W, H}) => {
  const squareX = W * 0.28;
  const roundX = W * 0.72;
  const y = H * 0.5;
  const size = W * 0.26;
  const squareP = clamp((t - T.round) / 0.5);
  const spreadP = clamp((t - T.spread) / 0.9);
  const evenlyP = clamp((t - T.evenly) / 0.6);
  const popK = popInOut(t, T.round - 0.05, T.resolution, 0.2, 0.25);
  if (popK <= 0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* the two static window drawings */}
      <WindowCard x={squareX} y={y} size={size} shape="square" scale={popK} />
      <WindowCard x={roundX} y={y} size={size} shape="round" scale={popK} />
      {/* labels */}
      <Label t={t} from={T.round} to={T.resolution - 0.2} x={squareX} y={y - size * 0.75} text="SQUARE" size={46} color="#c22a2a" bg="#fff5d1" />
      <Label t={t} from={T.round} to={T.resolution - 0.2} x={roundX} y={y - size * 0.75} text="ROUND" size={46} color="#0f7a3a" bg="#e6ffd9" />
      {/* red arrows crammed into the corners of the square */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map((c, i) => (
        <Arrow
          key={i}
          fromX={squareX + c[0] * (size * 0.95)}
          fromY={y + c[1] * (size * 0.95)}
          toX={squareX + c[0] * (size * 0.5)}
          toY={y + c[1] * (size * 0.5)}
          color="#d92a2a"
          opacity={squareP}
        />
      ))}
      {/* a shaking bump on each corner */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map((c, i) => {
        const pulse = 1 + 0.25 * Math.max(0, Math.sin(2 * Math.PI * 4 * (t - T.round) + i)) * squareP;
        return (
          <svg key={`bump${i}`} style={{position: 'absolute', left: squareX + c[0] * (size * 0.5) - 20, top: y + c[1] * (size * 0.5) - 20, overflow: 'visible'}} width={40} height={40}>
            <circle cx={20} cy={20} r={14 * pulse} fill="#d92a2a" opacity={0.7 * squareP} />
          </svg>
        );
      })}
      {/* green arrows spread around the round ring */}
      {Array.from({length: 10}).map((_, i) => {
        const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
        const r0 = size * 0.95;
        const r1 = size * 0.55;
        const reveal = clamp(spreadP * 1.4 - i * 0.04);
        if (reveal <= 0) return null;
        return (
          <Arrow
            key={i}
            fromX={roundX + Math.cos(a) * r0}
            fromY={y + Math.sin(a) * r0}
            toX={roundX + Math.cos(a) * r1}
            toY={y + Math.sin(a) * r1}
            color="#17a05a"
            opacity={reveal}
          />
        );
      })}
      {/* green glow on "evenly" */}
      {evenlyP > 0 ? (
        <div style={{position: 'absolute', left: roundX - size * 1.1, top: y - size * 1.1, width: size * 2.2, height: size * 2.2, borderRadius: '50%', background: 'radial-gradient(circle, #a4ffb9 0%, transparent 65%)', opacity: 0.6 * evenlyP}} />
      ) : null}
    </AbsoluteFill>
  );
};

const WindowCard: React.FC<{x: number; y: number; size: number; shape: 'round' | 'square'; scale: number}> = ({x, y, size, shape, scale}) => (
  <svg style={{position: 'absolute', left: x - size, top: y - size, overflow: 'visible', transform: `scale(${scale})`, transformOrigin: `${size}px ${size}px`}} width={size * 2} height={size * 2}>
    {/* fuselage panel */}
    <rect x={10} y={10} width={size * 2 - 20} height={size * 2 - 20} rx={shape === 'round' ? 20 : 8} fill="#ffffff" stroke="#111" strokeWidth={10} />
    {/* window */}
    {shape === 'round' ? (
      <>
        <circle cx={size} cy={size} r={size * 0.72} fill="#ffffff" stroke="#111" strokeWidth={12} />
        <circle cx={size} cy={size} r={size * 0.6} fill="#425a86" stroke="#111" strokeWidth={10} />
        <path d={`M ${size * 0.6} ${size * 0.65} q ${size * 0.1} ${-size * 0.2} ${size * 0.3} ${-size * 0.15}`} stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <rect x={size * 0.25} y={size * 0.25} width={size * 1.5} height={size * 1.5} fill="#ffffff" stroke="#111" strokeWidth={12} />
        <rect x={size * 0.37} y={size * 0.37} width={size * 1.26} height={size * 1.26} fill="#425a86" stroke="#111" strokeWidth={10} />
        <path d={`M ${size * 0.55} ${size * 0.7} l ${size * 0.25} ${-size * 0.18}`} stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" />
      </>
    )}
  </svg>
);

/** A chunky cartoon arrow with a thick outline. */
const Arrow: React.FC<{fromX: number; fromY: number; toX: number; toY: number; color?: string; opacity?: number}> = ({fromX, fromY, toX, toY, color = '#111', opacity = 1}) => {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const len = Math.hypot(dx, dy);
  const w = 24;
  const head = 50;
  return (
    <svg style={{position: 'absolute', left: fromX, top: fromY, overflow: 'visible', opacity}} width={1} height={1}>
      <g transform={`rotate(${ang})`}>
        <polygon
          points={`0,${-w / 2} ${len - head},${-w / 2} ${len - head},${-w} ${len},0 ${len - head},${w} ${len - head},${w / 2} 0,${w / 2}`}
          fill={color}
          stroke="#111"
          strokeWidth={6}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
