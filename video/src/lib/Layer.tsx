import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {F, type Cam} from './camera';

/**
 * One flat layer of the 2.5D multiplane world at depth z. Children are positioned in WORLD pixels.
 * Layer scale k = F / (z - cam.z). With the camera at the world centre and cam.z = 0, a layer at depth 1000 shows
 * 1 world px as 1 screen px. Layers closer than minDepth to the camera are hidden (flying past the character).
 */
export const Layer: React.FC<{cam: Cam; z: number; blur?: number; minDepth?: number; children: React.ReactNode}> = ({
  cam,
  z,
  blur = 0,
  minDepth = 300,
  children,
}) => {
  const {width, height} = useVideoConfig();
  const d = z - cam.z;
  if (d < minDepth) return null;
  const k = F / d;
  return (
    <AbsoluteFill style={{filter: blur ? `blur(${blur}px)` : undefined}}>
      <div
        style={{
          position: 'absolute',
          transformOrigin: '0 0',
          transform: `translate(${width / 2}px, ${height / 2}px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** Screen-space sky: a vertical gradient behind every layer (it does not move with the camera). */
export const Sky: React.FC<{top: string; bottom: string; children?: React.ReactNode}> = ({top, bottom, children}) => (
  <AbsoluteFill style={{background: `linear-gradient(${top}, ${bottom})`}}>{children}</AbsoluteFill>
);

/**
 * A flat ground band in world space: from y = top downwards, very wide. Only the FAR band gets the black horizon
 * line; the far band should cover the base of the set piece.
 */
export const GroundBand: React.FC<{top: number; color: string; horizon?: boolean; outline?: number}> = ({
  top,
  color,
  horizon = false,
  outline = 7,
}) => (
  <div
    style={{
      position: 'absolute',
      left: -20000,
      width: 40000,
      top,
      height: 20000,
      background: color,
      borderTop: horizon ? `${outline}px solid #111` : undefined,
    }}
  />
);
