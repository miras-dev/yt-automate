import React from 'react';
import {AbsoluteFill, Audio, staticFile, useVideoConfig} from 'remotion';
import {
  ContactShadow,
  DEPTH,
  FORMATS,
  GroundBand,
  Label,
  Layer,
  Sky,
  Sprite,
  addShake,
  breathe,
  camPath,
  clamp,
  dofBlur,
  easeInOutCubic,
  idleSway,
  popInOut,
  shake,
  useT,
  type Format,
} from '../../../lib';
import {SPRITES} from '../../sprites';
import {DURATION as SCENE_DUR, T, VO_FILE, VO_OFFSET} from './timing';

const SLUG = '2026-11-10-fde-role-in-tech';

export const S1: React.FC<{format: Format}> = ({format}) => {
  const {fps} = useVideoConfig();
  const t = useT();
  const {width: W, height: H} = FORMATS[format];
  const ground = H * 0.78;
  const hero = {x: W * 0.5, y: ground};

  const cam = addShake(
    camPath(
      [
        {t: 0, x: W / 2, y: H / 2, z: 0},
        {t: T.office, x: W / 2, y: H / 2, z: 0},
        {t: T.plane, x: W / 2, y: H / 2, z: 180, ease: easeInOutCubic},
        {t: T.customer, x: W / 2, y: H / 2, z: 180},
        {t: T.need, x: W / 2, y: H / 2, z: 0, ease: easeInOutCubic},
        {t: T.hq, x: W / 2, y: H / 2, z: 0},
        {t: T.sits, x: W / 2, y: H / 2, z: 100, ease: easeInOutCubic},
        {t: T.fde, x: W / 2, y: H / 2, z: 100},
        {t: SCENE_DUR, x: W / 2, y: H / 2, z: 100},
      ],
      t,
    ),
    shake(t, T.fde, 4, 0.25),
  );

  // Pick hero pose
  const pose = (() => {
    if (t < T.office) return SPRITES.idle;
    if (t < T.customer) return SPRITES.laptop_sit; // sitting on plane
    if (t < T.need) return SPRITES.closeup_react;
    if (t < T.sits) return SPRITES.shrug;
    if (t < T.fde) return SPRITES.laptop_sit;
    return SPRITES.point_right;
  })();

  const plane = t >= T.plane && t < T.need;
  const sway = idleSway(t);
  const heroY = pose === SPRITES.laptop_sit ? hero.y - H * 0.02 : hero.y;

  return (
    <AbsoluteFill>
      <Sky top="#aee0ff" bottom="#dff3ff" />

      {/* Clouds in background during plane scene */}
      {plane ? (
        <Layer cam={cam} z={DEPTH.far + 400} blur={dofBlur(cam, DEPTH.far + 400)}>
          <SimpleCloud x={W * 0.2} y={H * 0.25} s={1} />
          <SimpleCloud x={W * 0.75} y={H * 0.35} s={0.8} />
          <SimpleCloud x={W * 0.5} y={H * 0.15} s={0.6} />
        </Layer>
      ) : null}

      {/* Plane window at the start */}
      {t >= T.plane - 0.2 && t < T.need ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          <div
            style={{
              position: 'absolute',
              left: W * 0.5,
              top: H * 0.3,
              transformOrigin: '50% 50%',
              transform: `translate(-50%, -50%) scale(${popInOut(t, T.plane - 0.2, T.need, 0.2, 0.3) * ((W * 0.65) / 2400)})`,
            }}
          >
            <Sprite s={SPRITES.airplane_window} x={0} y={0} anchor="centre" size={1.0} />
          </div>
        </AbsoluteFill>
      ) : null}

      {/* Ground / floor for later shots */}
      <Layer cam={cam} z={DEPTH.character + 50}>
        <GroundBand top={ground + 80} color="#e8e1cf" horizon />
      </Layer>

      {/* Hero */}
      <Layer cam={cam} z={DEPTH.character}>
        <ContactShadow x={hero.x} y={heroY + 4} width={240} />
        <div style={{transform: `translate(0, 0) rotate(${sway * 0.2}deg)`}}>
          <Sprite
            s={pose}
            x={hero.x}
            y={heroY}
            anchor={pose.framing === 'waist' ? 'head' : 'feet'}
            size={pose.framing === 'waist' ? 0.5 : 0.34}
            scaleY={breathe(t, 1.3)}
          />
        </div>
      </Layer>

      {/* HQ engineer with the paper */}
      {t >= T.hq - 0.1 && t < T.sits ? (
        <Label
          t={t}
          from={T.hq}
          to={T.sits - 0.1}
          x={W / 2}
          y={H * 0.78}
          text="feature request"
          size={46}
          color="#a33b00"
          bg="#fff2d9"
        />
      ) : null}

      {/* Final title */}
      {t >= T.fde - 0.1 ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          <div
            style={{
              position: 'absolute',
              left: W / 2,
              top: H * 0.86,
              transform: `translate(-50%, -50%) scale(${popInOut(t, T.fde - 0.1, SCENE_DUR, 0.25, 0.1)})`,
              fontFamily: 'Arial Rounded MT Bold, Nunito, Arial, sans-serif',
              fontWeight: 900,
              fontSize: 96,
              color: '#111',
              background: '#ffe36b',
              border: '7px solid #111',
              borderRadius: 24,
              padding: '14px 36px',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              lineHeight: 1.15,
            }}
          >
            Forward Deployed
            <br />
            Engineer
          </div>
        </AbsoluteFill>
      ) : null}

      {/* Voice */}
      <Audio src={staticFile(`${SLUG}/${VO_FILE}`)} startFrom={0} />
    </AbsoluteFill>
  );
};

const SimpleCloud: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg style={{position: 'absolute', left: x - 200 * s, top: y - 70 * s, overflow: 'visible'}} width={400 * s} height={140 * s}>
    <ellipse cx={200 * s} cy={80 * s} rx={180 * s} ry={50 * s} fill="#111" />
    <ellipse cx={140 * s} cy={60 * s} rx={60 * s} ry={50 * s} fill="#111" />
    <ellipse cx={260 * s} cy={55 * s} rx={70 * s} ry={55 * s} fill="#111" />
    <ellipse cx={200 * s} cy={80 * s} rx={180 * s - 10} ry={50 * s - 10} fill="#ffffff" />
    <ellipse cx={140 * s} cy={60 * s} rx={60 * s - 10} ry={50 * s - 10} fill="#ffffff" />
    <ellipse cx={260 * s} cy={55 * s} rx={70 * s - 10} ry={55 * s - 10} fill="#ffffff" />
  </svg>
);
