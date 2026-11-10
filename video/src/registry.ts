import type React from 'react';
import type {Format} from './lib/formats';
import {Template, TEMPLATE_SECONDS} from './_template/Template';

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
  // {id: 'why-dont-ships-sink', slug: '2026-11-10-why-dont-ships-sink', format: 'short', seconds: DURATION, component: Main},

  // Code-only test scene (no pictures, no sound): proves the helpers work in both formats (a Short is 9:16, every
  // video over one minute is 16:9 with subtitles). Copy it to start a video.
  {id: 'template-short', slug: '_template', format: 'short', seconds: TEMPLATE_SECONDS, component: Template, dev: true},
  {id: 'template-long-horizontal', slug: '_template', format: 'long-horizontal', seconds: TEMPLATE_SECONDS, component: Template, dev: true},
];
