import React from 'react';
import {Composition, Folder} from 'remotion';
import {FORMATS, FPS} from './lib/formats';
import {VIDEOS} from './registry';

/** Registers one composition per video (see registry.ts). */
export const Root: React.FC = () => {
  const comp = (v: (typeof VIDEOS)[number]) => (
    <Composition
      key={v.id}
      id={v.id}
      component={v.component}
      width={FORMATS[v.format].width}
      height={FORMATS[v.format].height}
      fps={FPS}
      durationInFrames={Math.max(1, Math.round(v.seconds * FPS))}
      defaultProps={{format: v.format, slug: v.slug, ...(v.props ?? {})}}
    />
  );
  return (
    <>
      {VIDEOS.filter((v) => !v.dev).map(comp)}
      <Folder name="dev">{VIDEOS.filter((v) => v.dev).map(comp)}</Folder>
    </>
  );
};
