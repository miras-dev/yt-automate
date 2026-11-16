import {sceneLayout, type SceneDef} from '../lib';
import {Scene as DirtyJob, SECONDS as S1} from './scenes/dirty-job/Scene';
import {GAP_AFTER as G1} from './scenes/dirty-job/timing';
import {Scene as TheLaw, SECONDS as S2} from './scenes/the-law/Scene';
import {GAP_AFTER as G2} from './scenes/the-law/timing';
import {Scene as NewRules, SECONDS as S3} from './scenes/new-rules/Scene';
import {GAP_AFTER as G3} from './scenes/new-rules/timing';
import {Scene as TheStamp, SECONDS as S4} from './scenes/the-stamp/Scene';
import {GAP_AFTER as G4} from './scenes/the-stamp/timing';
import {Scene as ThePromise, SECONDS as S5} from './scenes/the-promise/Scene';

/** The five scenes in order. Each scene keeps living through its gap; the joins are whip pans. */
export const SCENES: SceneDef[] = [
  {name: 'dirty-job', seconds: S1, component: DirtyJob, gapAfter: G1},
  {name: 'the-law', seconds: S2, component: TheLaw, gapAfter: G2},
  {name: 'new-rules', seconds: S3, component: NewRules, gapAfter: G3},
  {name: 'the-stamp', seconds: S4, component: TheStamp, gapAfter: G4},
  {name: 'the-promise', seconds: S5, component: ThePromise},
];

export const LAYOUT = sceneLayout(SCENES);
