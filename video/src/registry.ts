import type React from 'react';
import type {Format} from './lib/formats';
import {Template, TEMPLATE_SECONDS} from './_template/Template';
import {Main as AirplaneWindows, AIRPLANE_SECONDS} from './2026-11-10-airplane-windows-corners/Main';
import {FdeMain, FDE_SECONDS} from './2026-11-10-fde-role-in-tech/Main';
import {Main as EnvEngineerPay, ENV_PAY_SECONDS} from './2026-11-10-environmental-engineer-pay/Main';
import {Main as StudentDay, STUDENT_DAY_SECONDS} from './2026-11-10-student-day-germany/Main';

/** One entry per video. Add yours at the top: the id is what you pass to scripts/render.mjs. */
export type VideoDef = {
  id: string; // letters, digits and dashes only
  slug: string; // shorts/<slug> and public/<slug>
  format: Format;
  seconds: number; // voice end + 0.5 s (from timing.ts)
  component: React.FC<any>;
  props?: Record<string, unknown>;
  dev?: boolean; // helper compositions, not real videos
};

export const VIDEOS: VideoDef[] = [
  {id: 'student-day-germany', slug: '2026-11-10-student-day-germany', format: 'long-horizontal', seconds: STUDENT_DAY_SECONDS, component: StudentDay},
  {id: 'environmental-engineer-pay', slug: '2026-11-10-environmental-engineer-pay', format: 'long-vertical', seconds: ENV_PAY_SECONDS, component: EnvEngineerPay},
  {id: 'fde-role-in-tech', slug: '2026-11-10-fde-role-in-tech', format: 'long-vertical', seconds: FDE_SECONDS, component: FdeMain},
  {id: 'airplane-windows-corners', slug: '2026-11-10-airplane-windows-corners', format: 'short', seconds: AIRPLANE_SECONDS, component: AirplaneWindows},

  // Code-only test scene (no pictures, no sound): proves the helpers work in every format. Copy it to start a video.
  {id: 'template-short', slug: '_template', format: 'short', seconds: TEMPLATE_SECONDS, component: Template, dev: true},
  {id: 'template-long-vertical', slug: '_template', format: 'long-vertical', seconds: TEMPLATE_SECONDS, component: Template, dev: true},
  {id: 'template-long-horizontal', slug: '_template', format: 'long-horizontal', seconds: TEMPLATE_SECONDS, component: Template, dev: true},
];
