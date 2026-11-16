import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  GroundBand, INK, Layer, OUTLINE, Sky, SoundCues, Voice, actionSwap, addShake, blinking, breathe, camPath, easeInOutCubic,
  easeOutCubic, prog, shake, useT, whip, type Cue,
} from '../../../lib';
import {C, Coin, CoinBurst, InfoCard, Person, PriceTag, Prop, SLUG, Shutter, StampText, Tag, propSize, swapXf, type Pose} from '../../kit';
import cuesJson from './cues.json';
import {DURATION, GAP_AFTER, T, VO_FILE, VO_OFFSET} from './timing';

const CUES = cuesJson as Cue[];
export const SECONDS = DURATION;
const fast = (x: number) => easeInOutCubic(x);

export const Scene: React.FC = () => {
  const t = useT();
  const end = DURATION + GAP_AFTER;
  const G = 930;
  const SHOP = 2600;

  // ---- places ---------------------------------------------------------------------------------------------
  const house = {x: 760, size: 0.42};
  const hs = propSize('apartment', house.size);
  const win = {x: house.x + 0.14 * hs.w, y: G - hs.h * 0.6, w: 46, h: 78};
  const shop = {x: SHOP + 900, size: 0.6};
  const ss = propSize('supermarket', shop.size);
  const door = {x0: shop.x - 173, x1: shop.x + 172, y0: G - ss.h + 522 * shop.size, y1: G - ss.h + 1203 * shop.size};
  const machine = {x: SHOP + 230, size: 0.22};
  const ms = propSize('pfand_machine', machine.size);
  const hole = {x: machine.x + (775 - 610.5) * machine.size, y: G - ms.h + 757 * machine.size};
  const me = {x: SHOP - 60, y: G};

  const cam0 = camPath(
    [
      {t: 0, x: 1000, y: 520, z: 80},
      {t: T.home - 0.3, x: 1000, y: 520, z: 80},
      {t: T.home + 0.45, x: SHOP + 520, y: 540, z: 60, ease: fast},
      {t: end, x: SHOP + 520, y: 540, z: 60},
    ],
    t,
  );
  const cam = addShake(cam0, shake(t, T.closed, 8, 0.35));
  cam.x += whip(t, end, 'out') + whip(t, end, 'in');

  // ---- rent: coins fly from the student into the WG window ------------------------------------------------
  const student = {x: 1380, y: G};
  const coins = Array.from({length: 7}, (_, i) => {
    const t0 = T.rent - 0.1 + i * 0.16;
    const p = prog(t, t0, t0 + 0.55);
    if (p <= 0 || p >= 1) return null;
    const x = student.x - 40 + (win.x - student.x + 40) * p;
    const y = G - 420 + (win.y - (G - 420)) * p - 260 * Math.sin(Math.PI * p);
    return <Coin key={i} x={x} y={y} r={22} rotate={p * 500} k={1 - 0.4 * p} />;
  });
  const glow = easeOutCubic(prog(t, T.wg - 0.3, T.wg + 0.2));

  // ---- Pfand: three bottles into the machine ----------------------------------------------------------------
  const bag = {x: me.x + 70, y: G - 150};
  const flights = [T.singleUse, T.bottle, T.can].map((tl, i) => {
    const t0 = tl - 0.55;
    const p = prog(t, t0, tl);
    if (p <= 0 || p >= 1) return null;
    const x = bag.x + (hole.x - bag.x) * p;
    const y = bag.y + (hole.y - bag.y) * p - 220 * Math.sin(Math.PI * p);
    return <Prop key={i} name="bottle" x={x} y={y} size={0.05} rotate={-90 * p - 20} />;
  });
  const shutter = easeInOutCubic(prog(t, T.closed - 1.1, T.closed));
  const mePose: Pose = t < T.closed + 0.2 ? 'bottle_bag' : 'shrug';
  const meXf = swapXf(t, [T.closed + 0.2], actionSwap);

  return (
    <AbsoluteFill>
      <Sky top="#7C6BB0" bottom="#FFB98A" />
      <Layer cam={cam} z={2600}>
        <GroundBand top={1100} color="#9C8FB2" horizon />
        {[-900, 150, 1900, 3300, 4400, 5600].map((x, i) => (
          <Prop key={i} name="apartment" x={x} y={1105} size={0.5} anchor="bottom" style={{filter: 'brightness(0.82) saturate(0.8)'}} />
        ))}
      </Layer>
      <Layer cam={cam} z={1000}>
        <GroundBand top={G - 8} color="#B7AFA2" />
        {/* the house with the WG */}
        <Prop name="apartment" x={house.x} y={G} size={house.size} anchor="bottom" />
        {glow > 0.01 ? <div style={{position: 'absolute', left: win.x - win.w / 2, top: win.y - win.h / 2, width: win.w, height: win.h, background: '#FFE27A', opacity: glow, border: `5px solid ${INK}`}} /> : null}
        {coins}
        <Person pose="idle" x={student.x} y={student.y} size={0.26} backpack blink={blinking(t, 3.1, 0.2)} breath={breathe(t)} />
        <Tag t={t} from={T.wg} to={T.home - 0.2} x={win.x} y={win.y - 110} text="OUR WG" size={40} bg="#FFF6D6" />
        <PriceTag t={t} at={T.price} to={T.home - 0.2} x={win.x + 40} y={win.y + 30} text="€512" w={260} />
        <Tag t={t} from={T.price + 0.3} to={T.home - 0.2} x={1420} y={150} text="€512 A MONTH (AVERAGE WG ROOM)" size={42} bg="#fff" />
        <Tag t={t} from={T.munich} to={T.home - 0.2} x={1500} y={255} text="MUNICH: ABOUT €800" size={50} bg="#FFF1F0" color={C.redDark} />

        {/* the supermarket and the Pfand machine */}
        <Prop name="supermarket" x={shop.x} y={G} size={shop.size} anchor="bottom" />
        <Shutter x={door.x0} y={door.y0} w={door.x1 - door.x0} h={door.y1 - door.y0} down={shutter} />
        <Prop name="pfand_machine" x={machine.x} y={G} size={machine.size} anchor="bottom" />
        {flights}
        {[T.singleUse, T.bottle, T.can].map((tl, i) => (
          <Tag key={i} t={t} from={tl} to={tl + 1.1} x={machine.x + 30} y={hole.y - 210 - i * 10} text="+€0.25" size={44} bg="#E8FFE2" color={C.greenDark} />
        ))}
        <CoinBurst t={t} at={T.cents} x={machine.x} y={hole.y + 120} count={5} seed="pfand" spread={[-40, 40]} speed={[400, 700]} r={20} />
        <Person pose={mePose} x={me.x} y={me.y} size={0.26} xf={meXf} backpack blink={blinking(t, 3.3, 0.9)} breath={breathe(t)} />
        <Tag t={t} from={T.pfand} to={T.shopping - 0.2} x={SHOP + 520} y={120} text="PFAND: 25 CENTS" size={66} bg="#FFF6D6" />
        <Tag t={t} from={T.shops} to={T.shopping - 0.2} x={SHOP + 520} y={225} text="SHOPS MUST TAKE THEM BACK" size={44} />
        <InfoCard t={t} at={T.sundays} to={end} x={SHOP + 1180} y={300} w={360} title="SUNDAY" lines={['CLOSED']} size={58} header={C.red} rotate={4} />
        <StampText t={t} at={T.closed} to={end} x={shop.x} y={(door.y0 + door.y1) / 2} text="CLOSED" size={78} rotate={-8} />
        <Tag t={t} from={T.cost} x={me.x + 20} y={300} text="?" size={90} bg="#FFF6D6" />
      </Layer>

      <Voice slug={SLUG} file={VO_FILE} offset={VO_OFFSET} />
      <SoundCues slug={SLUG} cues={CUES} T={T} />
    </AbsoluteFill>
  );
};

