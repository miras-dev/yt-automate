import React from 'react';
import {Img, staticFile} from 'remotion';

/** Measurements written by prep.py into video/src/<slug>/sprites.ts (all in trimmed-sprite pixels). */
export type SpriteInfo = {
  file: string;
  src?: string; // "<slug>/<file>" under video/public
  kind: string; // 'char' | 'obj'
  framing: string; // 'full' | 'waist' | 'close' | 'prop' | 'set'
  w: number;
  h: number;
  scale: number; // brings the head radius to the reference radius
  head?: {x: number; y: number; r: number};
  feet?: {x: number; y: number};
  grips: Record<string, readonly number[]>;
  maxRow?: number;
  align?: {to: string; matrix: readonly number[]; cc: number};
  profile?: readonly (readonly number[])[];
  opening?: {cx: number; cy: number; rx: number; ry: number};
  trim?: unknown;
  library?: string;
};

export type Anchor = 'feet' | 'head' | 'centre' | 'topLeft' | readonly [number, number];

const anchorPoint = (s: SpriteInfo, anchor: Anchor): readonly [number, number] => {
  if (typeof anchor !== 'string') return anchor;
  if (anchor === 'feet') return s.feet ? [s.feet.x, s.feet.y] : [s.w / 2, s.h];
  if (anchor === 'head') return s.head ? [s.head.x, s.head.y] : [s.w / 2, s.h / 2];
  if (anchor === 'centre') return [s.w / 2, s.h / 2];
  return [0, 0];
};

/**
 * Draw a cut-out so that its anchor (feet, head centre, ...) sits on the world point (x, y).
 * `size` multiplies the normalised scale (s.scale keeps the head the same size in every pose).
 * scaleX / scaleY / rotate are applied ABOUT THE ANCHOR: squash about the feet, lean from the feet.
 * Full-body poses: anchor 'feet' on the shared feet point. Waist-up poses: anchor 'head' on the place where the
 * full-body head is (see headWorld).
 */
export const Sprite: React.FC<{
  s: SpriteInfo;
  x: number;
  y: number;
  anchor?: Anchor;
  size?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: number;
  flip?: boolean;
  style?: React.CSSProperties;
}> = ({s, x, y, anchor = 'feet', size = 1, scaleX = 1, scaleY = 1, rotate = 0, flip = false, style}) => {
  const [ax, ay] = anchorPoint(s, anchor);
  const k = s.scale * size;
  return (
    <Img
      src={staticFile(s.src ?? s.file)}
      style={{
        position: 'absolute',
        left: x - ax,
        top: y - ay,
        width: s.w,
        height: s.h,
        maxWidth: 'none',
        transformOrigin: `${ax}px ${ay}px`,
        transform: `rotate(${rotate}deg) scale(${k * scaleX * (flip ? -1 : 1)}, ${k * scaleY})`,
        ...style,
      }}
    />
  );
};

/** World position of a point of a sprite (sprite px) when the sprite is drawn with <Sprite anchor=...>. */
export const spritePoint = (
  s: SpriteInfo,
  x: number,
  y: number,
  point: readonly number[],
  anchor: Anchor = 'feet',
  size = 1,
  flip = false,
) => {
  const [ax, ay] = anchorPoint(s, anchor);
  const k = s.scale * size;
  return {x: x + (point[0] - ax) * k * (flip ? -1 : 1), y: y + (point[1] - ay) * k};
};

/** Where the head centre of a full-body pose is in the world: put waist-up poses there with anchor 'head'. */
export const headWorld = (s: SpriteInfo, feetX: number, feetY: number, size = 1) =>
  spritePoint(s, feetX, feetY, s.head ? [s.head.x, s.head.y] : [s.w / 2, 0], 'feet', size);

/** Soft contact shadow under a full-body pose (world coords of the feet). */
export const ContactShadow: React.FC<{x: number; y: number; width?: number; squash?: number}> = ({x, y, width = 300, squash = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x - (width * squash) / 2,
      top: y - width * 0.07,
      width: width * squash,
      height: width * 0.14,
      borderRadius: '50%',
      background: 'rgba(72, 54, 42, 0.26)',
      filter: 'blur(3px)',
    }}
  />
);
