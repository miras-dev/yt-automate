import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  DEPTH, Eyes, Layer, Mouth, SoundCues, Voice, actionSwap, addShake, blinking, breathe, camPath, easeOutCubic, eyesPop, prog, shake,
  useT, whip, type Cue,
} from '../../../lib';
import {C, Clock, Lamp, Lock, MoneyCounter, Person, Pie, PriceTag, Prop, SLUG, StampText, Tag, Zzz, landSquash, pop, swapXf, type Pose} from '../../kit';
import {LyingInBed, ROOM, RoomSet} from '../zero-euros/Scene';
import cuesJson from './cues.json';
import {DURATION, T, VO_FILE, VO_OFFSET} from './timing';

const CUES = cuesJson as Cue[];
export const SECONDS = DURATION;

export const Scene: React.FC = () => {
  const t = useT();
  const R = ROOM;

  // same framing as frame 0 of the film, so the last frame loops to the first
  const cam0 = camPath(
    [
      {t: 0, x: 980, y: 580, z: 170},
      {t: T.monthly - 0.5, x: 980, y: 580, z: 170},
      {t: T.monthly + 0.3, x: 1120, y: 520, z: 150},
      {t: T.day - 0.4, x: 1120, y: 520, z: 150},
      {t: T.day + 0.6, x: 1050, y: 590, z: 150},
      {t: DURATION, x: 1050, y: 590, z: 150},
    ],
    t,
  );
  const cam = addShake(cam0, shake(t, T.show, 10, 0.4), shake(t, T.eat + 0.15, 6, 0.3));
  cam.x += whip(t, DURATION, 'in');

  // ---- the student: on the floor with the laptop, then into bed ---------------------------------------------
  const sitX = 520;
  const inBed = t >= T.day + 0.4;
  const hop = prog(t, T.day, T.day + 0.4);
  const pose: Pose = t < T.day ? 'laptop_sit' : 'happy';
  const lampOn = t < T.rule;
  const dim = easeOutCubic(prog(t, T.rule, T.rule + 0.3));

  // ---- safe, pie, the bed's bite --------------------------------------------------------------------------
  const safe = {x: 1150, y: R.floor};
  const safeF = prog(t, T.show - 0.35, T.show);
  const safeY = safe.y - 900 * (1 - safeF * safeF);
  const [ssx, ssy] = landSquash(t, T.show, 0.12);
  const pie = {x: 1400, y: 330, r: 150};
  const pieK = pop(t, T.monthly, T.day - 0.3, 0.2);
  const bite = prog(t, T.eat, T.eat + 0.35);
  const bedEyes = eyesPop(t, T.eat - 0.5) * (t < T.day - 0.2 ? 1 : 0);
  const chomp = t > T.eat - 0.2 && t < T.eat + 0.5 ? Math.abs(Math.sin((t - T.eat + 0.2) * 14)) : 0;

  return (
    <AbsoluteFill style={{background: '#5B5F86'}}>
      <Layer cam={cam} z={DEPTH.character}>
        <RoomSet t={t} night dim={dim} />
        {/* the alarm clock (set for tomorrow) and the desk lamp on the nightstand */}
        <Prop name="alarm_clock" x={R.clock.x - 40} y={R.clock.y} size={R.clock.size} />
        <Clock x={R.clock.face.x - 40} y={R.clock.face.y} r={R.clock.face.r} minutes={23 * 60} />
        <Lamp x={R.stand.x + 50} y={R.stand.top} s={0.9} on={lampOn} />

        {/* the bed wakes up and bites the rent slice */}
        {bedEyes > 0.01 ? (
          <>
            <Eyes x={1500} y={655} r={20} gap={22} outline={5} open={bedEyes} brows tilt={10} look={{x: 0, y: -1}} />
            <Mouth x={1500} y={700} width={70} outline={5} open={chomp} smile={0.5} />
          </>
        ) : null}

        {inBed ? <LyingInBed t={t} asleep={t > T.rule} /> : null}
        {!inBed ? (
          <Person
            pose={pose}
            x={sitX + (1250 - sitX) * hop}
            y={R.floor + (700 - R.floor) * hop - 260 * Math.sin(Math.PI * hop)}
            size={0.26}
            blink={blinking(t, 3.0, 0.5)}
            breath={breathe(t)}
            xf={swapXf(t, [T.day], actionSwap)}
          />
        ) : null}
        <Zzz t={t} x={1200} y={555} size={72} on={t > T.rule + 0.4} />

        {/* visa money */}
        <Prop name="passport" x={780} y={280} size={0.09 * pop(t, T.eu, T.show - 0.2)} rotate={-10} />
        <Tag t={t} from={T.eu + 0.15} to={T.show - 0.2} x={780} y={430} text="STUDENT VISA" size={40} bg="#FFF6D6" />
        {t > T.show - 0.35 && t < T.monthly - 0.2 ? <Prop name="safe" x={safe.x} y={safeY} size={0.12} sx={ssx} sy={ssy} anchor="bottom" /> : null}
        <MoneyCounter t={t} t0={T.amount} t1={T.amount + 0.8} to={T.monthly - 0.2} x={safe.x} y={470} value={11904} suffix=" FOR ONE YEAR" size={52} />
        <Lock x={safe.x + 120} y={R.floor - 210} s={46} k={pop(t, T.blocked, T.monthly - 0.2)} />
        <Tag t={t} from={T.blocked + 0.1} to={T.monthly - 0.2} x={safe.x} y={575} text="BLOCKED ACCOUNT" size={40} />

        {/* 992 a month, and the bed eats more than half */}
        <Pie x={pie.x} y={pie.y} r={pie.r} frac={512 / 992} k={pieK} bite={bite} />
        <Tag t={t} from={T.monthly + 0.1} to={T.day - 0.3} x={pie.x} y={pie.y - pie.r - 70} text="€992 A MONTH" size={56} bg="#E8FFE2" color={C.greenDark} />
        <Tag t={t} from={T.wg} to={T.eat} x={pie.x + 335} y={pie.y - 40} text="WG ROOM €512" size={40} bg="#FFF1F0" color={C.redDark} />
        <Tag t={t} from={T.half} to={T.day - 0.3} x={pie.x} y={pie.y + pie.r + 70} text="MORE THAN HALF" size={46} bg="#FFF1F0" color={C.redDark} />
        <Tag t={t} from={T.tuition} to={T.day - 0.3} x={760} y={200} text="TUITION: €0 (NOT EVEN IN THERE)" size={44} bg="#fff" />

        {/* the rule */}
        <StampText t={t} at={T.free} x={700} y={250} text="STUDYING: FREE" size={70} rotate={-6} color={C.greenDark} />
        <StampText t={t} at={T.isnt} x={1300} y={335} text="SLEEPING: €512 / MONTH" size={62} rotate={5} color={C.red} />
        {/* a shop price tag hanging off the bed rail */}
        <PriceTag t={t} at={T.isnt} x={1500} y={900} text="€512" w={230} />
      </Layer>

      <Voice slug={SLUG} file={VO_FILE} offset={VO_OFFSET} />
      <SoundCues slug={SLUG} cues={CUES} T={T} />
    </AbsoluteFill>
  );
};
