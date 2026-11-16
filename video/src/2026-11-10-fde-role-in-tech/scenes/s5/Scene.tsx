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

export const S5: React.FC<{format: Format}> = ({format}) => {
  const t = useT();
  const {width: W, height: H} = FORMATS[format];
  const ground = H * 0.78;

  const cam = addShake(
    camPath(
      [
        {t: 0, x: W / 2, y: H / 2, z: 0},
        {t: T.money238, x: W / 2, y: H / 2, z: 0},
        {t: T.catch, x: W / 2, y: H / 2, z: 120, ease: easeInOutCubic},
        {t: T.real, x: W / 2, y: H / 2, z: 120},
        {t: T.thisJob, x: W / 2, y: H / 2, z: -140, ease: easeInOutCubic},
        {t: SCENE_DUR, x: W / 2, y: H / 2, z: -140},
      ],
      t,
    ),
    shake(t, T.catch, 6, 0.3),
  );

  return (
    <AbsoluteFill>
      <Sky top="#fff7de" bottom="#ffe6a8" />

      <Layer cam={cam} z={DEPTH.character + 50}>
        <GroundBand top={ground + 80} color="#f3c66b" horizon />
      </Layer>

      {/* Money bag with 238k label */}
      {t < T.catch - 0.1 ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          <div style={{position: 'absolute', left: W * 0.5, top: H * 0.45, transform: 'translate(-50%, -50%)'}}>
            <Sprite s={SPRITES.money_bag} x={0} y={0} anchor="centre" size={0.55} scaleY={1 + 0.03 * Math.sin(2 * Math.PI * 0.9 * t)} />
          </div>
          {t >= T.money238 - 0.1 ? (
            <Label t={t} from={T.money238} to={T.catch - 0.2} x={W / 2} y={H * 0.78} text="$238K / year avg" size={64} color="#111" bg="#ffe36b" />
          ) : null}
          {t >= T.halfMillion - 0.2 && t < T.catch ? (
            <Label t={t} from={T.halfMillion - 0.2} to={T.catch - 0.1} x={W / 2} y={H * 0.86} text="frontier labs: $500K+" size={40} color="#17a05a" bg="#e6ffd9" />
          ) : null}
        </AbsoluteFill>
      ) : null}

      {/* The "catch" - calendar / travel */}
      {t >= T.catch - 0.1 && t < T.real ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          <Calendar t={t} at={T.catch} x={W / 2} y={H * 0.4} />
          {t >= T.travel - 0.1 ? (
            <Label t={t} from={T.travel} to={T.real - 0.1} x={W / 2} y={H * 0.72} text="~50% travel" size={60} color="#c22a2a" bg="#fff5d1" />
          ) : null}
          {t >= T.shortTimelines - 0.1 ? (
            <Label t={t} from={T.shortTimelines} to={T.real - 0.1} x={W / 2} y={H * 0.82} text="short timelines" size={44} color="#555" bg="#fff" />
          ) : null}
        </AbsoluteFill>
      ) : null}

      {/* Payoff */}
      {t >= T.real - 0.1 ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          <Layer cam={cam} z={DEPTH.character}>
            <ContactShadow x={W * 0.3} y={ground + 4} width={240} />
            <Sprite s={SPRITES.laptop_sit} x={W * 0.3} y={ground - 10} anchor="feet" size={0.34} scaleY={breathe(t, 1.2)} />
          </Layer>
          {t >= T.monday - 0.2 ? (
            <div
              style={{
                position: 'absolute',
                left: W / 2,
                top: H * 0.28,
                transform: `translate(-50%, -50%) scale(${popInOut(t, T.monday - 0.2, SCENE_DUR, 0.3, 0.2)})`,
                background: '#ffe36b',
                border: '7px solid #111',
                borderRadius: 24,
                padding: '18px 36px',
                fontFamily: 'Arial Rounded MT Bold, Nunito, Arial, sans-serif',
                fontWeight: 900,
                fontSize: 60,
                color: '#111',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                lineHeight: 1.15,
              }}
            >
              someone uses it
              <br />
              on <span style={{color: '#c22a2a'}}>Monday</span>
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}

      <Audio src={staticFile(`${SLUG}/${VO_FILE}`)} startFrom={0} />
    </AbsoluteFill>
  );
};

const Calendar: React.FC<{t: number; at: number; x: number; y: number}> = ({t, at, x, y}) => {
  const p = clamp((t - at) / 0.5);
  if (p <= 0) return null;
  const cells = Array.from({length: 7});
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const travelled = [true, true, true, true, false, false, false];
  return (
    <svg style={{position: 'absolute', left: x - 400, top: y - 150, overflow: 'visible', transform: `scale(${p})`, transformOrigin: '400px 150px'}} width={800} height={300}>
      <rect x={10} y={10} width={780} height={280} fill="#fff" stroke="#111" strokeWidth={10} rx={24} />
      <line x1={10} y1={80} x2={790} y2={80} stroke="#111" strokeWidth={8} />
      <text x={400} y={60} textAnchor="middle" fontFamily="Arial Rounded MT Bold" fontWeight="900" fontSize={46} fill="#111">A WEEK</text>
      {cells.map((_, i) => {
        const cx = 50 + i * 105;
        return (
          <g key={i}>
            <rect x={cx} y={110} width={90} height={150} rx={14} fill={travelled[i] ? '#ffb3a8' : '#dbe8ff'} stroke="#111" strokeWidth={6} />
            <text x={cx + 45} y={150} textAnchor="middle" fontFamily="Arial Rounded MT Bold" fontWeight="900" fontSize={34} fill="#111">{labels[i]}</text>
            {travelled[i] ? <text x={cx + 45} y={220} textAnchor="middle" fontSize={48}>✈</text> : null}
          </g>
        );
      })}
    </svg>
  );
};
