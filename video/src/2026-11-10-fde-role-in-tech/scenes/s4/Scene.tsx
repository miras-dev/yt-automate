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

export const S4: React.FC<{format: Format}> = ({format}) => {
  const t = useT();
  const {width: W, height: H} = FORMATS[format];
  const ground = H * 0.78;

  const cam = addShake(
    camPath(
      [
        {t: 0, x: W / 2, y: H / 2, z: 0},
        {t: T.palantir2009, x: W / 2, y: H / 2, z: 0},
        {t: T.frontline, x: W / 2, y: H / 2, z: 80, ease: easeInOutCubic},
        {t: T.aiBoom, x: W / 2, y: H / 2, z: 80},
        {t: T.aiBoom + 0.5, x: W / 2, y: H / 2, z: -160, ease: easeInOutCubic},
        {t: T.openai24, x: W / 2, y: H / 2, z: -160},
        {t: SCENE_DUR, x: W / 2, y: H / 2, z: -160},
      ],
      t,
    ),
    shake(t, T.aiBoom, 16, 0.5),
  );

  const stage = (() => {
    if (t < T.military) return 'palantir';
    if (t < T.years) return 'military';
    if (t < T.aiBoom) return 'quiet';
    if (t < T.openai24) return 'boom';
    return 'logos';
  })();

  return (
    <AbsoluteFill>
      <Sky top="#efe7f6" bottom="#e2d7f0" />

      <Layer cam={cam} z={DEPTH.character + 50}>
        <GroundBand top={ground + 80} color="#b7a8c8" horizon />
      </Layer>

      {/* Hero in frame changes pose per stage */}
      <Layer cam={cam} z={DEPTH.character}>
        <ContactShadow x={W * 0.3} y={ground + 4} width={220} />
        <Sprite
          s={stage === 'quiet' ? SPRITES.thinking : SPRITES.idle}
          x={W * 0.3}
          y={ground}
          anchor="feet"
          size={0.3}
          scaleY={breathe(t)}
        />
      </Layer>

      {/* Palantir label + 2009 */}
      {stage === 'palantir' ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          <Label t={t} from={0} to={T.military - 0.1} x={W / 2} y={H * 0.18} text="Palantir" size={72} color="#111" bg="#fff" />
          {t >= T.palantir2009 - 0.1 ? (
            <Label t={t} from={T.palantir2009} to={T.military - 0.1} x={W / 2} y={H * 0.3} text="2009" size={96} color="#111" bg="#ffe36b" />
          ) : null}
        </AbsoluteFill>
      ) : null}

      {/* Military-style forward deployment arrow */}
      {stage === 'military' || stage === 'quiet' ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          {t >= T.military - 0.1 && t < T.aiBoom ? (
            <Label t={t} from={T.military} to={T.aiBoom - 0.1} x={W / 2} y={H * 0.16} text="military origin" size={46} color="#555" bg="#fff" />
          ) : null}
          {t >= T.frontline - 0.1 && t < T.aiBoom ? <FrontLineArrow x={W / 2} y={H * 0.4} t={t} at={T.frontline} /> : null}
          {t >= T.years - 0.1 && t < T.aiBoom ? (
            <Label t={t} from={T.years} to={T.aiBoom - 0.1} x={W / 2} y={H * 0.78} text="…crickets for years" size={38} color="#555" bg="#fff" />
          ) : null}
        </AbsoluteFill>
      ) : null}

      {/* AI boom shockwave */}
      {t >= T.aiBoom - 0.1 && t < T.openai24 - 0.4 ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          <AiBoom t={t} at={T.aiBoom} x={W / 2} y={H * 0.45} />
          {t >= T.aiBoom + 0.4 ? (
            <Label t={t} from={T.aiBoom + 0.4} to={T.openai24 - 0.4} x={W / 2} y={H * 0.86} text="AI boom" size={60} color="#e14b3d" bg="#fff5d1" />
          ) : null}
        </AbsoluteFill>
      ) : null}

      {/* Company logos + OpenAI 24 postings */}
      {stage === 'logos' ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          {t >= T.openai24 - 0.1 ? (
            <AbsoluteFill>
              <div
                style={{
                  position: 'absolute',
                  left: W / 2,
                  top: H * 0.28,
                  transform: `translate(-50%, -50%) scale(${popInOut(t, T.openai24 - 0.1, SCENE_DUR, 0.2, 0.15)})`,
                  background: '#111',
                  color: '#fff',
                  padding: '18px 36px',
                  borderRadius: 24,
                  fontFamily: 'Arial Rounded MT Bold, Nunito, Arial, sans-serif',
                  fontWeight: 900,
                  fontSize: 72,
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                OpenAI
                <br />
                <span style={{color: '#ffe36b', fontSize: 110}}>24</span>
                <br />
                <span style={{fontSize: 36}}>FDE postings</span>
              </div>
            </AbsoluteFill>
          ) : null}
          {t >= T.anthropic - 0.1 ? (
            <AbsoluteFill>
              <LogoRow t={t} at={T.anthropic} x={W / 2} y={H * 0.68} />
            </AbsoluteFill>
          ) : null}
        </AbsoluteFill>
      ) : null}

      <Audio src={staticFile(`${SLUG}/${VO_FILE}`)} startFrom={0} />
    </AbsoluteFill>
  );
};

