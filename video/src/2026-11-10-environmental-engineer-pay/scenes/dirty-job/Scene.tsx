import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  DEPTH, Eyes, GroundBand, Layer, Puff, Sky, SoundCues, SweatDrop, Voice, actionSwap, addShake, blinking, breathe,
  camPath, dofBlur, easeInOutCubic, eyesPop, prog, shake, tremble, useT, whip, wordBounce, type Cue,
} from '../../../lib';
import {CashPile, MoneyCounter, Person, Prop, SLUG, SludgeBurst, Stream, Tag, Bubbles, place, swapXf, worldLen, type Pose} from '../../kit';
import cuesJson from './cues.json';
import {DURATION, GAP_AFTER, T, VO_FILE, VO_OFFSET} from './timing';

const CUES = cuesJson as Cue[];
export const SECONDS = DURATION;

/**
 * Scene 1 "Dirty job": an engineer in a hard hat next to a sewage pipe, a smoking factory and a poisoned puddle;
 * cash falls on a pile; the pile is compared with a typical worker's.
 */
export const Scene: React.FC = () => {
  const t = useT();
  const end = DURATION + GAP_AFTER;

  // ---- world ----------------------------------------------------------------------------------------------
  const G = 1480; // feet line at the character plane
  const eng = {x: 430, y: G};
  const worker = {x: -440, y: G};
  const pileE = {x: 195, y: G + 8};
  const pileW = {x: -200, y: G + 8};
  const PIPE_Z = 1150;
  const pipeSize = 0.268;
  const pipeC = {x: 967, y: 1196}; // sprite centre (flipped: mouth on the left)
  const mouth = {x: 839, y: 1178};
  const lip = {x: 828, y: 1290};
  const puddle = {x: 790, y: 1510};
  const FZ = DEPTH.far;
  const factoryC = place(FZ, 900, 846);
  const factorySize = worldLen(FZ, 330) / 2400;
  const chimney = {x: factoryC.x + (384.5 - 1200) * factorySize, y: factoryC.y + (9 - 1004) * factorySize};

  // ---- camera ---------------------------------------------------------------------------------------------
  const cam0 = camPath(
    [
      {t: 0, x: 560, y: 990, z: 120},
      {t: T.inUS - 0.2, x: 560, y: 990, z: 120},
      {t: T.inUS + 1.0, x: 360, y: 950, z: 250},
      {t: T.reveal - 0.35, x: 360, y: 950, z: 250},
      {t: T.reveal + 0.85, x: 0, y: 960, z: -260},
      {t: T.why - 0.45, x: 0, y: 960, z: -260},
      {t: T.why + 0.85, x: 520, y: 990, z: 170},
      {t: end, x: 520, y: 990, z: 170},
    ],
    t,
  );
  const lastCash = T.cash0 + 5 * 0.13;
  const cam = addShake(cam0, shake(t, lastCash, 7, 0.3), shake(t, T.sewage, 3, 0.25), shake(t, T.dirty, 5, 0.35));
  cam.x += whip(t, end, 'out');

  // ---- engineer -------------------------------------------------------------------------------------------
  const swaps = [T.paid, T.double, T.why];
  const pose: Pose = t < T.paid ? 'idle' : t < T.double ? 'happy' : t < T.why ? 'point_right' : 'thinking';
  const xf = swapXf(t, swaps, actionSwap);
  const wb = wordBounce(t, T.engineer, 14, 0.26);
  const scared = t > T.dirty + 0.15 && t < T.dirty + 1.5 ? 1 : 0;
  const tr = tremble(t, scared);
  const engFlip = pose === 'point_right'; // point towards the worker on the left

  // ---- worker ---------------------------------------------------------------------------------------------
  const wPose: Pose = t < T.workers ? 'idle' : 'shrug';
  const wXf = swapXf(t, [T.workers], actionSwap);

  // ---- pipe gags --------------------------------------------------------------------------------------------
  const pipeEyes = eyesPop(t, T.sewage - 0.12);
  const burping = (t > T.sewage - 0.05 && t < T.sewage + 0.35) || (t > T.dirty - 0.05 && t < T.dirty + 0.4);
  const gush = 1 + 0.7 * Math.max(prog(t, T.sewage - 0.05, T.sewage + 0.1) * (1 - prog(t, T.sewage + 0.3, T.sewage + 0.8)), prog(t, T.dirty - 0.05, T.dirty + 0.1) * (1 - prog(t, T.dirty + 0.35, T.dirty + 0.9)));
  const sprout = easeInOutCubic(prog(t, T.soil + 0.25, T.soil + 0.9));

  const engCash = [0, 1, 2, 3, 4, 5].map((i) => T.cash0 + i * 0.13);
  const blinkE = blinking(t, 3.3, 0.4) && pose !== 'happy';
  const blinkW = blinking(t, 3.9, 1.7);

  return (
    <AbsoluteFill>
      <Sky top="#CFC79E" bottom="#F1E8C9" />

      {/* far: smog hills, factory with smoke */}
      <Layer cam={cam} z={FZ} blur={dofBlur(cam, FZ)}>
        <div style={{position: 'absolute', left: factoryC.x - 2600, top: factoryC.y + 120, width: 5200, height: 900, borderRadius: '50%', background: '#C8BB8E', border: '7px solid #111'}} />
        {Array.from({length: 26}, (_, i) => {
          const at = -0.6 + i * 0.82;
          return <Puff key={i} t={t} at={at} x={chimney.x + (i % 2 ? 18 : -14)} y={chimney.y - 30} life={2.2} size={64} rise={520} drift={140} count={5} fill="#9C978F" shade="#7F7A73" seed={`sm${i}`} />;
        })}
        <Puff t={t} at={T.smoke - 0.05} x={chimney.x} y={chimney.y - 40} life={2.4} size={130} rise={640} drift={220} count={7} fill="#8F8A83" shade="#6F6A64" seed="bigsmoke" />
        <Prop name="factory" x={factoryC.x} y={factoryC.y} size={factorySize} />
        <GroundBand top={factoryC.y + 1004 * factorySize - 10} color="#B9A877" horizon />
      </Layer>

      <Layer cam={cam} z={DEPTH.mid} blur={dofBlur(cam, DEPTH.mid)}>
        <GroundBand top={1395} color="#AE9668" />
      </Layer>

      {/* the sewage pipe sticks out of a dirt bank on the right */}
      <Layer cam={cam} z={PIPE_Z} blur={dofBlur(cam, PIPE_Z, 0, 350, 1.6)}>
        <div style={{position: 'absolute', left: 900, top: 1000, width: 1300, height: 900, borderRadius: '48% 48% 0 0', background: '#9A7C52', border: '7px solid #111'}} />
        <div style={{position: 'absolute', left: 990, top: 1060, width: 900, height: 120, borderRadius: '50%', background: '#B08E60'}} />
        <Stream t={t} d={`M ${lip.x} ${lip.y} C ${lip.x - 26} ${lip.y + 80} ${puddle.x + 10} ${puddle.y - 120} ${puddle.x} ${puddle.y - 8}`} width={30 * gush} />
        <Prop name="sewer_pipe" x={pipeC.x} y={pipeC.y} size={pipeSize} flip sx={burping ? 1.04 : 1} sy={burping ? 0.96 : 1} />
        <Eyes x={1035} y={1065} r={30} gap={26} brows open={pipeEyes} look={{x: -0.9, y: 0.2}} squeeze={burping} tilt={t > T.dirty ? 12 : 0} />
        <SludgeBurst t={t} at={T.sewage} x={mouth.x - 40} y={mouth.y + 40} dir={-1} floorY={1530} count={8} seed="burp1" />
        <SludgeBurst t={t} at={T.dirty} x={mouth.x - 40} y={mouth.y + 40} dir={-1} floorY={1560} count={11} seed="burp2" />
        <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <ellipse cx={puddle.x} cy={puddle.y} rx={190} ry={44} fill="#5E6B2E" stroke="#111" strokeWidth={7} />
          <ellipse cx={puddle.x - 30} cy={puddle.y - 6} rx={120} ry={22} fill="#76853A" />
        </svg>
        <Bubbles t={t} at={T.soil} x={puddle.x - 20} y={puddle.y - 4} w={220} count={7} seed="soil" />
        <Bubbles t={t} at={T.soil + 1.6} x={puddle.x} y={puddle.y - 4} w={200} count={4} seed="soil2" />
      </Layer>

      <Layer cam={cam} z={DEPTH.character}>
        <GroundBand top={G + 55} color="#98794F" />
        {/* a wilted sprout in the poisoned soil */}
        <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <ellipse cx={640} cy={G + 34} rx={70} ry={16} fill="#6B5A35" />
          <g transform={`translate(640 ${G + 30}) rotate(${-8 + 62 * sprout})`}>
            <path d="M 0 0 Q -6 -50 4 -96" fill="none" stroke="#111" strokeWidth={15} strokeLinecap="round" />
            <path d="M 0 0 Q -6 -50 4 -96" fill="none" stroke="#7FA34A" strokeWidth={7} strokeLinecap="round" />
            <path d="M 3 -90 q 34 -20 52 4 q -28 18 -52 -4 Z" fill="#8DB356" stroke="#111" strokeWidth={6} strokeLinejoin="round" />
          </g>
        </svg>

        {/* the typical worker and the smaller pile (off to the left until the camera pulls back) */}
        <CashPile t={t} x={pileW.x} y={pileW.y} landAt={[0, 0, 0]} size={0.12} seed="pileW" />
        <Person pose={wPose} x={worker.x} y={worker.y} size={0.32} xf={wXf} tie blink={blinkW} breath={breathe(t, 1.3)} />

        <CashPile t={t} x={pileE.x} y={pileE.y} landAt={engCash} size={0.12} seed="pileE" />
        <Person
          pose={pose}
          x={eng.x + tr.x}
          y={eng.y + tr.y}
          size={0.32}
          xf={xf}
          dy={wb.dy}
          hat
          blink={blinkE}
          breath={breathe(t) * wb.scaleY}
          flip={engFlip}
        />
        <SweatDrop t={t} at={T.dirty + 0.25} x={eng.x + 110} y={eng.y - 760} />

        {/* labels */}
        <Tag t={t} from={T.envEng} to={T.salary - 0.12} x={360} y={560} text="ENVIRONMENTAL ENGINEER" size={50} bg="#FFF6D6" />
        <MoneyCounter t={t} t0={T.salary} t1={T.salary + 0.9} to={T.reveal + 0.1} x={360} y={560} value={107110} suffix=" A YEAR" size={74} bounceAt={T.year} />
        <Tag t={t} from={T.reveal + 0.35} to={T.why - 0.25} x={0} y={500} text="MEDIAN PAY, U.S. (2025)" size={66} />
        <MoneyCounter t={t} t0={T.reveal + 0.5} t1={T.reveal + 0.5} to={T.why - 0.25} x={pileE.x + 20} y={930} value={107110} size={66} />
        <MoneyCounter t={t} t0={T.median} t1={T.median + 0.7} to={T.why - 0.25} x={pileW.x - 20} y={1110} value={50980} size={66} bg="#F2F2F2" />
        <Tag t={t} from={T.double} to={T.why - 0.25} x={0} y={735} text="× 2.1" size={96} bg="#FFE36B" rotate={-5} />
        <Tag t={t} from={T.much} x={eng.x + 40} y={430} text="?" size={110} bg="#FFF6D6" bounceAt={T.much + 0.5} />
      </Layer>

      <Voice slug={SLUG} file={VO_FILE} offset={VO_OFFSET} />
      <SoundCues slug={SLUG} cues={CUES} T={T} />
    </AbsoluteFill>
  );
};

