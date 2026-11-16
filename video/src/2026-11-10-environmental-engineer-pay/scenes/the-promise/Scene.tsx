import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  Burst, DEPTH, Eyes, GroundBand, INK, Layer, Mouth, OUTLINE, Sky, SoundCues, Voice, actionSwap, addShake, blinking, breathe,
  camPath, easeInCubic, easeOutBack, easeOutCubic, eyesPop, prog, shake, talkShape, useT, whip, type Cue, type PoseXf,
} from '../../../lib';
import {C, Checklist, Microbe, Person, PriceTag, Prop, SLUG, Sparkle, StampText, Stream, Tag, headOf, swapXf, type Pose} from '../../kit';
import words from '../../../../public/2026-11-10-environmental-engineer-pay/vo/scene-5.words.json';
import cuesJson from './cues.json';
import {DURATION, T, VO_FILE, VO_OFFSET} from './timing';

const CUES = cuesJson as Cue[];
export const SECONDS = DURATION;

export const Scene: React.FC = () => {
  const t = useT();
  const G = 1480;
  const eng = {x: 430, y: G};
  const head = headOf('talk_a', eng.x, eng.y, 0.32);

  // ---- camera ---------------------------------------------------------------------------------------------
  const cam0 = camPath(
    [
      {t: 0, x: 430, y: 820, z: 180},
      {t: T.certainty + 0.5, x: 430, y: 820, z: 210},
      {t: T.required - 0.5, x: 700, y: 960, z: 60},
      {t: T.end - 0.3, x: 700, y: 960, z: 60},
      {t: T.end + 0.6, x: 560, y: 990, z: 120},
      {t: T.tap - 0.25, x: 560, y: 990, z: 120},
      {t: T.hurt - 0.05, x: 600, y: 960, z: 320},
      {t: DURATION, x: 600, y: 960, z: 340},
    ],
    t,
  );
  const cam = addShake(cam0, shake(t, T.certainty, 9, 0.35), shake(t, T.required2, 8, 0.3), shake(t, T.urgent, 8, 0.3), shake(t, T.rare, 8, 0.3));
  cam.x += whip(t, DURATION, 'in');

  // ---- engineer -------------------------------------------------------------------------------------------
  const talking = t < T.mostly - 0.1;
  let pose: Pose;
  if (talking) pose = talkShape(t, words.words) ? 'talk_a' : 'talk_b';
  else if (t < T.required - 0.4) pose = 'happy';
  else if (t < T.expensive) pose = 'point_right';
  else if (t < T.promise) pose = 'happy';
  else pose = 'hold_glass';
  const xf: PoseXf = swapXf(t, [T.mostly - 0.1, T.required - 0.4, T.expensive, T.promise], actionSwap);

  // ---- skills orbit the head ------------------------------------------------------------------------------
  const orbit = (base: number, at: number) => {
    const a = ((base + 12 * (t - at)) * Math.PI) / 180;
    const out = easeInCubic(prog(t, T.mostly, T.mostly + 0.45));
    const r = 1 + 3 * out;
    const k = (t < at ? 0 : easeOutBack(prog(t, at, at + 0.25))) * (1 - out);
    return {x: head.x + Math.cos(a) * 300 * r, y: head.y - 60 + Math.sin(a) * 235 * r, k};
  };
  const flask = orbit(-172, T.chemistry);
  const microbe = orbit(-95, T.biology);
  const lawb = orbit(-18, T.law);

  // ---- the tap and the glass ------------------------------------------------------------------------------
  const k = 0.99878 * 0.32; // hold_glass sprite scale x size
  const glassTop = {x: eng.x + (1210 - 581) * k, y: eng.y + (905 - 2392) * k};
  const FS = 0.22;
  const faucet = {x: glassTop.x + (1474 - 796.5) * FS, y: glassTop.y - 170 + (1200 - 974) * FS};
  const pipeX = faucet.x + (796.5 - 203.5) * FS; // the faucet base (mirrored) sits on the standpipe
  const tapIn = easeOutBack(prog(t, T.end + 0.2, T.end + 0.6));
  const pouring = t > T.tap - 0.15 && t < T.tap + 0.75;
  const pourK = easeOutCubic(prog(t, T.tap - 0.15, T.tap)) * (1 - prog(t, T.tap + 0.55, T.tap + 0.75));
  const smile = eyesPop(t, T.hurt - 0.05);

  return (
    <AbsoluteFill>
      <Sky top="#7FCBFF" bottom="#E8F8FF" />
      <Layer cam={cam} z={DEPTH.far}>
        <GroundBand top={1700} color="#A8DB7C" horizon />
      </Layer>
      <Layer cam={cam} z={DEPTH.mid}>
        <GroundBand top={1530} color="#99D06E" />
      </Layer>
      <Layer cam={cam} z={DEPTH.character}>
        <GroundBand top={G + 45} color="#86C35C" />

        {/* the outdoor tap on its standpipe (comes up at the end) */}
        {tapIn > 0.01 ? (
          <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: `${faucet.x + 40}px ${G}px`, transform: `scale(1, ${tapIn})`}}>
            <div style={{position: 'absolute', left: pipeX - 34, top: faucet.y + 1200 * FS - 30, width: 68, height: G - faucet.y - 1200 * FS + 40, background: '#9AA5AE', border: `${OUTLINE}px solid ${INK}`, borderBottom: 'none'}} />
            <Prop name="faucet" x={faucet.x} y={faucet.y} size={FS} flip />
          </div>
        ) : null}
        {pouring ? <Stream t={t} d={`M ${glassTop.x} ${glassTop.y - 170 + 4} L ${glassTop.x} ${glassTop.y + 12}`} width={20 * pourK} colors={{edge: C.waterEdge, main: C.water, core: C.waterCore}} speed={2.5} /> : null}

        <Person pose={pose} x={eng.x} y={eng.y} size={0.32} xf={xf} hat blink={blinking(t, 3.4, 0.2) && pose !== 'happy'} breath={breathe(t)} />
        {/* the water in the glass smiles */}
        {pose === 'hold_glass' && smile > 0.01 ? (
          <>
            <Eyes x={glassTop.x} y={glassTop.y + 36} r={11} gap={10} outline={3} open={smile} />
            <Mouth x={glassTop.x} y={glassTop.y + 64} width={28} outline={3} smile={0.8} />
          </>
        ) : null}
        <Sparkle t={t} at={T.you} x={glassTop.x + 60} y={glassTop.y - 30} size={34} />
        <Sparkle t={t} at={T.you + 0.18} x={glassTop.x - 55} y={glassTop.y + 10} size={26} />

        {/* skills */}
        <Tag t={t} from={T.skills} to={T.mostly} x={head.x} y={head.y - 560} text="SKILLS" size={54} bg="#FFF6D6" />
        <Prop name="flask" x={flask.x} y={flask.y} size={0.1} sx={flask.k} sy={flask.k} rotate={10 * Math.sin(t * 2)} />
        <Microbe x={microbe.x} y={microbe.y} r={52} t={t} k={microbe.k} />
        <Prop name="law_book" x={lawb.x} y={lawb.y} size={0.11} sx={lawb.k} sy={lawb.k} rotate={-8} />
        <Tag t={t} from={T.chemistry + 0.1} to={T.mostly} x={flask.x} y={flask.y + 150} text="CHEMISTRY" size={30} />
        <Tag t={t} from={T.biology + 0.1} to={T.mostly} x={microbe.x} y={microbe.y - 110} text="BIOLOGY" size={30} />
        <Tag t={t} from={T.law + 0.3} to={T.mostly} x={lawb.x} y={lawb.y + 160} text="LAW" size={30} />
        <StampText t={t} at={T.certainty} to={T.required - 0.55} x={head.x + 20} y={head.y - 440} text="CERTAINTY" size={78} rotate={-6} />

        {/* the three reasons */}
        <Checklist
          t={t}
          at={T.required - 0.45}
          to={T.required2 - 0.6}
          x={845}
          y={830}
          w={560}
          font={42}
          rows={[
            {text: 'REQUIRED BY LAW', at: T.required + 0.5},
            {text: 'PROBLEMS GROWING', at: T.growing},
            {text: 'ONLY LICENSED CAN SIGN', at: T.signOff},
          ]}
        />
        <StampText t={t} at={T.required2} to={T.end - 0.2} x={850} y={600} text="REQUIRED" size={72} rotate={-9} />
        <StampText t={t} at={T.urgent} to={T.end - 0.2} x={870} y={820} text="URGENT" size={72} rotate={5} color="#E07B16" />
        <StampText t={t} at={T.rare} to={T.end - 0.2} x={900} y={1040} text="RARE" size={72} rotate={-4} color="#7A3FB8" />
        <PriceTag t={t} at={T.expensive} to={T.end - 0.2} x={760} y={1150} text="$$$" w={260} />
        <Burst t={t} at={T.expensive + 0.05} x={900} y={1240} count={18} speed={[600, 1400]} spread={[-80, 80]} size={[12, 22]} color="#D9A21B" core="#FFE27A" gravity={2400} seed="coins5" />

        <Tag t={t} from={T.hurt} x={510} y={600} text="SAFE TO DRINK" size={44} bg="#E9F6FF" color={C.waterEdge} />
      </Layer>

      <Voice slug={SLUG} file={VO_FILE} offset={VO_OFFSET} />
      <SoundCues slug={SLUG} cues={CUES} T={T} />
    </AbsoluteFill>
  );
};

