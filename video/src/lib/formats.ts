export const FPS = 60;

/**
 * The formats (Part 7). Compositions are authored at width x height and rendered at `scale` (4K).
 * Rule: anything over one minute is landscape. A Short is 9:16 and 20-30 s; every longer video is `long-horizontal`
 * (16:9, 1:00-3:30). YouTube treats only square or vertical uploads of 3:00 or less as Shorts, so a 16:9 video is a
 * normal video at any length. `long-vertical` is retired: it stays only so videos made before this rule still build.
 * `subtitles` = burned-in subtitles on by default (lib/subtitles.tsx).
 */
export const FORMATS = {
  short: {width: 1080, height: 1920, scale: 2, aspect: '9:16', minSeconds: 20, maxSeconds: 30, subtitles: false},
  'long-horizontal': {width: 1920, height: 1080, scale: 2, aspect: '16:9', minSeconds: 60, maxSeconds: 210, subtitles: true},
  'long-vertical': {width: 1080, height: 1920, scale: 2, aspect: '9:16', minSeconds: 60, maxSeconds: 179.5, subtitles: true},
} as const;

export type Format = keyof typeof FORMATS;

export const isVertical = (f: Format) => FORMATS[f].height > FORMATS[f].width;

/**
 * Where faces and payoffs must stay. Vertical: the middle 70 % (the Shorts UI covers top, bottom and the right edge).
 * Horizontal: 5 % title-safe margin; compose on thirds. With subtitles on, faces and payoffs also stay above
 * `subtitleBand(format).top` (feet, ground and props may sit behind the subtitles).
 */
export const safeArea = (f: Format) => {
  const {width: w, height: h} = FORMATS[f];
  if (isVertical(f)) {
    return {x: w * 0.06, y: h * 0.15, w: w * 0.82, h: h * 0.7, thirdsX: [w / 3, (2 * w) / 3], thirdsY: [h / 3, (2 * h) / 3]};
  }
  return {x: w * 0.05, y: h * 0.05, w: w * 0.9, h: h * 0.9, thirdsX: [w / 3, (2 * w) / 3], thirdsY: [h / 3, (2 * h) / 3]};
};

/**
 * Screen-space band the subtitles use (composition px): two rows at most, centred. Horizontal: the bottom of the
 * frame, inside the 5 % margin. Vertical: just above the Shorts title / caption area (the bottom ~20 %).
 */
export const subtitleBand = (f: Format) => {
  const {width: w, height: h} = FORMATS[f];
  const fontSize = isVertical(f) ? Math.round(w * 0.062) : Math.round(h * 0.05);
  const bottom = isVertical(f) ? h * 0.78 : h * 0.935; // baseline edge of the last row
  const rows = 2;
  const lineHeight = 1.18;
  return {
    fontSize,
    lineHeight,
    bottom,
    top: bottom - rows * fontSize * lineHeight,
    maxWidth: isVertical(f) ? w * 0.8 : w * 0.64,
    rowChars: isVertical(f) ? 24 : 40, // what subtitles.py packs into one row
  };
};

/** World units: a layer at depth 1000 with the camera at the centre and z 0 shows 1 world px as 1 screen px. */
export const worldCentre = (f: Format) => ({x: FORMATS[f].width / 2, y: FORMATS[f].height / 2});
