import React from 'react';
import {Series, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Scene mode (2-3 minute videos). One component per scene in video/src/<slug>/scenes/, each with its own timing.ts
 * (times relative to the scene start), its own voice take and its own camera plan. Scenes are joined with a
 * 0.25-0.4 s gap; the joins are where cuts go (hard cut, or a quick whip pan with a whoosh). No cross-fades.
 */
export type SceneDef = {name: string; seconds: number; component: React.FC<any>; gapAfter?: number; props?: Record<string, unknown>};

/** Start time of every scene on the full timeline, and the total length (seconds). */
export const sceneLayout = (scenes: readonly SceneDef[], defaultGap = 0.3) => {
  let t = 0;
  const starts = scenes.map((s, i) => {
    const at = t;
    t += s.seconds + (i < scenes.length - 1 ? (s.gapAfter ?? defaultGap) : 0);
    return at;
  });
  return {starts, total: t, joins: starts.slice(1)};
};

export const Scenes: React.FC<{scenes: readonly SceneDef[]; defaultGap?: number; shared?: Record<string, unknown>}> = ({scenes, defaultGap = 0.3, shared}) => {
  const {fps} = useVideoConfig();
  return (
    <Series>
      {scenes.map((s, i) => {
        const gap = i < scenes.length - 1 ? (s.gapAfter ?? defaultGap) : 0;
        // the gap belongs to the scene before it: the scene keeps living (breathing, idle) until the cut
        const frames = Math.round((s.seconds + gap) * fps);
        const C = s.component;
        return (
          <Series.Sequence key={s.name} durationInFrames={frames} name={s.name}>
            <C {...shared} {...s.props} />
          </Series.Sequence>
        );
      })}
    </Series>
  );
};

/** Seconds since the start of the current scene (or of the composition). Use this instead of the frame number. */
export const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return frame / fps;
};

/**
 * Whip pan for a scene join: an x offset (world px) to add to the camera. `out` whips away at the end of a scene
 * (the last `dur` seconds), `in` arrives at the start of the next one. Pair it with a whoosh cue on the join.
 */
export const whip = (t: number, sceneSeconds: number, dir: 'in' | 'out', dur = 0.16, distance = 2600) => {
  if (dir === 'out') {
    const p = Math.min(1, Math.max(0, (t - (sceneSeconds - dur)) / dur));
    return distance * p * p * p;
  }
  const p = Math.min(1, Math.max(0, t / dur));
  return -distance * Math.pow(1 - p, 3);
};