const FrontLineArrow: React.FC<{x: number; y: number; t: number; at: number}> = ({x, y, t, at}) => {
  const p = clamp((t - at) / 0.8);
  if (p <= 0) return null;
  return (
    <svg style={{position: 'absolute', left: x - 320, top: y - 100, overflow: 'visible'}} width={640} height={200}>
      {/* HQ building on left */}
      <rect x={10} y={40} width={110} height={120} fill="#fff" stroke="#111" strokeWidth={8} />
      <polygon points="10,40 65,0 120,40" fill="#fff" stroke="#111" strokeWidth={8} />
      <text x={65} y={100} textAnchor="middle" fontFamily="Arial Rounded MT Bold" fontWeight="900" fontSize={22} fill="#111">HQ</text>
      {/* front line on right */}
      <rect x={520} y={40} width={110} height={120} fill="#ffd3cc" stroke="#111" strokeWidth={8} />
      <text x={575} y={100} textAnchor="middle" fontFamily="Arial Rounded MT Bold" fontWeight="900" fontSize={18} fill="#111">front</text>
      <text x={575} y={125} textAnchor="middle" fontFamily="Arial Rounded MT Bold" fontWeight="900" fontSize={18} fill="#111">line</text>
      {/* arrow across */}
      <line x1={140} y1={100} x2={140 + 360 * p} y2={100} stroke="#111" strokeWidth={14} strokeLinecap="round" />
      {p > 0.95 ? <polygon points={`${140 + 360 * p},86 ${140 + 360 * p + 26},100 ${140 + 360 * p},114`} fill="#111" /> : null}
    </svg>
  );
};

const AiBoom: React.FC<{t: number; at: number; x: number; y: number}> = ({t, at, x, y}) => {
  const p = clamp((t - at) / 0.9);
  if (p <= 0 || p >= 1) return null;
  const rings = 3;
  return (
    <svg style={{position: 'absolute', left: x - 500, top: y - 500, overflow: 'visible'}} width={1000} height={1000}>
      {Array.from({length: rings}).map((_, i) => {
        const pp = clamp(p * 1.3 - i * 0.15);
        if (pp <= 0) return null;
        return <circle key={i} cx={500} cy={500} r={500 * pp} fill="none" stroke="#e14b3d" strokeWidth={12 * (1 - pp)} opacity={0.6 * (1 - pp)} />;
      })}
      <text x={500} y={520} textAnchor="middle" fontFamily="Arial Rounded MT Bold" fontWeight="900" fontSize={200 * clamp(p * 2)} fill="#111">AI</text>
    </svg>
  );
};

const LogoRow: React.FC<{t: number; at: number; x: number; y: number}> = ({t, at, x, y}) => {
  const logos = [
    {name: 'Anthropic', bg: '#d87756', fg: '#fff'},
    {name: 'Google', bg: '#fff', fg: '#4285F4'},
    {name: 'AWS', bg: '#232F3E', fg: '#FF9900'},
    {name: 'Microsoft', bg: '#fff', fg: '#111'},
  ];
  return (
    <>
      {logos.map((l, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = x + (col - 0.5) * 360;
        const cy = y + (row - 0.5) * 140;
        const p = clamp((t - at) / 0.5 - i * 0.12);
        if (p <= 0) return null;
        return (
          <div
            key={l.name}
            style={{
              position: 'absolute',
              left: cx,
              top: cy,
              transform: `translate(-50%, -50%) scale(${p})`,
              background: l.bg,
              color: l.fg,
              border: '6px solid #111',
              borderRadius: 18,
              padding: '14px 28px',
              fontFamily: 'Arial Rounded MT Bold, Nunito, Arial, sans-serif',
              fontWeight: 900,
              fontSize: 44,
              whiteSpace: 'nowrap',
            }}
          >
            {l.name}
          </div>
        );
      })}
    </>
  );
};
