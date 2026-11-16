import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  DEPTH, Eyes, INK, Layer, OUTLINE, SoundCues, SpeedLines, Voice, actionSwap, addShake, blinking, breathe, camPath, easeInOutCubic,
  easeOutCubic, eyesPop, prog, shake, useT, whip, type Cue, type PoseXf,
} from '../../../lib';
import {C, Clock, CoinBurst, InfoCard, Nightstand, Person, Prop, SLUG, Sparkle, Tag, Zzz, landSquash, pop, swapXf, type Pose} from '../../kit';
import cuesJson from './cues.json';
import {DURATION, GAP_AFTER, T, VO_FILE, VO_OFFSET} from './timing';

const CUES = cuesJson as Cue[];
export const SECONDS = DURATION;
const fast = (x: number) => easeInOutCubic(x);

/** The WG room in the morning (shared with scene 6 at night). Exported so the last scene reuses the same layout. */
export const ROOM = {
  floor: 935,
  window: {x: 330, y: 380, size: 0.2},
  panes: {x0: 204, y0: 172, x1: 456, y1: 554},
  stand: {x: 760, top: 735},
  clock: {x: 760, y: 645, size: 0.075, face: {x: 762, y: 658, r: 52}},
  bed: {x: 1390, y: 699, size: 0.42},
  lie: {x: 1650, y: 660}, // feet of the lying pose (rotated -90 deg: head on the pillow at the left)
  blanket: {x0: 1235, x1: 1715, y0: 596, y1: 712},
  standX: 560,
};

/** Wall, floor, window with sky behind it, nightstand, bed. `night` swaps the colours. */
export const RoomSet: React.FC<{t: number; night?: boolean; dim?: number}> = ({t, night = false, dim = 0}) => {
  const R = ROOM;
  return (
    <>
      <div style={{position: 'absolute', left: -1400, top: -900, width: 3900, height: 900 + R.floor, background: night ? '#5B5F86' : '#F4E3C3'}} />
      <div style={{position: 'absolute', left: -1400, top: R.floor - 220, width: 3900, height: 26, background: night ? '#4C5075' : '#E6CFA6', borderTop: `${OUTLINE}px solid ${INK}`}} />
      <div style={{position: 'absolute', left: -1400, top: R.floor, width: 3900, height: 900, background: night ? '#6B5442' : '#C99A6A', borderTop: `${OUTLINE}px solid ${INK}`}} />
      <div style={{position: 'absolute', left: -1400, top: R.floor + 90, width: 3900, height: 900, background: night ? '#5E4939' : '#BB8C5E'}} />
      {/* sky behind the window panes */}
      <div style={{position: 'absolute', left: R.panes.x0, top: R.panes.y0, width: R.panes.x1 - R.panes.x0, height: R.panes.y1 - R.panes.y0, overflow: 'hidden', background: night ? 'linear-gradient(#141a3a, #2b2f5e)' : 'linear-gradient(#8fd0ff, #ffe2b0)'}}>
        {night ? (
          <>
            <div style={{position: 'absolute', left: 150, top: 40, width: 56, height: 56, borderRadius: '50%', background: '#FFF3C4', boxShadow: '-14px 0 0 0 #141a3a inset'}} />
            {[[40, 60], [100, 150], [190, 230], [60, 300], [210, 120]].map(([x, y], i) => (
              <div key={i} style={{position: 'absolute', left: x, top: y, width: 8, height: 8, borderRadius: 4, background: '#FFF3C4', opacity: 0.6 + 0.4 * Math.sin(t * 3 + i)}} />
            ))}
          </>
        ) : (
          <div style={{position: 'absolute', left: 140, top: 210, width: 90, height: 90, borderRadius: '50%', background: '#FFD45A', border: `${OUTLINE}px solid ${INK}`}} />
        )}
      </div>
      <Prop name="window" x={R.window.x} y={R.window.y} size={R.window.size} />
      <Nightstand x={R.stand.x} y={R.stand.top} w={170} h={R.floor - R.stand.top} />
      <Prop name="bed" x={R.bed.x} y={R.bed.y} size={R.bed.size} />
      {dim > 0.01 ? <div style={{position: 'absolute', left: -1400, top: -900, width: 3900, height: 2700, background: '#0b0d22', opacity: 0.45 * dim}} /> : null}
    </>
  );
};

