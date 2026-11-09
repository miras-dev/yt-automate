import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  Burst, ContactShadow, Crown, DEPTH, Eyes, FORMATS, GroundBand, Glow, Impact, Layer, Mouth, Puff, Sky, SmokeRing,
  SweatDrop, addShake, breathe, camPath, dofBlur, easeOutCubic, eyesPop, inhaleBlast, isVertical, projectile, shake,
  throwSwap, tremble, useT, type Format,
} from '../lib';
import {DURATION, T} from './timing';

export const TEMPLATE_SECONDS = DURATION;

/**
 * Code-only test scene: no pictures and no sound, so it renders on a fresh checkout. It shows how a video is put
 * together - sky, ground bands, layers at depth, a camera path, a pose transform, a 3D projectile, effects, a face on
 * an object - and proves the helpers work in all three formats. Copy this folder to video/src/<slug>/ to start.
 * In a real video the blob below is a <Sprite> from sprites.ts and <Voice> + <SoundCues> are added.
 */
export const Template: React.FC<{format: Format}> = ({format}) => {
  const t = useT();
  const {width: W, height: H} = FORMATS[format];
  const vertical = isVertical(format);
  const ground = H * (vertical ? 0.74 : 0.8); // world y of the ground at the character plane
  const hero = {x: W * (vertical ? 0.27 : 0.3), y: ground};
  // far-plane world coords: 3 world px = 1 screen px at the wide camera, measured from the world centre
  const mound = {x: W / 2 + 3 * W * (vertical ? 0.17 : 0.16), y: H / 2 + 3 * H * (vertical ? 0.1 : 0.12), z: DEPTH.far};
  const MS = vertical ? 1.5 : 1.7; // mound size
  const crater = {x: mound.x, y: mound.y - 560 * MS, z: mound.z};

  // camera: close on the hero -> glide out to the wide shot -> pull back on the blast -> hold
  const cam = addShake(
    camPath(
      [
        {t: 0, x: hero.x + 170, y: H / 2 + 40, z: 260},
        {t: 0.5, x: hero.x + 170, y: H / 2 + 40, z: 260},
        {t: 1.9, x: W / 2, y: H / 2, z: 0},
        {t: T.blast, x: W / 2, y: H / 2, z: 0},
        {t: T.blast + 0.5, x: W / 2, y: H / 2 - 60, z: -220, ease: easeOutCubic},
        {t: DURATION, x: W / 2, y: H / 2 - 60, z: -220},
      ],
      t,
    ),
    shake(t, T.land, 6, 0.3),
    shake(t, T.blast, 18, 0.7),
  );

  // the throw: a rock flies from the hand at the character plane to the crater on the far plane
  const xf = throwSwap(t, T.release);
  const hand = {x: hero.x + 150, y: hero.y - 430, z: DEPTH.character};
  const fly = projectile(hand, crater, T.land - T.release, 0.42);
  const rock = fly.at(t - T.release);
  const scared = t > T.inhale && t < T.blast + 0.8 ? 1 : 0;
  const tr = tremble(t, scared);
  const moundSy = inhaleBlast(t, T.blast, T.blast - T.inhale);
  const farBlur = dofBlur(cam, DEPTH.far);

  return (
    <AbsoluteFill>
      <Sky top="#8fd3ff" bottom="#dff3ff">
        <AbsoluteFill style={{opacity: t > T.blast ? 0.5 * Math.exp(-2 * (t - T.blast)) : 0, background: '#ff9a3c'}} />
      </Sky>

      <Layer cam={cam} z={DEPTH.far} blur={farBlur}>
        <Glow x={crater.x} y={crater.y} r={700} opacity={t > T.blast ? 0.4 * Math.exp(-1.5 * (t - T.blast)) : 0} />
        <Crown t={t} at={T.blast} x={crater.x} y={crater.y + 20} height={900} width={150} />
        <Burst t={t} at={T.blast} x={crater.x} y={crater.y} count={22} speed={[900, 2400]} size={[18, 44]} seed="spray" />
        {/* the mound: a set piece that inhales before the blast; its base is covered by the far ground band */}
        <div style={{position: 'absolute', left: mound.x - 520, top: mound.y - 660, width: 1040, height: 700, transformOrigin: '50% 100%', transform: `scale(${MS}, ${MS * moundSy})`}}>
          <svg width={1040} height={700} style={{overflow: 'visible'}}>
            <path d="M 0 700 L 330 60 Q 520 0 710 60 L 1040 700 Z" fill="#8a6a55" stroke="#111" strokeWidth={14} strokeLinejoin="round" />
            <ellipse cx={520} cy={48} rx={196} ry={44} fill="#FF6A2B" stroke="#111" strokeWidth={14} />
          </svg>
          <Eyes x={520} y={300} r={62} gap={60} outline={14} brows open={eyesPop(t, T.eyes)} tilt={t > T.land && t < T.blast ? 16 : 0} lid={t > T.smug ? 0.5 : 0} look={{x: t < T.land ? -0.8 : 0, y: t < T.land ? -0.2 : 0.3}} squeeze={t > T.blast && t < T.blast + 0.5} />
          <Mouth x={520} y={440} width={130} outline={14} smile={t > T.smug ? 0.5 : -0.2} open={t > T.inhale && t < T.blast + 0.4 ? 1 : 0} />
        </div>
        <Impact t={t} at={T.land} x={crater.x} y={crater.y - 40} size={170} />
        <Burst t={t} at={T.land} x={crater.x} y={crater.y} count={9} speed={[400, 900]} size={[12, 26]} seed="plop" />
        <Puff t={t} at={T.blast + 0.25} x={crater.x - 60} y={crater.y - 300} size={150} rise={520} fill="#8d8a87" shade="#6f6c6a" seed="s1" />
        <Puff t={t} at={T.blast + 0.6} x={crater.x + 90} y={crater.y - 240} size={120} rise={600} life={1.7} fill="#8d8a87" shade="#6f6c6a" seed="s2" />
        <SmokeRing t={t} at={T.smug} x={crater.x} y={crater.y - 40} />
        <GroundBand top={mound.y + 40} color="#bfe08a" horizon />
      </Layer>

      <Layer cam={cam} z={DEPTH.mid} blur={dofBlur(cam, DEPTH.mid)}>
        <GroundBand top={ground + 60} color="#a9d473" />
      </Layer>

      {/* the rock is its own layer at its own depth while it flies */}
      {rock.flying ? (
        <Layer cam={cam} z={rock.z}>
          <div style={{position: 'absolute', left: rock.x - 34, top: rock.y - 34, width: 68, height: 68, borderRadius: '42%', background: '#9a9a9a', border: '7px solid #111', transform: `rotate(${rock.spin}deg)`}} />
        </Layer>
      ) : null}

      <Layer cam={cam} z={DEPTH.character}>
        <GroundBand top={ground + 90} color="#93c65f" />
        <ContactShadow x={hero.x} y={hero.y + 4} width={280} />
        {/* stand-in for <Sprite s={SPRITES[pose]} x={hero.x} y={hero.y} anchor="feet" scaleX=... /> */}
        <div style={{position: 'absolute', left: hero.x + tr.x, top: hero.y + tr.y, transformOrigin: '0 0', transform: `rotate(${xf.rotate}deg) scale(${xf.scaleX}, ${xf.scaleY * breathe(t)})`}}>
          <div style={{position: 'absolute', left: -75, top: -250, width: 150, height: 250, borderRadius: 70, background: '#fff', border: '7px solid #111'}} />
          <div style={{position: 'absolute', left: -150, top: -530, width: 300, height: 300, borderRadius: '50%', background: '#fff', border: '7px solid #111'}} />
          <div style={{position: 'absolute', left: -52, top: -410, width: 26, height: 40, borderRadius: '50%', background: '#111'}} />
          <div style={{position: 'absolute', left: 30, top: -410, width: 26, height: 40, borderRadius: '50%', background: '#111'}} />
          {!xf.swapped ? <div style={{position: 'absolute', left: 116, top: -464, width: 68, height: 68, borderRadius: '42%', background: '#9a9a9a', border: '7px solid #111'}} /> : null}
        </div>
        <SweatDrop t={t} at={T.inhale + 0.1} x={hero.x + 120} y={hero.y - 500} />
      </Layer>
    </AbsoluteFill>
  );
};
