import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
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
  prog,
  shake,
  useT,
  type Format,
} from '../../../lib';
import {SPRITES} from '../../sprites';
import {DURATION as SCENE_DUR, T, VO_FILE, VO_OFFSET} from './timing';

const SLUG = '2026-11-10-fde-role-in-tech';

export const S2: React.FC<{format: Format}> = ({format}) => {
  const t = useT();
  const {width: W, height: H} = FORMATS[format];
  const ground = H * 0.78;
  const hero = {x: W * 0.32, y: ground};
  const deskCentre = {x: W * 0.62, y: ground - 60};

  const cam = addShake(
    camPath(
      [
        {t: 0, x: W / 2, y: H / 2, z: 0},
        {t: T.laptop, x: W / 2, y: H / 2, z: 0},
        {t: T.question, x: W / 2, y: H / 2 - 100, z: 180, ease: easeInOutCubic},
        {t: T.trying, x: W / 2, y: H / 2 - 100, z: 180},
        {t: T.ship, x: W / 2, y: H / 2, z: 0, ease: easeInOutCubic},
        {t: SCENE_DUR, x: W / 2, y: H / 2, z: 0},
      ],
      t,
    ),
    shake(t, T.ship, 6, 0.3),
  );

  const pose = (() => {
    if (t < 0.9) return SPRITES.idle;              // she arrives
    if (t < T.laptop) return SPRITES.point_right;   // walks in, points at desk
    if (t < T.question) return SPRITES.laptop_sit;  // sits with laptop
    if (t < T.trying) return SPRITES.closeup_talk;  // close-up asking question
    if (t < T.code) return SPRITES.laptop_sit;      // sitting coding
    return SPRITES.laptop_sit;
  })();

  const walkDx = t < T.laptop ? clamp((t - 0.4) / Math.max(0.01, T.laptop - 0.4)) * (hero.x - W * 0.1) : 0;
  const heroX = pose === SPRITES.idle || pose === SPRITES.point_right ? W * 0.1 + walkDx : hero.x;
  const heroY = pose === SPRITES.laptop_sit ? deskCentre.y - 20 : hero.y;

  const showDashboards = t >= T.dashboards - 0.1 && t < T.ship + 7;
  const showModel = t >= T.model - 0.1 && t < T.ship + 7;
  const showWorkflow = t >= T.workflow - 0.1 && t < T.ship + 7;

  return (
    <AbsoluteFill>
      <Sky top="#f1efe6" bottom="#e9dfca" />

      <Layer cam={cam} z={DEPTH.character + 50}>
        <GroundBand top={ground + 80} color="#c8b893" horizon />
      </Layer>

      {/* The desk set piece */}
      <Layer cam={cam} z={DEPTH.character + 20}>
        <div style={{position: 'absolute', left: deskCentre.x, top: deskCentre.y + 20, transformOrigin: '50% 50%', transform: 'translate(-50%, -50%)'}}>
          <Sprite s={SPRITES.office_desk} x={0} y={0} anchor="centre" size={0.45} />
        </div>
      </Layer>

      {/* Hero */}
      <Layer cam={cam} z={DEPTH.character}>
        {pose !== SPRITES.laptop_sit ? <ContactShadow x={heroX} y={ground + 4} width={240} /> : null}
        <Sprite
          s={pose}
          x={heroX}
          y={heroY}
          anchor={pose.framing === 'waist' ? 'head' : 'feet'}
          size={pose.framing === 'waist' ? 0.5 : 0.34}
          scaleY={breathe(t, 1.3)}
        />
      </Layer>

      {/* Question label during the close-up */}
      {t >= T.question && t < T.ship ? (
        <Label
          t={t}
          from={T.question}
          to={T.ship - 0.1}
          x={W / 2}
          y={H * 0.78}
          text="what are you actually trying to do?"
          size={34}
          color="#111"
          bg="#ffe36b"
        />
      ) : null}

      {/* Floating code elements during shipping */}
      {showDashboards ? (
        <FloatingChip x={W * 0.25} y={H * 0.3} label="dashboard" t={t} at={T.dashboards} color="#1e8be3" />
      ) : null}
      {showModel ? (
        <FloatingChip x={W * 0.75} y={H * 0.38} label="data model" t={t} at={T.model} color="#17a05a" />
      ) : null}
      {showWorkflow ? (
        <FloatingChip x={W * 0.3} y={H * 0.48} label="workflow →" t={t} at={T.workflow} color="#a3429e" />
      ) : null}
      {t >= T.fix - 0.3 && t < SCENE_DUR ? (
        <Label t={t} from={T.fix - 0.3} to={SCENE_DUR - 0.1} x={W / 2} y={H * 0.15} text="commits fix to platform" size={36} color="#17a05a" bg="#e6ffd9" />
      ) : null}

      <Audio src={staticFile(`${SLUG}/${VO_FILE}`)} startFrom={0} />
    </AbsoluteFill>
  );
};

const FloatingChip: React.FC<{x: number; y: number; label: string; t: number; at: number; color: string}> = ({x, y, label, t, at, color}) => {
  const p = clamp((t - at) / 0.4);
  if (p <= 0) return null;
  const rise = 40 * (1 - p);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + rise,
        transform: `translate(-50%, -50%) scale(${p})`,
        background: '#ffffff',
        border: `6px solid ${color}`,
        borderRadius: 20,
        padding: '10px 24px',
        fontFamily: 'Arial Rounded MT Bold, Nunito, Arial, sans-serif',
        fontWeight: 800,
        fontSize: 42,
        color,
        whiteSpace: 'nowrap',
        boxShadow: '4px 6px 0 #11111144',
      }}
    >
      {label}
    </div>
  );
};
