import React from 'react';
import {Audio, Sequence, staticFile, useVideoConfig} from 'remotion';

/**
 * One sound cue (video/src/<slug>/cues.json). Times come from the T table only: at = T[key] + dt.
 *   f     file stem in public/<slug>/sfx/ (trimmed, peak-normalised to -1 dBFS)
 *   db    level in dB (whooshes -25..-31, impacts -14..-19, beds -26..-33, a big blast -8..-10 inside a pause)
 *   lead  seconds from the start of the file to the point that lands on the beat (onset of an impact, peak of a
 *         whoosh) - written by export_cues.py --apply from the real-sfx placement
 */
export type Cue = {cue: string; key: string; dt?: number; role?: string; f: string; db: number; lead?: number; ext?: string; anchor?: string | null; len?: number};

export const dbToGain = (db: number) => Math.pow(10, db / 20);

/** Extra dB at time t (seconds) for ducking: e.g. () => 0, or dip under dense lines. */
export type DbAt = (t: number) => number;

/** Plays every cue on its frame. Put it once in the composition (or once per scene, with that scene's T). */
export const SoundCues: React.FC<{slug: string; cues: readonly Cue[]; T: Record<string, number>; dbAt?: DbAt}> = ({slug, cues, T, dbAt}) => {
  const {fps} = useVideoConfig();
  return (
    <>
      {cues.map((c, i) => {
        if (!(c.key in T)) throw new Error(`cue "${c.cue}": T has no key "${c.key}"`);
        const at = T[c.key] + (c.dt ?? 0) - (c.lead ?? 0);
        const from = Math.round(at * fps);
        const skip = from < 0 ? -from : 0; // a file that would start before frame 0 is trimmed instead
        return (
          <Sequence key={`${c.cue}-${i}`} from={Math.max(0, from)} layout="none" name={`sfx ${c.cue}`}>
            <Audio
              src={staticFile(`${slug}/sfx/${c.f}.${c.ext ?? 'wav'}`)}
              startFrom={skip}
              volume={(f) => dbToGain(c.db + (dbAt ? dbAt((Math.max(0, from) + f) / fps) : 0))}
            />
          </Sequence>
        );
      })}
    </>
  );
};

/** The voice take. It starts at `offset` seconds (0.1 s by default) at full level. */
export const Voice: React.FC<{slug: string; file?: string; offset?: number; db?: number}> = ({slug, file = 'vo/take1.mp3', offset = 0.1, db = 0}) => {
  const {fps} = useVideoConfig();
  return (
    <Sequence from={Math.round(offset * fps)} layout="none" name="voice">
      <Audio src={staticFile(`${slug}/${file}`)} volume={dbToGain(db)} />
    </Sequence>
  );
};

/**
 * Music bed for long videos: -30 to -34 dB under the voice, ducked 3-4 dB more on dense lines, raised slightly in
 * scene gaps, faded only at the very end.
 *   dense: [start, end][] in seconds (dense voice lines)   gaps: [start, end][] (scene joins)
 */
export const MusicBed: React.FC<{slug: string; file: string; db?: number; dense?: readonly (readonly [number, number])[]; gaps?: readonly (readonly [number, number])[]; fadeOut?: number; loop?: boolean}> = ({slug, file, db = -32, dense = [], gaps = [], fadeOut = 2.5, loop = true}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const ramp = 0.35; // seconds: level changes are eased, never stepped
  const near = (t: number, ranges: readonly (readonly [number, number])[]) => {
    let k = 0;
    for (const [a, b] of ranges) {
      const inK = Math.min(1, Math.max(0, (t - (a - ramp)) / ramp));
      const outK = Math.min(1, Math.max(0, (b + ramp - t) / ramp));
      k = Math.max(k, Math.min(inK, outK));
    }
    return k;
  };
  return (
    <Audio
      src={staticFile(`${slug}/${file}`)}
      loop={loop}
      volume={(f) => {
        const t = f / fps;
        const end = durationInFrames / fps;
        const fade = Math.min(1, Math.max(0, (end - t) / fadeOut));
        return dbToGain(db - 3.5 * near(t, dense) + 2 * near(t, gaps)) * fade;
      }}
    />
  );
};
