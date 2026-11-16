import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  Impact, INK, Layer, OUTLINE, SoundCues, Voice, actionSwap, addShake, blinking, breathe, camPath, clamp, easeOutBack,
  prog, shake, talkShape, useT, whip, type Cue,
} from '../../../lib';
import {C, Clock, InfoCard, Person, Prop, SLUG, StampText, Tag, swapXf, type Pose} from '../../kit';
import words from '../../../../public/2026-11-10-student-day-germany/vo/scene-3.words.json';
import cuesJson from './cues.json';
import {DURATION, GAP_AFTER, T, VO_FILE, VO_OFFSET} from './timing';

const CUES = cuesJson as Cue[];
export const SECONDS = DURATION;

type Seat = {x: number; z: number; pose: Pose; me?: boolean; phase: number};

export const Scene: React.FC = () => {
  const t = useT();
  const end = DURATION + GAP_AFTER;

  // ---- the hall: back wall (blackboard + clock) at z 2200, desk rows at z 1500 / 1250 / 1000 -----------------
  const BACK = 2200;
  const clockW = {x: 1500, y: 150, r: 150};
  const rows = [1500, 1250, 1000];
  const seats: Seat[] = [
    {x: 600, z: 1500, pose: 'idle', phase: 0.2},
    {x: 1000, z: 1500, pose: 'talk_b', phase: 1.1},
    {x: 1400, z: 1500, pose: 'idle', phase: 2.3},
    {x: 760, z: 1250, pose: 'thinking', phase: 0.7},
    {x: 1250, z: 1250, pose: 'idle', phase: 1.9},
    {x: 1180, z: 1000, pose: 'idle', me: true, phase: 0},
    {x: 1640, z: 1000, pose: 'talk_b', phase: 2.8},
  ];
  const DESK_TOP = 1010 - 280; // desks cover everyone below the hips

  // ---- camera: wide hall -> CUT to the clock (rows are behind the camera there) -> wall shot for s.t. -> CUT back
  // to the hall. Cuts land exactly on a frame so no in-between frame flies through the desk rows.
  const onFrame = (x: number) => Math.round(x * 30) / 30;
  const cutIn = onFrame(T.listed - 0.3);
  const cutOut = onFrame(T.ends - 0.2);
  const cam0 = camPath(
    [
      {t: 0, x: 960, y: 480, z: 120},
      {t: cutIn - 1e-4, x: 960, y: 480, z: 120},
      {t: cutIn, x: 1500, y: 160, z: 1600},
      {t: T.academic + 0.6, x: 1500, y: 160, z: 1660},
      {t: T.st - 0.3, x: 1200, y: 350, z: 1300},
      {t: cutOut - 1e-4, x: 1200, y: 350, z: 1300},
      {t: cutOut, x: 960, y: 520, z: 0},
      {t: T.question - 0.6, x: 960, y: 520, z: 0},
      {t: T.question + 0.4, x: 1120, y: 560, z: 330},
      {t: end, x: 1120, y: 560, z: 330},
    ],
    t,
    BACK,
  );
  const cam = addShake(cam0, shake(t, T.knock, 5, 1.4), shake(t, T.dot, 6, 0.3));
  cam.x += whip(t, end, 'out') + whip(t, end, 'in');

  // ---- clock ----------------------------------------------------------------------------------------------
  let minutes = 480;
  if (t >= T.starts) minutes = 480 + 15 * clamp((t - T.starts) / (T.past - T.starts));
  if (t >= T.st + 1.2) minutes = 495 - 15 * easeOutBack(prog(t, T.st + 1.2, T.st + 1.6));
  const slice: [number, number] = [0, Math.max(0, minutes - 480)];

  // ---- knocking -------------------------------------------------------------------------------------------
  const knocking = t > T.knock - 0.05 && t < T.knock + 1.6;
  const beat = knocking ? Math.floor((t - T.knock) / 0.13) % 2 === 0 : false;
  const lecturerPose: Pose = t < T.ends ? (talkShape(t, words.words) ? 'talk_a' : 'talk_b') : t < T.habit ? 'happy' : 'idle';

  const mePose: Pose = knocking ? (beat ? 'knock_down' : 'knock_up') : t < T.nobody ? 'idle' : t < T.question ? 'shrug' : 'thinking';
  const meXf = swapXf(t, [T.nobody, T.question], actionSwap);

  return (
    <AbsoluteFill style={{background: '#E9DCC6'}}>
      {/* back wall: blackboard and the clock */}
      <Layer cam={cam} z={BACK}>
        <div style={{position: 'absolute', left: -2600, top: -1600, width: 7200, height: 2780, background: '#E9DCC6'}} />
        <div style={{position: 'absolute', left: -2600, top: 1180, width: 7200, height: 1200, background: '#B58A5E', borderTop: `${OUTLINE * 2}px solid ${INK}`}} />
        <div style={{position: 'absolute', left: 120, top: 260, width: 2150, height: 760, background: '#2F5B45', border: `${OUTLINE * 2}px solid ${INK}`, borderRadius: 14, boxShadow: 'inset 0 0 0 26px #8E6A45'}} />
        {[[260, 420, 640], [260, 520, 900], [260, 620, 520], [1300, 420, 700], [1300, 540, 520]].map(([x, y, w], i) => (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: w, height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.65)'}} />
        ))}
        <Clock x={clockW.x} y={clockW.y} r={clockW.r} minutes={minutes} slice={minutes > 480.05 ? slice : undefined} />
        <Tag t={t} from={T.past} to={T.st - 0.4} x={clockW.x} y={clockW.y + 225} text="8:15" size={60} bg="#FFE36B" />
        <Tag t={t} from={T.academic} to={T.st - 0.4} x={clockW.x} y={clockW.y - 225} text="THE ACADEMIC QUARTER" size={40} />
        <StampText t={t} at={T.dot} to={T.ends - 0.4} x={clockW.x} y={clockW.y + 240} text="ON THE DOT" size={80} rotate={-6} color={C.greenDark} />
      </Layer>

      {/* rows of desks with students, back to front */}
      {rows.map((z) => (
        <Layer key={z} cam={cam} z={z}>
          {z === 1000 ? <div style={{position: 'absolute', left: -2000, top: 980, width: 6000, height: 800, background: '#A7794F', borderTop: `${OUTLINE}px solid ${INK}`}} /> : null}
          {seats
            .filter((s) => s.z === z)
            .map((s, i) => {
              const pose: Pose = s.me ? mePose : knocking ? ((Math.floor((t - T.knock + s.phase * 0.05) / 0.13) % 2 === 0) ? 'knock_down' : 'knock_up') : s.pose;
              return <Person key={i} pose={pose} x={s.x} y={1010} size={0.26} xf={s.me ? meXf : undefined} backpack={s.me} blink={blinking(t + s.phase, 3.4, s.phase)} breath={breathe(t, s.phase)} shadow={false} />;
            })}
          <Prop name="desk_row" x={1120} y={1012} size={0.57} anchor="bottom" />
          {knocking && beat
            ? seats
                .filter((s) => s.z === z)
                .map((s, i) => <Impact key={i} t={t} at={T.knock + Math.floor((t - T.knock) / 0.26) * 0.26} x={s.x + 70} y={DESK_TOP + 18} size={36} />)
            : null}
          {z === 1000 ? (
            <>
              {/* the lecturer at the lectern, front left */}
              <Person pose={lecturerPose} x={300} y={1010} size={0.27} glasses tie xf={swapXf(t, [T.ends, T.habit], actionSwap)} blink={blinking(t, 3.1, 1.2)} breath={breathe(t, 0.5)} shadow={false} />
              <Prop name="lectern" x={330} y={1060} size={0.21} anchor="bottom" />
            </>
          ) : null}
        </Layer>
      ))}

      {/* labels in screen space (they stay readable while the camera flies past the desks) */}
      <AbsoluteFill>
        <InfoCard t={t} at={0.05} to={T.listed - 0.35} x={520} y={200} w={520} title="LECTURE" lines={[t < T.ct - 0.05 ? '8:00' : '8:00 c.t.']} size={70} header="#7A3FB8" />
        <Tag t={t} from={T.ct} to={T.listed - 0.35} x={520} y={365} text="c.t. = CUM TEMPORE" size={46} bg="#FFF6D6" bounceAt={T.ct + 0.2} />
        <Tag t={t} from={T.withTime} to={T.listed - 0.35} x={520} y={445} text="= “WITH TIME”" size={46} />
        <InfoCard t={t} at={T.st - 0.2} to={T.ends - 0.4} x={560} y={330} w={460} title="LECTURE" lines={['8:00 s.t.']} size={64} header="#7A3FB8" rotate={3} />
        <Tag t={t} from={T.st + 0.5} to={T.ends - 0.4} x={560} y={505} text="s.t. = SINE TEMPORE" size={40} bg="#FFF6D6" />
        <Tag t={t} from={T.claps} to={T.knock - 0.05} x={960} y={120} text="NO CLAPPING" size={64} bg="#FFF1F0" color={C.redDark} />
        <Tag t={t} from={T.knock} to={T.habit} x={960} y={120} text="KNOCK KNOCK" size={72} bg="#FFE36B" bounceAt={T.knock + 0.4} />
        {[[640, 300], [1060, 270], [1440, 310]].map(([x, y], i) => (
          <Tag key={i} t={t} from={T.nobody + i * 0.12} to={T.question - 0.3} x={x} y={y} text="?" size={70} bg="#FFF6D6" />
        ))}
        <Tag t={t} from={T.lunch} x={1330} y={260} text="LUNCH?" size={66} bg="#FFF6D6" />
      </AbsoluteFill>

      <Voice slug={SLUG} file={VO_FILE} offset={VO_OFFSET} />
      <SoundCues slug={SLUG} cues={CUES} T={T} />
    </AbsoluteFill>
  );
};

