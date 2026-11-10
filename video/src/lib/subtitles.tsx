import React from 'react';
import {AbsoluteFill} from 'remotion';
import {INK} from './effects';
import {FONT_FAMILY, FONT_WEIGHT} from './fonts';
import {FORMATS, subtitleBand, type Format} from './formats';
import {useT} from './scenes';

/**
 * Burned-in subtitles. The cues come from subtitles.json, written by
 * `.claude/skills/cutout-cartoon-shorts/scripts/subtitles.py`: the script's own words (so names and numbers are
 * spelled right) on the voice's word times, cut into short phrases. Times are seconds on the same timeline as the
 * T table they sit next to (inside a scene: scene seconds), so put <Subtitles> where <SoundCues> is, as the LAST child
 * so nothing covers it. Screen space: camera moves and shake never move the subtitles.
 */
export type SubtitleCue = {start: number; end: number; text: string};

export const Subtitles: React.FC<{
  format: Format;
  cues: readonly SubtitleCue[];
  on?: boolean; // default: FORMATS[format].subtitles (long videos on, Shorts off)
  offset?: number; // seconds added to every cue
}> = ({format, cues, on = FORMATS[format].subtitles, offset = 0}) => {
  const t = useT();
  if (!on) return null;
  const cue = cues.find((c) => t >= c.start + offset && t < c.end + offset);
  if (!cue) return null;
  const band = subtitleBand(format);
  const {height: H} = FORMATS[format];
  const stroke = Math.round(band.fontSize * 0.2); // paint-order draws half of it outside the letters
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: H - band.bottom,
          transform: 'translateX(-50%)',
          width: band.maxWidth,
          textAlign: 'center',
          fontFamily: FONT_FAMILY,
          fontWeight: FONT_WEIGHT,
          fontSize: band.fontSize,
          lineHeight: band.lineHeight,
          color: '#fff',
          WebkitTextStroke: `${stroke}px ${INK}`,
          paintOrder: 'stroke fill',
          textWrap: 'balance',
          letterSpacing: '0.01em',
        }}
      >
        {cue.text}
      </div>
    </AbsoluteFill>
  );
};
