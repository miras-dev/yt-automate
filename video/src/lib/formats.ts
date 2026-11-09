export const FPS = 60;

/** The three formats (Part 7). Compositions are authored at width x height and rendered at `scale` (4K). */
export const FORMATS = {
  short: {width: 1080, height: 1920, scale: 2, aspect: '9:16', minSeconds: 20, maxSeconds: 30},
  'long-vertical': {width: 1080, height: 1920, scale: 2, aspect: '9:16', minSeconds: 60, maxSeconds: 179.5},
  'long-horizontal': {width: 1920, height: 1080, scale: 2, aspect: '16:9', minSeconds: 185, maxSeconds: 210},
} as const;

export type Format = keyof typeof FORMATS;

export const isVertical = (f: Format) => FORMATS[f].height > FORMATS[f].width;

/**
 * Where faces and payoffs must stay. Vertical: the middle 70 % (the Shorts UI covers top, bottom and the right edge).
 * Horizontal: 5 % title-safe margin; compose on thirds.
 */
export const safeArea = (f: Format) => {
  const {width: w, height: h} = FORMATS[f];
  if (isVertical(f)) {
    return {x: w * 0.06, y: h * 0.15, w: w * 0.82, h: h * 0.7, thirdsX: [w / 3, (2 * w) / 3], thirdsY: [h / 3, (2 * h) / 3]};
  }
  return {x: w * 0.05, y: h * 0.05, w: w * 0.9, h: h * 0.9, thirdsX: [w / 3, (2 * w) / 3], thirdsY: [h / 3, (2 * h) / 3]};
};

/** World units: a layer at depth 1000 with the camera at the centre and z 0 shows 1 world px as 1 screen px. */
export const worldCentre = (f: Format) => ({x: FORMATS[f].width / 2, y: FORMATS[f].height / 2});
