import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  DEPTH, GroundBand, INK, Layer, OUTLINE, Sky, SoundCues, SpeedLines, Voice, actionSwap, addShake, blinking, breathe, camPath, clamp,
  easeInOutCubic, easeOutBack, easeOutCubic, prog, shake, useT, whip, type Cue,
} from '../../../lib';
import {C, Clock, FONT, InfoCard, Person, Prop, Route, SLUG, Sparkle, StampText, Tag, pop, swapXf, type Pose} from '../../kit';
import cuesJson from './cues.json';
import {DURATION, GAP_AFTER, T, VO_FILE, VO_OFFSET} from './timing';

const CUES = cuesJson as Cue[];
export const SECONDS = DURATION;

/** A vehicle crossing the frame: x from x0 to x1 between t0 and t0 + dur (eased in and out of the frame). */
const crossX = (t: number, t0: number, dur: number, x0: number, x1: number) => {
  const p = prog(t, t0, t0 + dur);
  return {x: x0 + (x1 - x0) * easeInOutCubic(p), on: t > t0 && t < t0 + dur, bob: 3 * Math.sin(t * 30)};
};

/** Two price bars: the regular Deutschlandticket and the student price (60 %). */
const PriceBars: React.FC<{t: number; at: number; to: number; x: number; y: number}> = ({t, at, to, x, y}) => {
  const k = pop(t, at, to, 0.2);
  if (k <= 0.001) return null;
  const W = 620;
  const fillA = easeOutCubic(prog(t, at, at + 0.5));
  const fillB = easeOutCubic(prog(t, at + 0.35, at + 0.9));
  const row = (label: string, value: string, frac: number, color: string, dy: number) => (
    <div style={{position: 'absolute', left: 26, top: 26 + dy, width: W + 60, fontFamily: FONT, fontWeight: 900, color: INK}}>
      <div style={{fontSize: 34, marginBottom: 8}}>{label}</div>
      <div style={{position: 'relative', width: W, height: 70, background: '#fff', border: `${OUTLINE}px solid ${INK}`, borderRadius: 18, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${frac * 100}%`, background: color, borderRight: frac > 0.01 ? `${OUTLINE}px solid ${INK}` : 'none'}} />
        <div style={{position: 'absolute', right: 16, top: 6, fontSize: 44}}>{value}</div>
      </div>
    </div>
  );
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${k})`, width: W + 60, height: 300, background: C.paper, border: `${OUTLINE}px solid ${INK}`, borderRadius: 26, padding: 26, boxSizing: 'content-box'}}>
      {row('REGULAR DEUTSCHLANDTICKET', '€63', fillA, '#B9C2CC', 0)}
      {row('STUDENTS: 60 %', '€37.80', fillB * 0.6, C.green, 150)}
    </div>
  );
};

