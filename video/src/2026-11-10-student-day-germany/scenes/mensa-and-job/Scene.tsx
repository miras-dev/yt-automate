import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  DEPTH, INK, Layer, OUTLINE, SoundCues, Voice, actionSwap, addShake, blinking, breathe, camPath, easeInOutCubic, easeOutCubic, prog,
  shake, useT, whip, type Cue,
} from '../../../lib';
import {C, CoinBurst, MoneyCounter, Person, PriceTag, Prop, SLUG, Sparkle, Tag, WeekBars, YearGrid, swapXf, type Pose} from '../../kit';
import cuesJson from './cues.json';
import {DURATION, GAP_AFTER, T, VO_FILE, VO_OFFSET} from './timing';

const CUES = cuesJson as Cue[];
export const SECONDS = DURATION;
const fast = (x: number) => easeInOutCubic(x);

export const Scene: React.FC = () => {
  const t = useT();
  const end = DURATION + GAP_AFTER;
  const F = 980; // floor
  const JOB = 2600; // x offset of the job set

  const cam0 = camPath(
    [
      {t: 0, x: 900, y: 560, z: 120},
      {t: T.job - 0.3, x: 900, y: 560, z: 120},
      {t: T.job + 0.3, x: JOB + 640, y: 540, z: 40, ease: fast},
      {t: end, x: JOB + 640, y: 540, z: 60},
    ],
    t,
  );
  const cam = addShake(cam0, shake(t, T.four, 4, 0.25));
  cam.x += whip(t, end, 'out') + whip(t, end, 'in');

  const trayPose: Pose = 'tray_hold';
  const weekFill = easeOutCubic(prog(t, T.twenty - 0.1, T.week + 0.1));
  const days = Math.round(140 * easeOutCubic(prog(t, T.days140, T.days140 + 1.3)));
  const jobPose: Pose = t < T.money ? 'laptop_sit' : 'shrug';
  const jobXf = swapXf(t, [T.money], actionSwap);

  return (
    <AbsoluteFill style={{background: '#F1E6D2'}}>
      <Layer cam={cam} z={DEPTH.character}>
        {/* ---------- the Mensa ---------- */}
        <div style={{position: 'absolute', left: -1500, top: -900, width: 3900, height: 900 + F, background: 'repeating-linear-gradient(90deg, #F6EEDD 0 96px, #E6DAC3 96px 101px)'}} />
        <div style={{position: 'absolute', left: -1500, top: F, width: 3900, height: 900, background: '#B9B2A4', borderTop: `${OUTLINE}px solid ${INK}`}} />
        <div style={{position: 'absolute', left: -1500, top: F + 80, width: 3900, height: 900, background: '#ADA697'}} />
        <Prop name="mensa_counter" x={1180} y={905} size={0.62} anchor="bottom" />
        <Person pose={trayPose} x={520} y={F} size={0.28} backpack blink={blinking(t, 3.2, 0.3)} breath={breathe(t)} />
        <Tag t={t} from={T.mensa} to={T.job - 0.2} x={1180} y={150} text="MENSA" size={80} bg="#FFF6D6" />
        <Tag t={t} from={T.stw} to={T.job - 0.2} x={1180} y={255} text="RUN BY THE STUDIERENDENWERK" size={44} />
        <PriceTag t={t} at={T.four} to={T.job - 0.2} x={700} y={560} text="< €4" w={260} />
        <MoneyCounter t={t} t0={T.price - 0.6} t1={T.price} to={T.job - 0.2} x={1260} y={380} value={2.9} decimals={2} prefix="HEIDELBERG Ø " size={50} />
        <Sparkle t={t} at={T.price} x={1580} y={340} size={36} />

        {/* ---------- the part-time job ---------- */}
        <div style={{position: 'absolute', left: JOB - 400, top: -900, width: 3200, height: 900 + F, background: '#DCE9F2'}} />
        <div style={{position: 'absolute', left: JOB - 200, top: 160, width: 760, height: 420, background: 'linear-gradient(#9fd8ff, #e3f5ff)', border: `${OUTLINE}px solid ${INK}`, borderRadius: 10}} />
        <div style={{position: 'absolute', left: JOB + 170, top: 160, width: 14, height: 420, background: INK}} />
        <div style={{position: 'absolute', left: JOB - 400, top: F, width: 3200, height: 900, background: '#8E9AA6', borderTop: `${OUTLINE}px solid ${INK}`}} />
        {/* a beanbag to sit on */}
        <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <path d={`M ${JOB + 20} ${F + 6} C ${JOB - 10} ${F - 120} ${JOB + 80} ${F - 230} ${JOB + 210} ${F - 220} C ${JOB + 360} ${F - 210} ${JOB + 420} ${F - 110} ${JOB + 400} ${F + 6} Z`} fill="#E07B16" stroke={INK} strokeWidth={OUTLINE} strokeLinejoin="round" />
        </svg>
        <Person pose={jobPose} x={JOB + 210} y={F - 60} size={0.26} xf={jobXf} blink={blinking(t, 3.0, 1.0)} breath={breathe(t)} shadow={false} />
        <Tag t={t} from={T.partTime} to={T.outside - 0.3} x={JOB + 640} y={110} text="PART-TIME JOB" size={64} bg="#FFF6D6" />
        <WeekBars t={t} at={T.semester} to={T.outside - 0.3} x={JOB + 1000} y={330} fill={weekFill} cell={78} />
        <Tag t={t} from={T.twenty + 0.2} to={T.outside - 0.3} x={JOB + 1000} y={500} text="UP TO 20 H A WEEK" size={46} bg="#E8FFE2" color={C.greenDark} />
        <MoneyCounter t={t} t0={T.wage - 0.5} t1={T.wage + 0.2} to={T.outside - 0.3} x={JOB + 1000} y={640} value={13.9} decimals={2} suffix=" / HOUR" size={58} />
        <CoinBurst t={t} at={T.hour - 0.3} x={JOB + 1000} y={640} count={9} seed="wage" />
        <YearGrid t={t} at={T.outside} to={T.money - 0.2} x={JOB + 1000} y={390} n={days} cell={24} />
        <Tag t={t} from={T.days140} to={T.money - 0.2} x={JOB + 1000} y={740} text="140 FULL DAYS A YEAR" size={48} bg="#E8FFE2" color={C.greenDark} sub="STUDENTS FROM OUTSIDE THE EU" />
        <CoinBurst t={t} at={T.money - 0.3} x={JOB + 260} y={650} count={10} seed="away" spread={[40, 80]} speed={[900, 1500]} gravity={900} />
        <Tag t={t} from={T.money} x={JOB + 230} y={420} text="?" size={90} bg="#FFF6D6" />
      </Layer>

      <Voice slug={SLUG} file={VO_FILE} offset={VO_OFFSET} />
      <SoundCues slug={SLUG} cues={CUES} T={T} />
    </AbsoluteFill>
  );
};
