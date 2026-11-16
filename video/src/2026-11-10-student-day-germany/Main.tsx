import React from 'react';
import {AbsoluteFill} from 'remotion';
import {MusicBed, Scenes, SoundCues, type Cue, type Format} from '../lib';
import w1 from '../../public/2026-11-10-student-day-germany/vo/scene-1.words.json';
import w2 from '../../public/2026-11-10-student-day-germany/vo/scene-2.words.json';
import w3 from '../../public/2026-11-10-student-day-germany/vo/scene-3.words.json';
import w4 from '../../public/2026-11-10-student-day-germany/vo/scene-4.words.json';
import w5 from '../../public/2026-11-10-student-day-germany/vo/scene-5.words.json';
import w6 from '../../public/2026-11-10-student-day-germany/vo/scene-6.words.json';
import joinCues from './cues.json';
import {SLUG} from './kit';
import {LAYOUT, SCENES} from './scenes';
import {T as JOINS} from './timing';

export const STUDENT_DAY_SECONDS = LAYOUT.total;

/** Continuous speech (words closer than 0.35 s), as [start, end] on the full timeline: the music ducks there. */
const denseRanges = (() => {
  const out: [number, number][] = [];
  [w1, w2, w3, w4, w5, w6].forEach((w, i) => {
    const off = LAYOUT.starts[i];
    let a = -1;
    let b = -1;
    for (const x of w.words) {
      if (a < 0) {
        a = x.start;
        b = x.end;
      } else if (x.start - b < 0.35) b = x.end;
      else {
        if (b - a > 1) out.push([off + a, off + b]);
        a = x.start;
        b = x.end;
      }
    }
    if (a >= 0 && b - a > 1) out.push([off + a, off + b]);
  });
  return out;
})();
const gapRanges = LAYOUT.joins.map((j) => [j - 0.45, j + 0.25] as [number, number]);

/**
 * "A day as a student in Germany" - long-horizontal (16:9, past 3:00), six scenes in a <Series> (lib/scenes.tsx).
 * Each scene plays its own voice take and sound cues; the music bed and the whip whooshes at the joins run over the
 * whole film. Music: "Blue Sky" by Sergmusic (CC0), looped twice on its own 28-bar phrase (84.96 s -> 37.64 s) so its
 * natural ending lands on the last frame; it starts as the student lands out of bed (3.93 s of silence in the file),
 * normalised to -20 LUFS, played 13 dB down, 3.5 dB lower on continuous speech, 2 dB up in the joins.
 */
export const Main: React.FC<{format: Format; slug: string}> = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Scenes scenes={SCENES} />
    <MusicBed slug={SLUG} file="sfx/music_bed.wav" db={-13} dense={denseRanges} gaps={gapRanges} fadeOut={1.2} loop={false} />
    <SoundCues slug={SLUG} cues={joinCues as Cue[]} T={JOINS} />
  </AbsoluteFill>
);
