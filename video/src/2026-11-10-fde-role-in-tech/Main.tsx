import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {MusicBed, Scenes, type SceneDef} from '../lib';
import {dbToGain} from '../lib/sound';
import {S1} from './scenes/s1/Scene';
import {DURATION as S1_DUR} from './scenes/s1/timing';
import {S2} from './scenes/s2/Scene';
import {DURATION as S2_DUR} from './scenes/s2/timing';
import {S3} from './scenes/s3/Scene';
import {DURATION as S3_DUR} from './scenes/s3/timing';
import {S4} from './scenes/s4/Scene';
import {DURATION as S4_DUR} from './scenes/s4/timing';
import {S5} from './scenes/s5/Scene';
import {DURATION as S5_DUR} from './scenes/s5/timing';
import type {Format} from '../lib/formats';

const SLUG = '2026-11-10-fde-role-in-tech';
const SCENE_GAP = 0.3;

export const SCENES: SceneDef[] = [
  {name: 's1-enter', seconds: S1_DUR, component: S1, gapAfter: SCENE_GAP},
  {name: 's2-what-they-do', seconds: S2_DUR, component: S2, gapAfter: SCENE_GAP},
  {name: 's3-why-different', seconds: S3_DUR, component: S3, gapAfter: SCENE_GAP},
  {name: 's4-who-hires', seconds: S4_DUR, component: S4, gapAfter: SCENE_GAP},
  {name: 's5-the-deal', seconds: S5_DUR, component: S5},
];

export const FDE_SECONDS =
  SCENES.reduce((a, s, i) => a + s.seconds + (i < SCENES.length - 1 ? (s.gapAfter ?? SCENE_GAP) : 0), 0);

/** Scene boundaries on the global timeline (for ducking / gap lift on the music bed). */
const sceneStarts = (() => {
  let t = 0;
  return SCENES.map((s, i) => {
    const at = t;
    t += s.seconds + (i < SCENES.length - 1 ? (s.gapAfter ?? SCENE_GAP) : 0);
    return {name: s.name, start: at, end: at + s.seconds};
  });
})();

// mark the gap between scenes so the bed rises slightly there
const gapRanges: [number, number][] = sceneStarts.slice(0, -1).map((s, i) => [s.end, sceneStarts[i + 1].start]);
// mark the whole voiced stretch of each scene as "dense": the bed ducks slightly under the voice
const denseRanges: [number, number][] = sceneStarts.map((s) => [s.start + 0.2, s.end - 0.4]);

/** A small whoosh on each scene join so the cut has a hit. */
const FPS = 60;
const sceneCues = sceneStarts.slice(1).map((s) => ({t: Math.max(0, s.start - 0.08), file: 'whoosh', db: -22}));
// a small pop under the first word of each scene (right when the scene starts)
const scenePops = sceneStarts.map((s) => ({t: s.start + 0.05, file: 'pop', db: -24}));
// final chime at the last payoff
const finalChime = {t: sceneStarts[sceneStarts.length - 1].start + 22, file: 'chime', db: -20};

export const FdeMain: React.FC<{format: Format}> = ({format}) => (
  <AbsoluteFill>
    <MusicBed slug={SLUG} file="sfx/music_bed.wav" db={-32} dense={denseRanges} gaps={gapRanges} fadeOut={2.5} />
    <Scenes scenes={SCENES} shared={{format}} />
    {[...sceneCues, ...scenePops, finalChime].map((c, i) => (
      <Sequence key={i} from={Math.round(c.t * FPS)} layout="none" name={`sfx ${c.file}`}>
        <Audio src={staticFile(`${SLUG}/sfx/${c.file}.wav`)} volume={dbToGain(c.db)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
