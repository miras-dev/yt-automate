import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {
  DEPTH, Eyes, GroundBand, INK, Layer, OUTLINE, Sky, SoundCues, SweatDrop, Voice, actionSwap, addShake, blinking, breathe,
  camPath, easeInOutCubic, easeOutBack, easeOutCubic, eyesPop, prog, shake, spring, useT, whip, type Cue, type PoseXf,
} from '../../../lib';
import {
  C, Calendar, Dust, ExamPaper, LicenseCard, Mini, Person, Prop, SLUG, StampText, Stairs, Tag, fallY, fmtMoney, landSquash, swapXf,
  type Pose,
} from '../../kit';
import cuesJson from './cues.json';
import {DURATION, GAP_AFTER, T, VO_FILE, VO_OFFSET} from './timing';

const CUES = cuesJson as Cue[];
export const SECONDS = DURATION;

const fast = (x: number) => easeInOutCubic(x);

export const Scene: React.FC = () => {
  const t = useT();
  const end = DURATION + GAP_AFTER;
  const G = 1480;

  // ---- places ---------------------------------------------------------------------------------------------
  const DESK_CAM = {x: 4420, y: 1000, z: 150};
  const ENG_DESK = {x: 4200, y: G};
  const SHEET = {x: 4700, y: 1080};
  const STAIRS_X = 5320;
  const STEP_W = 230;
  const STEP_H = 150;
  const STAIRS_CAM = {x: 5700, y: 990, z: -150};
  const footAt = (n: number) => (n === 0 ? {x: STAIRS_X - 110, y: G} : {x: STAIRS_X + (n - 0.5) * STEP_W, y: G - n * STEP_H});

  // ---- camera ---------------------------------------------------------------------------------------------
  const cam0 = camPath(
    [
      {t: 0, x: 540, y: 1000, z: 150},
      {t: T.small - 0.3, x: 540, y: 1000, z: 150},
      {t: T.group + 0.4, x: 540, y: 1700, z: -3000, ease: easeOutCubic},
      {t: T.licensed - 0.75, x: 540, y: 1700, z: -3000},
      {t: T.licensed - 0.35, ...DESK_CAM, ease: fast},
      {t: T.license - 0.45, ...DESK_CAM},
      {t: T.license + 0.4, ...STAIRS_CAM},
      {t: end, ...STAIRS_CAM},
    ],
    t,
  );
  const cam = addShake(cam0, shake(t, T.fit, 40, 0.5), shake(t, T.seal, 12, 0.4));
  cam.x += whip(t, end, 'out') + whip(t, end, 'in');

  // ---- shot A: alone in a field, the crowd, the stadium ----------------------------------------------------
  const stad = {x: 540, y: 3300, size: 1.25};
  const minis = React.useMemo(() => {
    const out: {x: number; y: number; d: number; tx: number; ty: number; i: number}[] = [];
    let i = 0;
    for (let row = 0; row < 13; row++) {
      for (let col = 0; col < 24; col++) {
        const x = -1250 + col * 160 + (row % 2) * 80 + (random(`mx${i}`) - 0.5) * 60;
        const y = 1640 + row * 230 + (random(`my${i}`) - 0.5) * 70;
        const a = random(`ma${i}`) * Math.PI * 2;
        const rr = 0.72 + 0.25 * random(`mr${i}`);
        out.push({x, y, d: Math.hypot(x - 540, (y - 1480) * 1.4), tx: stad.x + Math.cos(a) * 1080 * rr, ty: stad.y - 120 + Math.sin(a) * 640 * rr, i});
        i++;
      }
    }
    return out;
  }, []);
  const flyP = (i: number) => easeInOutCubic(prog(t, T.fit + 0.05 + (i % 17) * 0.03, T.fit + 0.75 + (i % 17) * 0.03));
  const stadF = fallY(t, T.fit, stad.y + 1923 * stad.size * 0.5, 7600, 13000); // starts above the top edge of the wide shot
  const [ssx, ssy] = landSquash(t, T.fit, 0.08);
  const alonePose: Pose = t < T.small ? 'talk_a' : 'shrug';
  const aloneXf = swapXf(t, [T.small], actionSwap);
  const hop = prog(t, T.fit + 0.35, T.fit + 1.0);

  // ---- shot B: the desk, the license, the stamp -----------------------------------------------------------
  const stampBase = 1189 * 0.15; // sprite centre -> bottom of the rubber base at size 0.15
  const hoverY = SHEET.y - stampBase - 250;
  const downY = SHEET.y + 30 - stampBase;
  let stampY: number;
  if (t < T.sign) stampY = hoverY - 700 * (1 - easeOutCubic(prog(t, T.licensed + 0.5, T.sign)));
  else if (t < T.seal - 0.1) stampY = hoverY - 90 * easeOutCubic(prog(t, T.sign, T.seal - 0.1));
  else if (t < T.seal) stampY = hoverY - 90 + (downY - hoverY + 90) * Math.pow(prog(t, T.seal - 0.1, T.seal), 2);
  else if (t < T.seal + 0.35) stampY = downY;
  else stampY = downY - 330 * easeOutCubic(prog(t, T.seal + 0.35, T.seal + 0.75));
  const stampSquash = t >= T.seal && t < T.seal + 0.35 ? 1 - 0.1 * spring(t - T.seal, 5, 8) : 1;
  const stampOn = t > T.licensed + 0.5 && t < T.license;

  // ---- shot C: the stairs ---------------------------------------------------------------------------------
  const stepsAt = [T.degree + 0.44, T.exams + 0.6, T.work + 0.92, T.licensedEng + 0.36];
  const leapP = prog(t, T.license - 0.5, T.license + 0.15);
  let ex = ENG_DESK.x;
  let ey = ENG_DESK.y;
  let size = 0.32;
  if (leapP > 0) {
    const a = ENG_DESK;
    const b = footAt(0);
    ex = a.x + (b.x - a.x) * leapP;
    ey = a.y - 560 * Math.sin(Math.PI * leapP);
    size = 0.32 - 0.08 * leapP;
    for (let i = 0; i < stepsAt.length; i++) {
      const p = prog(t, stepsAt[i] - 0.36, stepsAt[i]);
      if (p <= 0) break;
      const from = footAt(i);
      const to = footAt(i + 1);
      ex = from.x + (to.x - from.x) * p;
      ey = from.y + (to.y - from.y) * p - 160 * Math.sin(Math.PI * p);
    }
  }
  const jumping = (leapP > 0 && leapP < 1) || stepsAt.some((s) => t > s - 0.36 && t < s);
  let pose: Pose;
  let xf: PoseXf;
  if (t < T.license - 0.5) {
    pose = t < T.seal + 0.1 ? 'point_right' : 'happy';
    xf = swapXf(t, [T.seal + 0.1], actionSwap);
  } else {
    pose = jumping || (t > T.licensedEng + 0.36 && t < T.what) ? 'happy' : t >= T.what ? 'thinking' : 'talk_b';
    xf = swapXf(t, [T.licensedEng + 0.36, T.what], actionSwap);
    const landing = [T.license + 0.15, ...stepsAt].find((s) => t >= s && t < s + 0.6);
    if (landing !== undefined && !jumping) {
      const [lx, ly] = landSquash(t, landing, 0.1);
      xf = {...xf, scaleX: xf.scaleX * lx, scaleY: xf.scaleY * ly};
    }
  }

  const col = (n: number) => ({x: STAIRS_X + (n - 0.5) * STEP_W, top: G - n * STEP_H});
  const stairsK = easeOutBack(prog(t, T.license - 0.35, T.license + 0.15));

  return (
    <AbsoluteFill>
      <Sky top="#8FD3FF" bottom="#E6F7FF" />
      <Layer cam={cam} z={DEPTH.far}>
        <GroundBand top={1900} color="#9ED07A" horizon />
      </Layer>
      <Layer cam={cam} z={DEPTH.character}>
        <GroundBand top={G + 40} color="#8CC264" />

        {/* ------- shot A: one engineer, then all 39,100, then a stadium ------- */}
        {stadF.on ? <Prop name="stadium" x={stad.x} y={stadF.y} size={stad.size} anchor="bottom" sx={ssx} sy={ssy} /> : null}
        <Dust t={t} at={T.fit} x={stad.x} y={stad.y + 1100} spread={2600} size={260} />
        <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {minis.map((m) => {
            const at = T.num + 0.05 + 1.7 * (m.d / 3200);
            const k = easeOutBack(prog(t, at, at + 0.2));
            if (k <= 0.001) return null;
            const p = flyP(m.i);
            const x = m.x + (m.tx - m.x) * p;
            const y = m.y + (m.ty - m.y) * p - 260 * Math.sin(Math.PI * p);
            return <Mini key={m.i} x={x} y={y} r={58 * (1 - 0.35 * p)} k={k} />;
          })}
        </svg>
        {hop < 1 && t < T.licensed ? (
          <Person pose={alonePose} x={540} y={G - 1300 * Math.sin(Math.PI * hop) + (2700 - G) * hop} size={0.32 * (1 - 0.7 * hop)} xf={aloneXf} hat blink={blinking(t, 3.1)} breath={breathe(t)} shadow={hop === 0} />
        ) : null}
        <SweatDrop t={t} at={T.small + 0.5} x={640} y={G - 760} size={30} />
        <Tag t={t} from={T.num - 0.1} to={T.stadium - 0.5} x={540} y={-520} text={`${fmtMoney(39100 * easeOutCubic(prog(t, T.num, T.num + 0.8))).slice(1)} ENVIRONMENTAL ENGINEERS`} size={200} sub="IN THE WHOLE U.S. (2025)" minChars={30} />
        <Tag t={t} from={T.stadium - 0.4} to={T.licensed - 0.8} x={540} y={-520} text="ONE BIG BALLPARK: 56,000 SEATS" size={196} bg="#FFE36B" />

        {/* ------- shot B: only a licensed engineer may sign and seal the plans ------- */}
        <div style={{position: 'absolute', left: 4080, top: 1250, width: 940, height: 60, background: '#B07A45', border: `${OUTLINE}px solid ${INK}`, borderRadius: 10}} />
        <div style={{position: 'absolute', left: 4120, top: 1300, width: 46, height: 200, background: '#8E5F33', border: `${OUTLINE}px solid ${INK}`}} />
        <div style={{position: 'absolute', left: 4930, top: 1300, width: 46, height: 200, background: '#8E5F33', border: `${OUTLINE}px solid ${INK}`}} />
        <Prop name="blueprint" x={SHEET.x} y={SHEET.y} size={0.2} />
        <StampText t={t} at={T.seal} to={T.license} x={SHEET.x + 6} y={SHEET.y + 30} text="P.E. APPROVED" size={40} rotate={-10} />
        <LicenseCard t={t} at={T.licensed} to={T.license - 0.55} x={ENG_DESK.x + 30} y={490} w={330} title={t > T.professional - 0.05 ? 'PROFESSIONAL ENGINEER' : 'LICENSE'} />

        {/* ------- shot C: the stairs to a license ------- */}
        <Stairs x={STAIRS_X} y={G + 6} n={4} w={STEP_W} h={STEP_H} k={stairsK} />
        {stairsK > 0.5 ? (
          <>
            <Prop name="grad_cap" x={col(1).x} y={col(1).top + 70} size={0.055 * easeOutBack(prog(t, T.degree - 0.05, T.degree + 0.2))} />
            <ExamPaper t={t} at={T.exams} x={col(2).x - 30} y={col(2).top + 85} w={64} rotate={-8} />
            <ExamPaper t={t} at={T.exams + 0.3} x={col(2).x + 30} y={col(2).top + 90} w={64} rotate={7} />
            <Calendar t={t} at={T.work} x={col(3).x} y={col(3).top + 95} w={88} n0={1} n1={4} t1={T.work + 0.9} label="YEARS" />
            <LicenseCard t={t} at={T.licensedEng} x={col(4).x} y={col(4).top + 120} w={150} rotate={5} />
          </>
        ) : null}
        <Tag t={t} from={T.degree} x={col(1).x - 30} y={G + 95} text="4-YEAR DEGREE" size={40} bg="#FFF6D6" />
        <Tag t={t} from={T.exams} x={col(2).x + 10} y={G + 185} text="2 TOUGH EXAMS" size={40} bg="#FFF6D6" />
        <Tag t={t} from={T.work} x={col(3).x + 30} y={G + 95} text="4+ YEARS OF WORK" size={40} bg="#FFF6D6" />
        <Tag t={t} from={T.licensedEng + 0.2} x={col(4).x - 10} y={G + 185} text="LICENSED P.E." size={40} bg="#E8FFE2" color={C.greenDark} />
        <Tag t={t} from={T.paying} x={col(4).x - 250} y={430} text="?" size={110} bg="#FFF6D6" />

        {/* the engineer: at the desk, then the leap and the climb (drawn after the stairs so it stands on them) */}
        <Person pose={pose} x={ex} y={ey} size={size} xf={xf} hat blink={blinking(t, 3.3, 1.1) && !jumping} breath={breathe(t)} shadow={!jumping && t > T.license} lean={jumping ? -6 : 0} />
        {/* the desk front hides the engineer's legs at the desk */}
        {t < T.license - 0.3 ? <div style={{position: 'absolute', left: 4080, top: 1310, width: 940, height: 190, background: '#9B6A3C', border: `${OUTLINE}px solid ${INK}`}} /> : null}
        {stampOn ? (
          <>
            <Prop name="rubber_stamp" x={SHEET.x} y={stampY} size={0.15} sx={1 / Math.sqrt(stampSquash)} sy={stampSquash} />
            <Eyes x={SHEET.x} y={stampY - 60} r={19} gap={17} open={eyesPop(t, T.sign - 0.2)} lid={t > T.seal + 0.3 ? 0.45 : 0} look={{x: -0.5, y: 0.6}} />
          </>
        ) : null}
      </Layer>

      <Voice slug={SLUG} file={VO_FILE} offset={VO_OFFSET} />
      <SoundCues slug={SLUG} cues={CUES} T={T} />
    </AbsoluteFill>
  );
};
