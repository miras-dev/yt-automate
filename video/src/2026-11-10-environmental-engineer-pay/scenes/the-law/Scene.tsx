import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  DEPTH, Eyes, GroundBand, INK, Layer, Mouth, OUTLINE, Puff, Sky, SoundCues, SweatDrop, Voice, actionSwap, addShake, blinking,
  breathe, camPath, dofBlur, easeOutCubic, eyesPop, prog, shake, spring, talkShape, useT, whip, type Cue,
} from '../../../lib';
import {
  C, DropIn, Dust, LimitLine, Permit, Person, Prop, River, SLUG, Stream, Tag, Ticket, UpArrow, fallY, landSquash, place, swapXf,
  type Pose,
} from '../../kit';
import words from '../../../../public/2026-11-10-environmental-engineer-pay/vo/scene-2.words.json';
import cuesJson from './cues.json';
import {DURATION, GAP_AFTER, T, VO_FILE, VO_OFFSET} from './timing';

const CUES = cuesJson as Cue[];
export const SECONDS = DURATION;

/** A balance scale drawn in code. angle > 0 = the right pan goes down. Items sit on the pans (children by side). */
const Balance: React.FC<{x: number; y: number; angle: number; k: number; left?: React.ReactNode; right?: React.ReactNode}> = ({x, y, angle, k, left, right}) => {
  if (k <= 0.01) return null;
  const H = 420;
  const L = 270;
  const a = (angle * Math.PI) / 180;
  const pivot = {x, y: y - H};
  const lx = pivot.x - L * Math.cos(a);
  const ly = pivot.y - L * Math.sin(a);
  const rx = pivot.x + L * Math.cos(a);
  const ry = pivot.y + L * Math.sin(a);
  const hang = 190;
  const pan = (px: number, py: number) => (
    <g>
      <line x1={px} y1={py} x2={px - 95} y2={py + hang} stroke={INK} strokeWidth={6} />
      <line x1={px} y1={py} x2={px + 95} y2={py + hang} stroke={INK} strokeWidth={6} />
      <path d={`M ${px - 125} ${py + hang} Q ${px} ${py + hang + 70} ${px + 125} ${py + hang} Z`} fill="#E8B04A" stroke={INK} strokeWidth={OUTLINE} strokeLinejoin="round" />
    </g>
  );
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: `${x}px ${y}px`, transform: `scale(${k})`}}>
      <svg width={1} height={1} style={{position: 'absolute', overflow: 'visible'}}>
        <path d={`M ${x - 150} ${y} L ${x + 150} ${y} L ${x + 110} ${y - 50} L ${x - 110} ${y - 50} Z`} fill="#C98F2C" stroke={INK} strokeWidth={OUTLINE} strokeLinejoin="round" />
        <rect x={x - 22} y={y - H} width={44} height={H - 40} fill="#E8B04A" stroke={INK} strokeWidth={OUTLINE} />
        {pan(lx, ly)}
        {pan(rx, ry)}
        <line x1={lx} y1={ly} x2={rx} y2={ry} stroke={INK} strokeWidth={30} strokeLinecap="round" />
        <line x1={lx} y1={ly} x2={rx} y2={ry} stroke="#F2C230" strokeWidth={16} strokeLinecap="round" />
        <circle cx={pivot.x} cy={pivot.y} r={26} fill="#F2C230" stroke={INK} strokeWidth={OUTLINE} />
      </svg>
      <div style={{position: 'absolute', left: lx, top: ly + hang + 18}}>{left}</div>
      <div style={{position: 'absolute', left: rx, top: ry + hang + 18}}>{right}</div>
    </div>
  );
};