/** The person lying in bed (idle pose turned -90 deg) under a blanket. */
export const LyingInBed: React.FC<{t: number; asleep: boolean; tremble?: number}> = ({t, asleep, tremble = 0}) => {
  const R = ROOM;
  const br = 1 + 0.012 * Math.sin(2 * Math.PI * 0.35 * t);
  const xf: PoseXf = {scaleX: 1, scaleY: 1, rotate: -90, swapped: false, dy: 0};
  return (
    <>
      <Person pose="idle" x={R.lie.x + tremble * Math.sin(t * 90)} y={R.lie.y} size={0.26} xf={xf} blink={asleep} shadow={false} />
      <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <path
          d={`M ${R.blanket.x0} ${R.blanket.y0 + 30} Q ${R.blanket.x0 + 10} ${R.blanket.y0 - 4 * br} ${R.blanket.x0 + 60} ${R.blanket.y0 - 6 * br} L ${R.blanket.x1 - 30} ${R.blanket.y0 + 4} Q ${R.blanket.x1 + 6} ${R.blanket.y0 + 10} ${R.blanket.x1} ${R.blanket.y0 + 50} L ${R.blanket.x1 + 14} ${R.blanket.y1} L ${R.blanket.x0 - 10} ${R.blanket.y1} Z`}
          fill="#5B8DEF"
          stroke={INK}
          strokeWidth={OUTLINE}
          strokeLinejoin="round"
        />
        <path d={`M ${R.blanket.x0 + 20} ${R.blanket.y0 + 26} L ${R.blanket.x1 - 20} ${R.blanket.y0 + 30}`} stroke="#8DB3FF" strokeWidth={12} strokeLinecap="round" />
      </svg>
    </>
  );
};

