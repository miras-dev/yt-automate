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
  easeInOutCubic,
  popInOut,
  shake,
  useT,
  type Format,
} from '../../../lib';
import {SPRITES} from '../../sprites';
import {DURATION as SCENE_DUR, T, VO_FILE} from './timing';

const SLUG = '2026-11-10-fde-role-in-tech';

/**
 * Scene 3: diptych.
 * LEFT: a "normal" engineer with ONE feature-chip floating to many user avatars.
 * RIGHT: the FDE with MANY feature-chips going to one customer.
 * Then zooms on "startup CTO for one customer" label.
 */
export const S3: React.FC<{format: Format}> = ({format}) => {
  const t = useT();
  const {width: W, height: H} = FORMATS[format];
  const ground = H * 0.78;

  const cam = addShake(
    camPath(
      [
        {t: 0, x: W / 2, y: H / 2, z: 0},
        {t: T.flip, x: W / 2, y: H / 2, z: 0},
        {t: T.palantir, x: W / 2, y: H / 2, z: 120, ease: easeInOutCubic},
        {t: T.endToEnd, x: W / 2, y: H / 2, z: 120},
        {t: SCENE_DUR, x: W / 2, y: H / 2, z: 120},
      ],
      t,
    ),
    shake(t, T.flip, 6, 0.3),
  );

  const sideY = H * 0.5;
  const leftX = W * 0.28;
  const rightX = W * 0.72;

  const showLeft = t < T.palantir;
  const showRight = t >= T.flip - 0.1 && t < T.palantir;
  const showCTO = t >= T.palantir - 0.1;

  return (
    <AbsoluteFill>
      <Sky top="#e9f4ff" bottom="#d4ebff" />

      <Layer cam={cam} z={DEPTH.character + 50}>
        <GroundBand top={ground + 80} color="#9fd97a" horizon />
      </Layer>

      {/* LEFT diptych - normal engineer */}
      {showLeft ? (
        <Layer cam={cam} z={DEPTH.character}>
          <ContactShadow x={leftX} y={ground + 4} width={200} />
          <Sprite s={SPRITES.idle} x={leftX} y={ground} anchor="feet" size={0.28} scaleY={breathe(t)} />
          {/* Feature chip */}
          {t >= T.oneFeature - 0.1 ? <Chip x={leftX} y={H * 0.35} label="one feature" color="#1e8be3" t={t} at={T.oneFeature} /> : null}
          {/* Many users as dots */}
          {t >= T.million - 0.1 ? <ManyUsers x={leftX} y={H * 0.68} t={t} at={T.million} /> : null}
          {/* "normal" label */}
          <Label t={t} from={0} to={T.palantir - 0.2} x={leftX} y={H * 0.15} text="normal" size={48} color="#555" bg="#fff" />
        </Layer>
      ) : null}

      {/* RIGHT diptych - FDE */}
      {showRight ? (
        <Layer cam={cam} z={DEPTH.character}>
          <ContactShadow x={rightX} y={ground + 4} width={200} />
          <Sprite s={SPRITES.laptop_sit} x={rightX} y={ground - 10} anchor="feet" size={0.28} scaleY={breathe(t, 1.3)} />
          <Label t={t} from={T.flip} to={T.palantir - 0.2} x={rightX} y={H * 0.15} text="FDE" size={56} color="#111" bg="#ffe36b" />
          {t >= T.oneCustomer - 0.1 ? <Chip x={rightX} y={H * 0.35} label="one customer" color="#17a05a" t={t} at={T.oneCustomer} /> : null}
          {t >= T.millionFeatures - 0.1 ? <ManyChips x={rightX} y={H * 0.66} t={t} at={T.millionFeatures} /> : null}
        </Layer>
      ) : null}

      {/* Palantir + CTO label */}
      {showCTO ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          <Sprite s={SPRITES.closeup_talk} x={W * 0.55} y={H * 0.5} anchor="head" size={0.6} scaleY={breathe(t, 1.0)} />
          {t >= T.cto - 0.2 ? (
            <div
              style={{
                position: 'absolute',
                left: W / 2,
                top: H * 0.8,
                transform: `translate(-50%, -50%) scale(${popInOut(t, T.cto - 0.2, SCENE_DUR, 0.25, 0.1)})`,
                background: '#ffe36b',
                border: '7px solid #111',
                borderRadius: 24,
                padding: '16px 32px',
                fontFamily: 'Arial Rounded MT Bold, Nunito, Arial, sans-serif',
                fontWeight: 900,
                fontSize: 60,
                color: '#111',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              startup CTO
              <br />
              <span style={{fontSize: 36, opacity: 0.8}}>for one customer</span>
            </div>
          ) : null}
          {t >= T.palantir - 0.1 && t < T.cto + 0.5 ? (
            <Label t={t} from={T.palantir} to={T.cto + 0.3} x={W / 2} y={H * 0.14} text="Palantir, 2009" size={40} color="#333" bg="#fff" />
          ) : null}
        </AbsoluteFill>
      ) : null}

      <Audio src={staticFile(`${SLUG}/${VO_FILE}`)} startFrom={0} />
    </AbsoluteFill>
  );
};

const Chip: React.FC<{x: number; y: number; label: string; color: string; t: number; at: number}> = ({x, y, label, color, t, at}) => {
  const p = clamp((t - at) / 0.35);
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${p})`,
        background: '#fff',
        border: `6px solid ${color}`,
        color,
        padding: '8px 18px',
        borderRadius: 16,
        fontFamily: 'Arial Rounded MT Bold, Nunito, Arial, sans-serif',
        fontWeight: 800,
        fontSize: 32,
        whiteSpace: 'nowrap',
        boxShadow: '3px 4px 0 #11111144',
      }}
    >
      {label}
    </div>
  );
};

const ManyUsers: React.FC<{x: number; y: number; t: number; at: number}> = ({x, y, t, at}) => {
  const p = clamp((t - at) / 0.6);
  if (p <= 0) return null;
  return (
    <svg style={{position: 'absolute', left: x - 120, top: y - 60, overflow: 'visible'}} width={240} height={120}>
      {Array.from({length: 16}).map((_, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const cx = col * 28 + 10;
        const cy = row * 42 + 10;
        const show = clamp(p * 2 - i * 0.02);
        if (show < 0.05) return null;
        return (
          <g key={i} transform={`translate(${cx} ${cy}) scale(${show})`}>
            <circle cx={10} cy={10} r={10} fill="#1e8be3" stroke="#111" strokeWidth={3} />
            <ellipse cx={10} cy={30} rx={14} ry={10} fill="#1e8be3" stroke="#111" strokeWidth={3} />
          </g>
        );
      })}
    </svg>
  );
};

const ManyChips: React.FC<{x: number; y: number; t: number; at: number}> = ({x, y, t, at}) => {
  const p = clamp((t - at) / 0.8);
  if (p <= 0) return null;
  const labels = ['auth', 'etl', 'model', 'cron', 'ui', 'api', 'cli', 'kb'];
  return (
    <>
      {labels.map((l, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const cx = x + (col - 1.5) * 60;
        const cy = y + (row - 0.5) * 48;
        const show = clamp(p * 2 - i * 0.08);
        if (show < 0.05) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: cx,
              top: cy,
              transform: `translate(-50%, -50%) scale(${show})`,
              background: '#fff',
              border: '4px solid #17a05a',
              color: '#17a05a',
              padding: '4px 10px',
              borderRadius: 10,
              fontFamily: 'Arial Rounded MT Bold, Nunito, Arial, sans-serif',
              fontWeight: 800,
              fontSize: 22,
            }}
          >
            {l}
          </div>
        );
      })}
    </>
  );
};
