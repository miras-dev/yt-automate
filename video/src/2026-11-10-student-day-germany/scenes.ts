import {sceneLayout, type SceneDef} from '../lib';
import {Scene as ZeroEuros, SECONDS as S1} from './scenes/zero-euros/Scene';
import {GAP_AFTER as G1} from './scenes/zero-euros/timing';
import {Scene as TheTicket, SECONDS as S2} from './scenes/the-ticket/Scene';
import {GAP_AFTER as G2} from './scenes/the-ticket/timing';
import {Scene as AcademicQuarter, SECONDS as S3} from './scenes/academic-quarter/Scene';
import {GAP_AFTER as G3} from './scenes/academic-quarter/timing';
import {Scene as MensaAndJob, SECONDS as S4} from './scenes/mensa-and-job/Scene';
import {GAP_AFTER as G4} from './scenes/mensa-and-job/timing';
import {Scene as RentAndPfand, SECONDS as S5} from './scenes/rent-and-pfand/Scene';
import {GAP_AFTER as G5} from './scenes/rent-and-pfand/timing';
import {Scene as RealBill, SECONDS as S6} from './scenes/real-bill/Scene';

/** The six scenes of the day in order (7:00 -> 23:00). Each keeps living through its gap; the joins are whip pans. */
export const SCENES: SceneDef[] = [
  {name: 'zero-euros', seconds: S1, component: ZeroEuros, gapAfter: G1},
  {name: 'the-ticket', seconds: S2, component: TheTicket, gapAfter: G2},
  {name: 'academic-quarter', seconds: S3, component: AcademicQuarter, gapAfter: G3},
  {name: 'mensa-and-job', seconds: S4, component: MensaAndJob, gapAfter: G4},
  {name: 'rent-and-pfand', seconds: S5, component: RentAndPfand, gapAfter: G5},
  {name: 'real-bill', seconds: S6, component: RealBill},
];

export const LAYOUT = sceneLayout(SCENES);
