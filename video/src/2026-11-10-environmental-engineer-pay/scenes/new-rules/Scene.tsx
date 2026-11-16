import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {
  DEPTH, INK, Layer, OUTLINE, SoundCues, Sprite, SweatDrop, Voice, actionSwap, addShake, blinking, breathe,
  camPath, clamp, easeInOutCubic, easeOutBack, easeOutCubic, prog, shake, useT, whip, type Cue,
} from '../../../lib';
import {
  C, Calendar, CashPile, Critter, Drop, Dust, Pen, Person, Prop, Ripple, SLUG, Sparkle, Stream, Tag, fallY, landSquash, pop, swapXf,
} from '../../kit';
import {SPRITES} from '../../sprites';
import cuesJson from './cues.json';
import {DURATION, GAP_AFTER, T, VO_FILE, VO_OFFSET} from './timing';

const CUES = cuesJson as Cue[];
export const SECONDS = DURATION;

const fast = (x: number) => easeInOutCubic(x);

export const Scene: React.FC = () => {
  const t = useT();
  const end = DURATION + GAP_AFTER;

  // ---- regions --------------------------------------------------------------------------------------------
  // kitchen around y 1000, pools around y -1650, street section around y 4100 (the town on top of it)
  const COUNTER = 1250;
  const faucet = {x: 720, y: COUNTER - 288, size: 0.24};
  const spout = {x: faucet.x + (1474 - 796.5) * faucet.size, y: faucet.y + (974 - 1200) * faucet.size};
  const glass = {x: spout.x, y: COUNTER - 120, size: 0.1};
  const water = {x0: glass.x + (158 - 789.5) * glass.size, x1: glass.x + (1532 - 789.5) * glass.size, y0: glass.y + (236 - 1200) * glass.size, y1: glass.y + (2357 - 1200) * glass.size};
  const POOL_Y = -1650;
  const SURF = 3900; // ground surface in the street section
  const PIPE_Y = 4250;

  // ---- camera ---------------------------------------------------------------------------------------------
  const cam0 = camPath(
    [
      {t: 0, x: 760, y: 930, z: 130},
      {t: T.trillion + 0.3, x: 760, y: 930, z: 190},
      {t: T.pools - 0.25, x: 760, y: 930, z: 190},
      {t: T.pools + 0.2, x: 540, y: POOL_Y, z: 0, ease: fast},
      {t: T.sameYear - 0.3, x: 540, y: POOL_Y, z: 40},
      {t: T.sameYear + 0.12, x: 540, y: 4100, z: 0, ease: fast},
      {t: T.leadPipes + 0.9, x: 540, y: 4100, z: 0},
      {t: T.law2021 + 0.2, x: 540, y: 3640, z: -120},
      {t: T.projects - 0.6, x: 540, y: 3640, z: -120},
      {t: T.plans - 0.3, x: 560, y: 3450, z: 150},
      {t: end, x: 560, y: 3450, z: 170},
    ],
    t,
  );
  const cam = addShake(cam0, shake(t, T.olympic, 5, 0.3), shake(t, T.all, 10, 0.35));
  cam.x += whip(t, end, 'out') + whip(t, end, 'in');
  const region = cam0.y < -400 ? 'pools' : cam0.y > 2600 ? 'street' : 'kitchen';

  // ---- kitchen: water, critters ---------------------------------------------------------------------------
  const tapOn = t > T.forever - 0.35 && t < T.pools;
  const streamK = easeOutCubic(prog(t, T.forever - 0.35, T.forever - 0.1));
  const critters = [0, 1, 2, 3, 4].map((i) => {
    const t0 = T.forever + i * 0.09;
    const p = prog(t, t0, t0 + 0.45);
    const homeX = water.x0 + 30 + ((water.x1 - water.x0 - 60) * (i + 0.5)) / 5;
    const homeY = water.y0 + 70 + 60 * random(`cy${i}`) + 20 * Math.sin(t * 2 + i);
    return {x: p < 1 ? spout.x : homeX, y: p < 1 ? spout.y + (homeY - spout.y) * easeOutCubic(p) : homeY, k: t < t0 ? 0 : 1, i};
  });
  const star = (i: number) => i === 1 || i === 3;
  const starOut = easeOutBack(prog(t, T.two - 0.1, T.two + 0.3));
  const starPos = (i: number) => ({x: i === 1 ? glass.x - 200 : glass.x + 200, y: COUNTER - 70});
  const scared = t > T.trillion;
  const react = t > T.four - 0.05 && t < T.pools - 0.1;
  const reactK = easeOutBack(prog(t, T.four - 0.05, T.four + 0.25));

  // ---- pools ----------------------------------------------------------------------------------------------
  const poolSize = 0.3;
  const poolYs = [-660, -330, 0, 330, 660].map((d) => POOL_Y + d);
  const dropFall = prog(t, T.drop, T.olympic);
  const dropY = POOL_Y - 880 + (poolYs[2] - (POOL_Y - 880)) * dropFall * dropFall;

  // ---- street: lead pipe out, new pipe in -----------------------------------------------------------------
  // the old pipe is pulled out of the trench to the right, the new one slides in from the left
  const leadX = 540 + 1500 * Math.pow(prog(t, T.replace - 0.05, T.replace + 0.45), 2);
  const newX = -1000 + 1540 * easeOutCubic(prog(t, T.replace + 0.25, T.all));
  const [nsx, nsy] = landSquash(t, T.all, 0.08);

  // ---- money rain on the town -----------------------------------------------------------------------------
  const rain = Array.from({length: 16}, (_, i) => ({
    at: T.fifty - 0.55 + i * 0.12 + 0.08 * random(`ra${i}`),
    x: 110 + 860 * random(`rx${i}`),
  }));

  // ---- blueprint ------------------------------------------------------------------------------------------
  const bpK = easeOutBack(prog(t, T.plans - 0.5, T.plans), 1.4);
  const engIn = easeOutCubic(prog(t, T.projects - 0.4, T.projects + 0.3));
  const engPose = t < T.who ? 'point_right' : 'thinking';
  const engXf = swapXf(t, [T.who], actionSwap);
  const penK = pop(t, T.who - 0.1);
  const penWiggle = 18 * Math.sin(2 * Math.PI * 1.3 * (t - T.who));

  const bg = region === 'pools' ? '#E4ECEF' : region === 'street' ? '#A8DEFF' : '#F6E7C9';

  return (
    <AbsoluteFill style={{background: bg}}>
      <Layer cam={cam} z={DEPTH.character}>
        {/* ---------------- kitchen ---------------- */}
        <div style={{position: 'absolute', left: -400, top: 700, width: 2000, height: COUNTER - 700, background: 'repeating-linear-gradient(90deg, #F9F3E6 0 118px, #E9DDC6 118px 124px), #F9F3E6'}} />
        <div style={{position: 'absolute', left: -400, top: 700, width: 2000, height: COUNTER - 700, background: 'repeating-linear-gradient(0deg, transparent 0 118px, #E9DDC6 118px 124px)'}} />
        <div style={{position: 'absolute', left: -400, top: COUNTER, width: 2000, height: 46, background: '#C99E6E', border: `${OUTLINE}px solid ${INK}`}} />
        <div style={{position: 'absolute', left: -400, top: COUNTER + 46, width: 2000, height: 900, background: '#B5895B', borderTop: `${OUTLINE}px solid ${INK}`}} />
        <Prop name="faucet" x={faucet.x} y={faucet.y} size={faucet.size} />
        {tapOn ? <Stream t={t} d={`M ${spout.x} ${spout.y - 4} L ${spout.x} ${water.y0 + 40}`} width={26 * streamK} colors={{edge: C.waterEdge, main: C.water, core: C.waterCore}} speed={2.4} /> : null}
        <Prop name="water_glass" x={glass.x} y={glass.y} size={glass.size} />
        {critters.map((c) =>
          star(c.i) && t > T.two - 0.1 ? (
            <Critter key={c.i} x={c.x + (starPos(c.i).x - c.x) * starOut} y={c.y + (starPos(c.i).y - c.y) * starOut - 60 * Math.sin(Math.PI * clamp(starOut))} r={20 + 22 * clamp(starOut)} t={t} phase={c.i} mood={scared ? 'scared' : 'smug'} />
          ) : (
            <Critter key={c.i} x={c.x} y={c.y} r={18} t={t} phase={c.i} k={c.k * (t > T.two - 0.1 && t < T.pools ? 1 : 1)} mood={scared ? 'scared' : 'smug'} />
          ),
        )}
        <Tag t={t} from={T.bestKnown} to={T.pools - 0.2} x={starPos(1).x} y={COUNTER - 165} text="PFOA" size={42} bg="#F3E5FB" />
        <Tag t={t} from={T.bestKnown + 0.25} to={T.pools - 0.2} x={starPos(3).x} y={COUNTER - 165} text="PFOS" size={42} bg="#F3E5FB" />
        <SweatDrop t={t} at={T.trillion + 0.1} x={starPos(1).x + 30} y={COUNTER - 120} size={16} />
        <SweatDrop t={t} at={T.trillion + 0.25} x={starPos(3).x + 30} y={COUNTER - 120} size={16} />
        {react ? (
          <Sprite s={SPRITES.closeup_react} x={514} y={1385 + 420 * (1 - reactK)} anchor="head" size={0.3} />
        ) : null}
        <Tag t={t} from={T.y2024} to={T.epa - 0.1} x={760} y={590} text="2024" size={80} bg="#FFE36B" />
        <Tag t={t} from={T.epa} to={T.forever - 0.1} x={760} y={590} text="EPA: FIRST NATIONAL LIMITS" size={44} bg="#E9F6FF" />
        <Tag t={t} from={T.forever} to={T.four - 0.12} x={760} y={590} text="“FOREVER CHEMICALS” (PFAS)" size={42} bg="#F3E5FB" color={C.pfasDark} />
        <Tag t={t} from={T.four} to={T.pools - 0.15} x={760} y={590} text="4 PARTS PER TRILLION" size={54} bg="#FFE36B" bounceAt={T.trillion} />

        {/* ---------------- pools ---------------- */}
        {region === 'pools' || (t > T.pools - 0.4 && t < T.sameYear + 0.3) ? (
          <>
            {poolYs.map((py, i) => {
              const k = easeOutBack(prog(t, T.pools - 0.05 + i * 0.07, T.pools + 0.2 + i * 0.07));
              return <Prop key={i} name="olympic_pool" x={540} y={py} size={poolSize} sx={k} sy={k} />;
            })}
            {t > T.drop - 0.25 && t < T.olympic ? <Drop x={540} y={dropY} r={42} k={pop(t, T.drop - 0.25)} stretch={1 + 0.25 * dropFall} /> : null}
            <Ripple t={t} at={T.olympic} x={540} y={poolYs[2] + 10} size={150} />
            <Ripple t={t} at={T.olympic + 0.15} x={540} y={poolYs[2] + 10} size={100} color={C.waterCore} />
            <Tag t={t} from={T.drop} to={T.sameYear - 0.2} x={250} y={POOL_Y - 730} text="1 DROP" size={56} bg="#E9F6FF" />
            <Tag t={t} from={T.five} to={T.sameYear - 0.2} x={760} y={POOL_Y - 730} text="5 POOLS" size={56} bg="#E9F6FF" />
            <Tag t={t} from={T.olympic + 0.3} to={T.sameYear - 0.2} x={540} y={POOL_Y + 830} text="≈ 4 PARTS PER TRILLION" size={54} bg="#FFE36B" />
          </>
        ) : null}

        {/* ---------------- street section ---------------- */}
        {region !== 'pools' && t > T.sameYear - 0.6 ? (
          <>
            <div style={{position: 'absolute', left: -800, top: SURF, width: 2700, height: 1400, background: '#A67C52', borderTop: `${OUTLINE}px solid ${INK}`}} />
            <div style={{position: 'absolute', left: -800, top: SURF + 520, width: 2700, height: 900, background: '#94693F'}} />
            {Array.from({length: 18}, (_, i) => (
              <div key={i} style={{position: 'absolute', left: -600 + 150 * i + 60 * random(`pb${i}`), top: SURF + 80 + 600 * random(`pc${i}`), width: 34, height: 22, borderRadius: '50%', background: '#7E5A36'}} />
            ))}
            <div style={{position: 'absolute', left: -800, top: SURF - 60, width: 2700, height: 60, background: '#8E8E8E', borderTop: `${OUTLINE}px solid ${INK}`}} />
            <Prop name="town" x={560} y={SURF - 60 - 762 * 0.47 * 0.5} size={0.47} />
            {/* water main on the left and the service pipe into the house row */}
            <div style={{position: 'absolute', left: -90, top: PIPE_Y - 70, width: 160, height: 160, borderRadius: '50%', background: '#5C7FA3', border: `${OUTLINE}px solid ${INK}`}} />
            {t < T.replace + 0.5 ? <Prop name="lead_pipe" x={leadX} y={PIPE_Y} size={0.36} /> : null}
            {t > T.replace + 0.2 ? <Prop name="new_pipe" x={newX} y={PIPE_Y} size={0.36} sx={nsx} sy={nsy} /> : null}
            <Dust t={t} at={T.all} x={540} y={PIPE_Y + 90} spread={420} size={44} color="#C9A57A" shade="#A98657" />
            <Tag t={t} from={T.sameYear} to={T.replace - 0.1} x={540} y={3460} text="ALSO IN 2024" size={60} bg="#FFE36B" />
            <Tag t={t} from={T.sameYear + 0.6} to={T.replace - 0.1} x={540} y={PIPE_Y + 190} text="LEAD PIPE" size={50} bg="#EDEDED" color={C.redDark} />
            <Calendar t={t} at={T.tenYears - 0.15} until={T.leadPipes + 0.7} x={860} y={PIPE_Y + 330} w={180} n0={1} n1={10} t1={T.tenYears + 0.9} />
            <Tag t={t} from={T.replace} to={T.leadPipes + 0.75} x={540} y={3460} text="REPLACE ALMOST ALL LEAD PIPES" size={48} bg="#E9F6FF" />
            <Tag t={t} from={T.all + 0.15} to={T.leadPipes + 0.75} x={300} y={PIPE_Y + 330} text="10 YEARS" size={50} bg="#fff" />

            {/* money rain on the town and its water plant */}
            <Prop name="treatment_tank" x={820} y={SURF - 60 - 160} size={0.2} />
            {rain.map((r, i) => {
              const f = fallY(t, r.at, SURF - 100, 1500, 3600);
              if (!f.on) return null;
              const k = f.landed ? 1 - prog(t, r.at + 0.9, r.at + 1.15) : 1;
              if (k <= 0.02) return null;
              return <Prop key={i} name="cash_bundle" x={r.x} y={f.y} size={0.07} rotate={(random(`rr${i}`) - 0.5) * 50 * (1 - prog(t, r.at - 0.2, r.at))} sx={k} sy={k} />;
            })}
            <CashPile t={t} x={260} y={SURF - 60} landAt={[T.fifty + 0.2, T.fifty + 0.4, T.fifty + 0.6, T.fifty + 0.8]} size={0.08} seed="townpile" drop={1700} />
            <Sparkle t={t} at={T.fixing} x={820} y={SURF - 320} size={44} />
            <Sparkle t={t} at={T.fixing + 0.2} x={620} y={SURF - 300} size={34} />
            <Sparkle t={t} at={T.fixing + 0.35} x={940} y={SURF - 250} size={30} />
            <Tag t={t} from={T.law2021} to={T.fifty - 0.15} x={540} y={3200} text="2021 LAW" size={64} bg="#FFE36B" />
            <Tag t={t} from={T.fifty} to={T.projects - 0.2} x={540} y={3200} text="$50 BILLION+ FOR WATER" size={56} bg="#E8FFE2" color={C.greenDark} />

            {/* the plans */}
            <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: `680px 3560px`, transform: `scale(1, ${Math.max(0.001, bpK)})`}}>
              {bpK > 0.01 ? <Prop name="blueprint" x={680} y={3560} size={0.22} /> : null}
            </div>
            {engIn > 0.001 ? (
              <Person pose={engPose} x={-60 + 330 * engIn} y={SURF + 40} size={0.3} xf={engXf} hat blink={blinking(t, 3.2)} breath={breathe(t)} />
            ) : null}
            <Pen x={780 + penWiggle} y={3520 - 40 * Math.abs(Math.sin(2 * Math.PI * 1.3 * (t - T.who)))} rotate={28} k={penK} len={220} />
            <Tag t={t} from={T.sign} x={880} y={3290} text="?" size={96} bg="#FFF6D6" />
          </>
        ) : null}
      </Layer>

      <Voice slug={SLUG} file={VO_FILE} offset={VO_OFFSET} />
      <SoundCues slug={SLUG} cues={CUES} T={T} />
    </AbsoluteFill>
  );
};