export const Scene: React.FC = () => {
  const t = useT();
  const end = DURATION + GAP_AFTER;

  // ---- world ----------------------------------------------------------------------------------------------
  const G = 1480;
  const eng = {x: 330, y: G};
  const book = {x: 760, y: G};
  const FZ = 1500; // factory, river and tank live on one layer
  const fac = {x: 1450, y: 1100, size: 0.36};
  const chimney = {x: fac.x + (384.5 - 1200) * fac.size, y: fac.y - 995 * fac.size};
  const drain = {x: fac.x + 1190 * fac.size, y: fac.y + 818.5 * fac.size};
  const tank = {x: 2230, y: 1380, size: 0.26};
  const outlet = {x: tank.x + 1106.5 * tank.size, y: tank.y + 448.5 * tank.size};
  const RIVER_Y = 1560;
  const bal = {x: 1300, y: G};
  const far = place(DEPTH.far, 180, 1000, {x: 900, y: 900, z: -350});

  // ---- camera ---------------------------------------------------------------------------------------------
  const cam0 = camPath(
    [
      {t: 0, x: 540, y: 990, z: 150},
      {t: 5.5, x: 540, y: 990, z: 150},
      {t: 6.8, x: 900, y: 900, z: -350},
      {t: T.factory - 0.25, x: 900, y: 900, z: -350},
      {t: T.factory + 0.8, x: 1780, y: 1260, z: 0},
      {t: T.companies - 0.45, x: 1780, y: 1260, z: 0},
      {t: T.companies + 0.6, x: 1300, y: 990, z: 120},
      {t: T.why - 0.35, x: 950, y: 990, z: 120},
      {t: T.why + 0.75, x: 430, y: 990, z: 230},
      {t: end, x: 430, y: 990, z: 230},
    ],
    t,
  );
  const cam = addShake(cam0, shake(t, T.law, 16, 0.45), shake(t, T.treatment, 6, 0.3), shake(t, T.fines, 7, 0.3), shake(t, T.costs, 14, 0.45));
  cam.x += whip(t, end, 'out') + whip(t, end, 'in');

  // ---- engineer -------------------------------------------------------------------------------------------
  const talking = t < 1.25;
  const pose: Pose = talking ? (talkShape(t, words.words) ? 'talk_a' : 'talk_b') : t < T.why ? 'point_right' : 'thinking';
  const xf = swapXf(t, [1.25, T.why], actionSwap);

  // ---- book -----------------------------------------------------------------------------------------------
  const bookSize = 0.2;
  const bookF = fallY(t, T.law, book.y, 1500, 6400);
  const [bsx, bsy] = landSquash(t, T.law, 0.2);

  // ---- smoke under the limit line -------------------------------------------------------------------------
  const LIMIT_Y = 600;
  const limitReveal = easeOutCubic(prog(t, T.limited - 0.1, T.limited + 0.5));
  const limitOut = t > T.factory + 0.6 ? 0 : 1;

  // ---- river / waste --------------------------------------------------------------------------------------
  const wasteOn = (t > T.pipe - 0.15 && t < T.treatment) || t > T.breakLimits - 0.1;
  const wasteK = t > T.breakLimits - 0.1 ? easeOutCubic(prog(t, T.breakLimits - 0.1, T.breakLimits + 0.2)) * 1.25 : easeOutCubic(prog(t, T.pipe - 0.15, T.pipe + 0.15)) * (1 - prog(t, T.permit - 0.2, T.permit + 0.1));
  const dirty = Math.max(0, prog(t, T.pipe, T.river) * (1 - prog(t, T.keeps, T.limits)), prog(t, T.breakLimits + 0.1, T.fines));
  const cleanOn = t > T.keeps - 0.1 && t < T.breakLimits;
  const cleanK = easeOutCubic(prog(t, T.keeps - 0.1, T.keeps + 0.25));
  const linkOn = t > T.treatment + 0.15 && t < T.breakLimits;
  const riverEyes = eyesPop(t, T.factory + 0.6);
  const riverSqueeze = (t > T.river - 0.05 && t < T.permit - 0.1) || t > T.fines;
  const riverSmile = t > T.limits - 0.1 && t < T.breakLimits ? 0.6 : -0.3;

  // ---- factory face ---------------------------------------------------------------------------------------
  const facEyes = eyesPop(t, T.factory + 0.4);
  const sneaky = t > T.breakLimits - 0.1 && t < T.fines;
  const facSqueeze = t > T.violation2 - 0.05 && t < T.companies - 0.3;
  const facWorried = t > T.fines && t < T.companies;

  // ---- balance --------------------------------------------------------------------------------------------
  const balK = easeOutCubic(prog(t, T.companies - 0.1, T.companies + 0.35)) * (t > T.why - 0.2 ? 1 - prog(t, T.why - 0.2, T.why + 0.2) : 1);
  const tiltIn = -9 * easeOutCubic(prog(t, T.hire + 0.05, T.hire + 0.35));
  const tiltFines = prog(t, T.breaking, T.rules + 0.1) * 6;
  const slam = 22 * easeOutCubic(prog(t, T.costs - 0.06, T.costs + 0.1)) - (t > T.costs + 0.1 ? 5 * spring(t - T.costs - 0.1, 3, 6) : 0);
  const angle = t < T.costs - 0.06 ? tiltIn + tiltFines : -3 + slam;
  const salaryF = fallY(t, T.hire, 0, 700);
  const finesAt = [T.breaking, T.breaking + 0.22, T.breaking + 0.44];

  // ---- demand arrow ---------------------------------------------------------------------------------------
  const grow = easeOutCubic(prog(t, T.growing - 0.3, T.growing + 0.45));

  return (
    <AbsoluteFill>
      <Sky top="#8ED3FF" bottom="#E3F5FF" />

      <Layer cam={cam} z={DEPTH.far} blur={dofBlur(cam, DEPTH.far)}>
        <Prop name="town" x={far.x} y={far.y - 250} size={0.9} />
        <GroundBand top={far.y - 25} color="#B4DC88" horizon />
      </Layer>

      <Layer cam={cam} z={FZ} blur={t > T.companies - 0.3 && t < T.why + 0.4 ? 3 : dofBlur(cam, FZ, 0, 350, 1.5)}>
        <GroundBand top={1440} color="#A6D27A" />
        {/* smoke: free puffs before the limit, flattened under the line after it */}
        {Array.from({length: 40}, (_, i) => {
          const at = -0.5 + i * 0.8;
          const capped = at > T.factories - 0.4;
          return (
            <div key={i} style={{position: 'absolute', left: 0, top: 0, transformOrigin: `${chimney.x}px ${LIMIT_Y + 40}px`, transform: capped ? 'scale(1.25, 0.55)' : undefined}}>
              <Puff t={t} at={at} x={chimney.x + (i % 2 ? 14 : -10)} y={chimney.y - 30} life={capped ? 1.4 : 2.2} size={capped ? 70 : 60} rise={capped ? 130 : 520} drift={capped ? 60 : 120} count={5} fill="#A29D95" shade="#837E77" seed={`s2sm${i}`} />
            </div>
          );
        })}
        <Prop name="factory" x={fac.x} y={fac.y} size={fac.size} />
        <Eyes x={fac.x + 40} y={fac.y + 205} r={38} gap={36} brows open={facEyes} lid={sneaky ? 0.5 : 0} look={{x: sneaky ? 0.9 : -0.4, y: 0.1}} squeeze={facSqueeze} tilt={facWorried ? -14 : 0} />
        <SweatDrop t={t} at={T.fines + 0.35} x={fac.x + 200} y={fac.y - 60} life={1.4} />
        <SweatDrop t={t} at={T.violation2 + 0.1} x={fac.x - 220} y={fac.y - 10} life={1.2} />
        {limitOut ? <LimitLine x0={700} x1={2250} y={LIMIT_Y} reveal={limitReveal} /> : null}

        <River t={t} x0={-400} x1={3600} y={RIVER_Y} h={430} dirty={dirty} dirtyX={drain.x + 140} />
        <Eyes x={1480} y={RIVER_Y + 170} r={46} gap={46} open={riverEyes} squeeze={riverSqueeze} look={{x: 0.6, y: -0.4}} />
        {riverEyes > 0.5 && !riverSqueeze ? <Mouth x={1480} y={RIVER_Y + 270} width={96} smile={riverSmile} /> : null}

        {/* waste: straight into the river, then into the tank, then (breaking the limits) straight in again */}
        {wasteOn ? <Stream t={t} d={`M ${drain.x - 6} ${drain.y} C ${drain.x + 50} ${drain.y} ${drain.x + 70} ${drain.y + 70} ${drain.x + 82} ${RIVER_Y + 6}`} width={34 * wasteK} /> : null}
        {linkOn ? <Stream t={t} d={`M ${drain.x - 6} ${drain.y} L ${tank.x + (7 - 1200) * tank.size + 10} ${tank.y + 30}`} width={26} /> : null}
        <DropIn t={t} at={T.treatment} name="treatment_tank" x={tank.x} y={tank.y + 1413 * tank.size * 0.5} size={tank.size} drop={1300} />
        {cleanOn ? <Stream t={t} d={`M ${outlet.x} ${outlet.y - 6} L ${outlet.x + 4} ${RIVER_Y + 10}`} width={28 * cleanK} colors={{edge: C.waterEdge, main: C.water, core: C.waterCore}} /> : null}
        <Dust t={t} at={T.treatment} x={tank.x} y={tank.y + 180} spread={300} size={40} />

        <Permit t={t} at={T.permit} x={fac.x + 270} y={fac.y + 60} w={190} fromX={-1100} fromY={-500} />
        <Ticket t={t} at={T.fines} x={fac.x - 170} y={fac.y + 60} w={250} rotate={7} />
        <Ticket t={t} at={T.violation} x={fac.x + 110} y={fac.y + 150} w={240} rotate={-9} />
        <Ticket t={t} at={T.violation + 0.32} x={fac.x - 280} y={fac.y + 240} w={230} rotate={4} />
        <Ticket t={t} at={T.violation2} x={fac.x - 40} y={fac.y - 80} w={240} rotate={-4} />
        <Tag t={t} from={T.fines + 0.7} to={T.companies - 0.3} x={1780} y={560} text="FINES: UP TO $68,445 A DAY" size={78} bg="#FFF1F0" color={C.redDark} />
        <Tag t={t} from={T.violation2} to={T.companies - 0.3} x={1780} y={690} text="FOR EACH VIOLATION" size={60} />
      </Layer>

      <Layer cam={cam} z={DEPTH.character}>
        <GroundBand top={G + 420} color="#93C565" />
        <Person pose={pose} x={eng.x} y={eng.y} size={0.32} xf={xf} hat blink={blinking(t, 3.5, 0.9)} breath={breathe(t)} />

        {/* the law book slams down and watches */}
        {bookF.on ? (
          <>
            <Prop name="law_book" x={book.x} y={bookF.y} size={bookSize} sx={bsx} sy={bsy} anchor="bottom" />
            <Eyes x={book.x + 34} y={bookF.y - 300 * bsy} r={28} gap={26} brows open={eyesPop(t, T.law + 0.3)} tilt={14} look={{x: t > 5.5 ? 0.9 : -0.6, y: 0}} />
          </>
        ) : null}
        <Dust t={t} at={T.law} x={book.x} y={book.y} spread={320} size={52} />

        {/* labels for the laws */}
        <Tag t={t} from={T.seventies} to={5.55} x={540} y={432} text="SINCE THE 1970s" size={46} bg="#FFF6D6" />
        <Tag t={t} from={T.airAct} to={5.55} x={540} y={517} text="CLEAN AIR ACT · 1970" size={40} bg="#E9F6FF" />
        <Tag t={t} from={T.waterAct} to={5.55} x={540} y={600} text="CLEAN WATER ACT · 1972" size={40} bg="#E9F6FF" />

        {/* the balance: the engineer's pay against the fines */}
        <Balance
          x={bal.x}
          y={bal.y}
          angle={angle}
          k={balK}
          left={salaryF.on ? <Prop name="cash_bundle" x={0} y={salaryF.y - 40} size={0.1} /> : null}
          right={
            <>
              {finesAt.map((at, i) => {
                const f = fallY(t, at, 0, 600);
                if (!f.on) return null;
                return <Ticket key={i} t={t} at={-1} x={(i - 1) * 20} y={f.y - 70 - i * 46} w={150} rotate={(i - 1) * 9} amount="$68,445" />;
              })}
            </>
          }
        />
        <Tag t={t} from={T.hire} to={T.why - 0.2} x={bal.x - 270} y={G - 640} text="ENGINEER" size={44} bg="#E8FFE2" color={C.greenDark} />
        <Tag t={t} from={T.breaking} to={T.why - 0.2} x={bal.x + 270} y={G - 640} text="FINES" size={44} bg="#FFF1F0" color={C.redDark} />
        <Tag t={t} from={T.nice - 0.4} to={T.nice + 0.35} x={bal.x} y={G - 760} text="♥ NICE?" size={50} bg="#FFE3EC" color="#C2315E" />
        <Tag t={t} from={T.more} to={T.why - 0.2} x={bal.x} y={G - 870} text="BREAKING RULES COSTS MORE" size={44} bg="#FFF6D6" />

        {/* demand grows */}
        <UpArrow x={610} y={G - 10} h={560} grow={grow} />
        <Tag t={t} from={T.growing} x={610} y={G - 300} text="DEMAND" size={44} bg="#E8FFE2" color={C.greenDark} rotate={-90} />
        <Tag t={t} from={T.now} x={eng.x + 30} y={G - 960} text="?" size={110} bg="#FFF6D6" />
      </Layer>

      <Voice slug={SLUG} file={VO_FILE} offset={VO_OFFSET} />
      <SoundCues slug={SLUG} cues={CUES} T={T} />
    </AbsoluteFill>
  );
};