export const Scene: React.FC = () => {
  const t = useT();
  const end = DURATION + GAP_AFTER;
  const G = 930; // sidewalk at the character plane

  const cam0 = camPath(
    [
      {t: 0, x: 960, y: 540, z: 0},
      {t: T.cologne - 0.6, x: 960, y: 540, z: 0},
      {t: T.cologne - 0.1, x: 960, y: 520, z: 120},
      {t: T.lecture - 0.5, x: 960, y: 520, z: 120},
      {t: T.lecture + 0.3, x: 820, y: 560, z: 160},
      {t: end, x: 820, y: 560, z: 160},
    ],
    t,
  );
  const cam = addShake(cam0, shake(t, T.include, 6, 0.3));
  cam.x += whip(t, end, 'out') + whip(t, end, 'in');

  // ---- the box bursts, the ticket flies out ----------------------------------------------------------------
  const boxK = t < 0.2 ? 1 : 1 - easeOutCubic(prog(t, 0.2, 0.35));
  const ticketUp = t < T.include + 1.4 ? 1 : 1 - easeInOutCubic(prog(t, T.include + 1.4, T.include + 2.0));
  const ticketTo = 7.4;

  // ---- vehicles -------------------------------------------------------------------------------------------
  // every vehicle starts and ends fully outside the frame (widths: bus 1008, tram 2280, train 2400 world px)
  const bus = crossX(t, T.buses - 0.8, 2.4, -1200, 3150);
  const tram = crossX(t, T.trams - 0.9, 3.0, 3750, -1850);
  const train = crossX(t, T.regional - 1.6, 4.4, -3350, 5300);
  const busIcon = pop(t, T.bus, 3.6);
  const trainIcon = pop(t, T.train, 3.6);

  // ---- people ---------------------------------------------------------------------------------------------
  const me = {x: 420, y: G};
  const pose: Pose = t < T.why ? 'idle' : 'shrug';
  const xf = swapXf(t, [T.why], actionSwap);
  const strollers = [0, 1, 2].map((i) => {
    // walk in from outside the frame, slow down, then stroll (nobody hurries to an 8:00 c.t. lecture)
    const t0 = T.lecture - 0.6 + i * 0.35;
    const xs = 2350 + i * 120;
    const xe = 1500 - i * 250;
    const x = t < t0 + 2.2 ? xe + (xs - xe) * (1 - easeOutCubic(prog(t, t0, t0 + 2.2))) : xe - 70 * (t - t0 - 2.2);
    const step = Math.floor((t - t0) * 3.2 + i) % 2 === 0;
    return {x, step, on: t > t0, i};
  });

  // ---- the route ------------------------------------------------------------------------------------------
  const mapK = pop(t, T.cologne - 0.5, T.lecture - 0.45, 0.22);
  const routeReveal = easeOutCubic(prog(t, T.cologne - 0.2, T.berlin + 0.3));
  const trip = prog(t, T.ride, T.longer + 0.9);
  const A = {x: 640, y: 640, label: 'COLOGNE'};
  const B = {x: 1300, y: 330, label: 'BERLIN'};

  return (
    <AbsoluteFill>
      <Sky top="#8FD3FF" bottom="#E8F7FF" />
      {/* far: houses and the regional train on its embankment */}
      <Layer cam={cam} z={DEPTH.far}>
        <GroundBand top={1080} color="#B8D98E" horizon />
        {[-1500, -600, 300, 1200, 2100, 3000].map((x, i) => (
          <Prop key={i} name="apartment" x={x} y={1085} size={0.55 + 0.05 * (i % 2)} anchor="bottom" />
        ))}
        {train.on ? <Prop name="regional_train" x={train.x} y={1060 + train.bob * 0.3} size={1.0} anchor="bottom" /> : null}
      </Layer>
      {/* mid: the street with the bus and the tram */}
      <Layer cam={cam} z={1500}>
        <GroundBand top={880} color="#9A9DA3" />
        <div style={{position: 'absolute', left: -3000, top: 950, width: 9000, height: 14, background: '#6E7278'}} />
        <div style={{position: 'absolute', left: -3000, top: 1010, width: 9000, height: 14, background: '#6E7278'}} />
        {tram.on ? <Prop name="tram" x={tram.x} y={1000 + tram.bob * 0.3} size={0.95} anchor="bottom" /> : null}
        {bus.on ? (
          <>
            <Prop name="bus" x={bus.x} y={1075 + bus.bob * 0.4} size={0.42} anchor="bottom" />
            <SpeedLines t={t} at={T.buses - 0.3 + Math.floor((t - T.buses) / 0.3) * 0.3} x={bus.x - 560} y={920} angle={0} length={160} count={3} life={0.3} seed={`b${Math.floor(t / 0.3)}`} />
          </>
        ) : null}
      </Layer>
      <Layer cam={cam} z={DEPTH.character}>
        <GroundBand top={G - 10} color="#C9C2B2" />
        {/* tram stop sign */}
        <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <rect x={186} y={520} width={14} height={G - 520} fill="#7D8590" stroke={INK} strokeWidth={5} />
          <circle cx={193} cy={500} r={56} fill="#F2C230" stroke={INK} strokeWidth={OUTLINE} />
          <text x={193} y={522} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={64} fill="#1F7A3A">H</text>
        </svg>
        {/* U-Bahn sign */}
        {t > T.subways - 0.1 ? (
          <div style={{position: 'absolute', left: 1640, top: 620, transform: `translate(-50%, -50%) scale(${easeOutBack(prog(t, T.subways - 0.1, T.subways + 0.15))})`}}>
            <div style={{width: 120, height: 120, background: '#2F5DC8', border: `${OUTLINE}px solid ${INK}`, borderRadius: 16, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 90, textAlign: 'center', lineHeight: '118px'}}>U</div>
            <div style={{position: 'absolute', left: 52, top: 126, width: 16, height: 190, background: '#7D8590', border: `5px solid ${INK}`}} />
          </div>
        ) : null}

        {/* walkers on the way to the lecture (taking their time) */}
        {strollers.map((s) => (s.on ? <Person key={s.i} pose={s.step ? 'walk_a' : 'walk_b'} x={s.x} y={G} size={0.2} flip backpack /> : null))}
        <Person pose={pose} x={me.x} y={me.y} size={0.26} xf={xf} backpack blink={blinking(t, 3.2, 0.4)} breath={breathe(t)} />

        {/* the box from scene 1 bursts, the ticket flies out */}
        {boxK > 0.01 ? <Prop name="gift_box" x={960} y={760} size={0.1 * boxK} anchor="bottom" /> : null}
        <Sparkle t={t} at={0.22} x={900} y={640} size={50} />
        <Sparkle t={t} at={0.3} x={1030} y={600} size={40} />
        <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '960px 400px', transform: `translate(0px, ${-40 * (1 - ticketUp)}px) scale(${0.6 + 0.4 * ticketUp})`}}>
          <InfoCard t={t} at={T.ticket} to={ticketTo} x={960} y={400} w={900} title="DEUTSCHLAND-SEMESTERTICKET" lines={['BUSES · TRAMS · U-BAHN · TRAINS']} size={50} header="#2F5DC8" from={{x: 960, y: 760}} fly={0.3} />
          <StampText t={t} at={T.include} to={ticketTo} x={960} y={470} text="IN THE SEMESTER FEE" size={52} rotate={-6} color={C.greenDark} />
        </div>
        {busIcon > 0.01 ? <Prop name="bus" x={600} y={640} size={0.13 * busIcon} /> : null}
        {trainIcon > 0.01 ? <Prop name="regional_train" x={1330} y={640} size={0.22 * trainIcon} /> : null}

        <Tag t={t} from={T.germany} to={T.price - 0.3} x={1180} y={240} text="ALL OVER GERMANY" size={60} bg="#FFF6D6" />
        <InfoCard t={t} at={T.price} to={T.sixty - 0.15} x={1180} y={330} w={520} title="THIS SEMESTER" lines={['€37.80 / MONTH']} size={54} header={C.greenDark} />
        <PriceBars t={t} at={T.sixty} to={T.cologne - 0.6} x={1220} y={360} />

        {/* the map: Cologne to Berlin on regional trains */}
        {mapK > 0.01 ? (
          <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '960px 480px', transform: `scale(${mapK})`}}>
            <div style={{position: 'absolute', left: 430, top: 200, width: 1080, height: 600, background: '#F3EAD3', border: `${OUTLINE}px solid ${INK}`, borderRadius: 30, boxShadow: `0 12px 0 ${INK}`}} />
            <Route a={A} b={B} reveal={routeReveal} p={trip} size={44} />
            {trip > 0.001 && trip < 1 ? <Prop name="regional_train" x={A.x + (B.x - A.x) * trip} y={A.y + (B.y - A.y) * trip - 22} size={0.09} rotate={(Math.atan2(B.y - A.y, B.x - A.x) * 180) / Math.PI} /> : null}
            <Tag t={t} from={T.noExtra} to={T.lecture - 0.5} x={1260} y={640} text="+ €0" size={64} bg="#E8FFE2" color={C.greenDark} />
            {t > T.longer - 0.1 ? <Clock x={700} y={330} r={70} minutes={420 + 400 * prog(t, T.longer - 0.1, T.longer + 1.2)} k={easeOutBack(clamp((t - T.longer + 0.1) * 6))} /> : null}
            <Tag t={t} from={T.longer} to={T.lecture - 0.5} x={700} y={445} text="MUCH LONGER" size={40} />
          </div>
        ) : null}

        <InfoCard t={t} at={T.lecture} x={1120} y={300} w={460} title="LECTURE" lines={['8:00']} size={64} header="#7A3FB8" />
        <Tag t={t} from={T.nobody} x={me.x + 20} y={250} text="?" size={90} bg="#FFF6D6" />
      </Layer>

      <Voice slug={SLUG} file={VO_FILE} offset={VO_OFFSET} />
      <SoundCues slug={SLUG} cues={CUES} T={T} />
    </AbsoluteFill>
  );
};
