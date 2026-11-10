import {cancelRender, continueRender, delayRender} from 'remotion';
import latin800 from '@fontsource/nunito/files/nunito-latin-800-normal.woff2';
import latinExt800 from '@fontsource/nunito/files/nunito-latin-ext-800-normal.woff2';

/**
 * The one text font: Nunito ExtraBold (SIL OFL 1.1, from the @fontsource/nunito package), bundled with the video so
 * every machine renders the same letters. Used by subtitles and on-screen labels.
 */
export const FONT_FAMILY = "Nunito, 'Arial Rounded MT Bold', Arial, sans-serif";
export const FONT_WEIGHT = 800;

const faces: [string, string][] = [
  [latin800, 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  [latinExt800, 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
];

// Frames are not captured until the font is ready, so no frame ever shows a fallback font.
if (typeof document !== 'undefined' && typeof FontFace !== 'undefined') {
  const handle = delayRender('Loading the Nunito font');
  Promise.all(
    faces.map(([url, unicodeRange]) => {
      const face = new FontFace('Nunito', `url(${url}) format('woff2')`, {weight: String(FONT_WEIGHT), unicodeRange});
      // FontFaceSet.add is typed in TypeScript's DOM.Iterable lib only
      return face.load().then((f) => (document.fonts as unknown as {add: (x: FontFace) => void}).add(f));
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => cancelRender(err));
}
