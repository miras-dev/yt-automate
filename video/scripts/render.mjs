#!/usr/bin/env node
// Render one composition and verify the file.
//   node scripts/render.mjs <CompId> [--slug SLUG] [--preview] [--out FILE] [--frames 0-299] [--gl angle|swangle]
//                                    [--no-bundle] [--concurrency N] [--browser /path/to/chrome]
// Final: scale 2 (4K), PNG frames, H.264 crf 16, yuv420p -> ../out/<slug>-4K.mp4
// --preview: scale 0.5, JPEG frames, crf 23 -> ../out/<slug>-preview.mp4 (for the pop scan and the mix check)
// Prints a JSON report; exit code 1 if size, fps, frame count or audio length are wrong.
import {renderMedia} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, chromium, ffprobe, getBundle, getComposition, parseArgs} from './common.mjs';

const args = parseArgs(process.argv.slice(2));
const id = args._[0];
if (!id) {
  console.error('usage: node scripts/render.mjs <CompId> [--slug SLUG] [--preview] [--out FILE] [--frames A-B] [--gl angle|swangle]');
  process.exit(2);
}
const preview = Boolean(args.preview);
const serveUrl = await getBundle(args);
const composition = await getComposition(serveUrl, id, args);
const slug = args.slug ?? composition.defaultProps?.slug ?? id;
const scale = args.scale ? Number(args.scale) : preview ? 0.5 : 2;
const out = path.resolve(args.out ?? path.join(ROOT, 'out', `${slug}-${preview ? 'preview' : '4K'}.mp4`));
fs.mkdirSync(path.dirname(out), {recursive: true});
const frameRange = args.frames ? String(args.frames).split('-').map(Number) : null;

const started = Date.now();
let last = -1;
await renderMedia({
  composition,
  serveUrl,
  codec: 'h264',
  outputLocation: out,
  scale,
  imageFormat: preview ? 'jpeg' : 'png',
  crf: preview ? 23 : 16,
  pixelFormat: 'yuv420p',
  frameRange,
  concurrency: args.concurrency ? Number(args.concurrency) : null,
  ...chromium(args),
  onProgress: ({progress}) => {
    const pct = Math.floor(progress * 20) * 5;
    if (pct !== last) {
      last = pct;
      process.stderr.write(`render ${pct}%\n`);
    }
  },
});

// verify
const info = ffprobe(out);
const v = info.streams.find((s) => s.codec_type === 'video');
const a = info.streams.find((s) => s.codec_type === 'audio');
const [num, den] = v.r_frame_rate.split('/').map(Number);
const expectedFrames = frameRange ? frameRange[1] - frameRange[0] + 1 : composition.durationInFrames;
const frames = Number(v.nb_frames);
const vDur = Number(v.duration);
const aDur = a ? Number(a.duration) : 0;
const checks = {
  size: v.width === Math.round(composition.width * scale) && v.height === Math.round(composition.height * scale),
  fps: Math.abs(num / den - composition.fps) < 0.01,
  frames: frames === expectedFrames,
  audio_present: Boolean(a),
  audio_as_long_as_picture: Boolean(a) && Math.abs(aDur - vDur) < 0.1,
};
const report = {
  id, slug, out: path.relative(ROOT, out), preview, width: v.width, height: v.height, fps: num / den, frames,
  expected_frames: expectedFrames, duration_s: Number(vDur.toFixed(3)), audio_s: Number(aDur.toFixed(3)),
  size_mb: Number((fs.statSync(out).size / 1e6).toFixed(1)), render_s: Math.round((Date.now() - started) / 1000), checks,
  ok: Object.values(checks).every(Boolean),
};
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