export const Scene: React.FC = () => {
  const t = useT();
  const end = DURATION + GAP_AFTER;
  const R = ROOM;
  const OUT = {x: 3800};

  // ---- camera ---------------------------------------------------------------------------------------------
  const cam0 = camPath(
    [
      {t: 0, x: 1050, y: 590, z: 150},
      {t: T.jump - 0.2, x: 1050, y: 590, z: 150},
      {t: T.jump + 0.9, x: 900, y: 570, z: 170},
      {t: T.most - 0.35, x: 900, y: 570, z: 170},
      {t: T.most + 0.35, x: OUT.x, y: 540, z: 0, ease: fast},
      {t: T.back - 0.25, x: OUT.x, y: 540, z: 0},
      {t: T.back + 0.4, x: 900, y: 570, z: 170, ease: fast},
      {t: end, x: 900, y: 570, z: 170},
    ],
    t,
  );
  const cam = addShake(cam0, shake(t, T.waking, 6, 0.6), shake(t, T.jump + 0.4, 9, 0.3));
  cam.x += whip(t, end, 'out');

  // ---- student --------------------------------------------------------------------------------------------
  const inBed = t < T.jump;
  const jumpP = prog(t, T.jump, T.jump + 0.4);
  const jx = 1250 + (R.standX - 1250) * easeOutCubic(jumpP);
  const jy = 700 + (R.floor - 700) * jumpP - 150 * Math.sin(Math.PI * jumpP);
  let pose: Pose = 'happy';
  if (t >= T.jump + 0.4) pose = t < T.tuition ? 'happy' : t < T.zero ? 'point_right' : t < T.back ? 'happy' : t < T.fee ? 'idle' : t < T.hides ? 'point_right' : t < T.what ? 'thinking' : 'shrug';
  const swaps = [T.tuition, T.zero, T.back, T.fee, T.hides, T.what];
  let xf: PoseXf = swapXf(t, swaps, actionSwap);
  if (t >= T.jump + 0.4 && t < T.jump + 0.9) {
    const [sx, sy] = landSquash(t, T.jump + 0.4, 0.14);
    xf = {...xf, scaleX: sx, scaleY: sy};
  }

  // ---- alarm clock ----------------------------------------------------------------------------------------
  const ringing = t > T.waking - 0.1 && t < T.jump;
  const ringRot = ringing ? 7 * Math.sin(2 * Math.PI * 16 * t) : 0;

  return (
    <AbsoluteFill style={{background: '#F4E3C3'}}>
      <Layer cam={cam} z={DEPTH.character}>
        {/* ---------- the room ---------- */}
        <RoomSet t={t} />
        <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: `${R.clock.x}px ${R.stand.top}px`, transform: `rotate(${ringRot}deg)`}}>
          <Prop name="alarm_clock" x={R.clock.x} y={R.clock.y} size={R.clock.size} />
          <Clock x={R.clock.face.x} y={R.clock.face.y} r={R.clock.face.r} minutes={7 * 60} />
          <Eyes x={R.clock.face.x} y={R.clock.face.y - 4} r={13} gap={12} outline={4} open={eyesPop(t, T.waking - 0.1) * (t < T.jump + 0.6 ? 1 : 0)} brows tilt={14} squeeze={ringing && Math.sin(t * 20) > 0.6} />
        </div>
        {ringing ? (
          <>
            <SpeedLines t={t} at={T.waking - 0.1 + Math.floor((t - T.waking) / 0.3) * 0.3} x={R.clock.x - 110} y={R.clock.y - 40} angle={200} length={60} count={3} life={0.28} seed={`r${Math.floor(t / 0.3)}`} />
            <SpeedLines t={t} at={T.waking - 0.1 + Math.floor((t - T.waking) / 0.3) * 0.3} x={R.clock.x + 110} y={R.clock.y - 40} angle={-20} length={60} count={3} life={0.28} seed={`l${Math.floor(t / 0.3)}`} />
          </>
        ) : null}
        {inBed ? <LyingInBed t={t} asleep={t < T.waking} tremble={ringing ? 1 : 0} /> : null}
        <Zzz t={t} x={1190} y={530} size={72} on={t < T.waking - 0.1} />
        {/* the blanket flies off when the student jumps out */}
        {!inBed && t < T.jump + 0.9 ? (
          <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '1470px 660px', transform: `translate(${380 * jumpP}px, ${-520 * Math.sin(Math.PI * Math.min(1, jumpP * 0.8)) + 900 * Math.max(0, jumpP - 0.7)}px) rotate(${40 * jumpP}deg)`}}>
            <div style={{position: 'absolute', left: R.blanket.x0, top: R.blanket.y0, width: R.blanket.x1 - R.blanket.x0, height: R.blanket.y1 - R.blanket.y0, background: '#5B8DEF', border: `${OUTLINE}px solid ${INK}`, borderRadius: 30}} />
          </div>
        ) : null}
        {!inBed ? (
          <Person pose={pose} x={jumpP < 1 ? jx : R.standX} y={jumpP < 1 ? jy : R.floor} size={0.26} xf={xf} backpack blink={blinking(t, 3.3, 0.6) && pose !== 'happy'} breath={breathe(t)} shadow={jumpP >= 1} />
        ) : null}

        {/* tuition bill */}
        <InfoCard t={t} at={T.tuition} to={T.most + 0.2} x={1150} y={300} w={420} title="TUITION BILL" lines={[t < T.zero ? '€ . . .' : '€0']} size={72} header={C.red} from={{x: 1500, y: -300}} />
        <Sparkle t={t} at={T.zero + 0.05} x={1290} y={270} size={40} />
        <Sparkle t={t} at={T.zero + 0.2} x={1010} y={350} size={30} />

        {/* semester fee and the gift box (back in the room) */}
        <InfoCard t={t} at={T.fee} to={T.hides - 0.1} x={1100} y={320} w={580} title="SEMESTER FEE" lines={['A FEW HUNDRED €']} size={50} header="#3A6FD8" />
        <CoinBurst t={t} at={T.few} x={1080} y={360} count={8} seed="fee" spread={[-50, 50]} speed={[500, 900]} />
        {t > T.hides - 0.2 ? (
          <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: `840px ${R.floor}px`, transform: `rotate(${t > T.bonus ? 8 * Math.sin(2 * Math.PI * 3 * (t - T.bonus)) * Math.exp(-1.2 * (t - T.bonus)) : 0}deg)`}}>
            <Prop name="gift_box" x={840} y={R.floor} size={0.1 * pop(t, T.hides - 0.2)} anchor="bottom" />
          </div>
        ) : null}
        <Sparkle t={t} at={T.bonus} x={930} y={760} size={34} />
        <Tag t={t} from={T.what} x={840} y={630} text="?" size={90} bg="#FFF6D6" />

        {/* ---------- outside: the university ---------- */}
        <div style={{position: 'absolute', left: 2450, top: -900, width: 2800, height: 900 + 930, background: 'linear-gradient(#8ED3FF, #E3F5FF)'}} />
        <div style={{position: 'absolute', left: 2450, top: 930, width: 2800, height: 900, background: '#CFC6B4', borderTop: `${OUTLINE}px solid ${INK}`}} />
        <Prop name="university" x={OUT.x} y={930} size={0.45} anchor="bottom" />
        <Tag t={t} from={T.most + 0.3} to={T.exceptions - 0.1} x={OUT.x} y={70} text="MOST PUBLIC UNIVERSITIES" size={46} />
        <Tag t={t} from={T.noTuition} to={T.exceptions - 0.1} x={OUT.x} y={170} text="TUITION: €0" size={80} bg="#E8FFE2" color={C.greenDark} />
        <Tag t={t} from={T.abroad} to={T.exceptions - 0.1} x={OUT.x} y={268} text="EVEN FOR STUDENTS FROM ABROAD" size={40} bg="#FFF6D6" />
        <Tag t={t} from={T.exceptions} to={T.back - 0.15} x={OUT.x} y={100} text="THE BIG EXCEPTIONS" size={56} bg="#FFF1F0" color={C.redDark} />
        <InfoCard t={t} at={T.bw} to={T.back - 0.15} x={OUT.x - 450} y={340} w={470} title="BADEN-WÜRTTEMBERG" lines={['€1,500 / SEMESTER']} size={44} rotate={-4} />
        <InfoCard t={t} at={T.tum} to={T.back - 0.15} x={OUT.x + 450} y={340} w={420} title="TU MUNICH" lines={['TUITION FEES']} size={44} rotate={4} />
        <Tag t={t} from={T.outside} to={T.back - 0.15} x={OUT.x} y={560} text="FOR STUDENTS FROM OUTSIDE THE EU" size={48} bg="#fff" />
      </Layer>

      <Voice slug={SLUG} file={VO_FILE} offset={VO_OFFSET} />
      <SoundCues slug={SLUG} cues={CUES} T={T} />
    </AbsoluteFill>
  );
};
