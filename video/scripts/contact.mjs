#!/usr/bin/env node
// Contact sheet: one still per beat in one grid, plus frame 0 as the thumbnail.
//   node scripts/contact.mjs <CompId> --slug SLUG --times 0,2.05,3.7,4.8 [--name contact] [--cols 4] [--gl ...]
//   --times all-T reads every value of T from video/src/<slug>/timing.ts (plus frame 0 and the last frame)
// Writes shorts/<slug>/qa/<name>.png and shorts/<slug>/qa/frame0.png (stills at scale 0.5).
import {renderStill} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ROOT, VIDEO_DIR, chromium, getBundle, getComposition, parseArgs} from './common.mjs';

const args = parseArgs(process.argv.slice(2));
const id = args._[0];
if (!id || !args.slug) {
  console.error('usage: node scripts/contact.mjs <CompId> --slug SLUG --times 0,2.05,3.7|all-T [--name contact] [--cols 4] [--out DIR]');
  process.exit(2);
}
const serveUrl = await getBundle(args);
const composition = await getComposition(serveUrl, id, args);
const fps = composition.fps;
const lastFrame = composition.durationInFrames - 1;

let times;
if (!args.times || args.times === 'all-T') {
  const ts = path.join(VIDEO_DIR, 'src', args.slug, 'timing.ts');
  const src = fs.existsSync(ts) ? fs.readFileSync(ts, 'utf8').replace(/\/\/.*/g, '') : '';
  const m = src.match(/export\s+const\s+T\s*=\s*\{([\s\S]*?)\}/);
  times = m ? [...m[1].matchAll(/[A-Za-z_]\w*\s*:\s*([\d.]+)/g)].map((x) => Number(x[1])) : [];
} else {
  times = String(args.times).split(',').map(Number);
}
const frames = [...new Set([0, ...times.map((t) => Math.round(t * fps)), lastFrame])].filter((f) => f >= 0 && f <= lastFrame).sort((a, b) => a - b);

const qa = path.resolve(args.out ?? path.join(ROOT, 'shorts', args.slug, 'qa'));
fs.mkdirSync(qa, {recursive: true});
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'contact-'));
for (const [i, frame] of frames.entries()) {
  await renderStill({composition, serveUrl, frame, scale: 0.5, imageFormat: 'png', output: path.join(tmp, `f${String(i).padStart(3, '0')}.png`), ...chromium(args)});
  process.stderr.write(`still ${i + 1}/${frames.length} (frame ${frame}, ${(frame / fps).toFixed(2)} s)\n`);
}
fs.copyFileSync(path.join(tmp, 'f000.png'), path.join(qa, 'frame0.png'));
const cols = Math.min(Number(args.cols ?? (composition.width > composition.height ? 3 : 5)), frames.length);
const rows = Math.ceil(frames.length / cols);
const name = args.name ?? 'contact';
const cell = composition.width > composition.height ? 640 : 360;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(tmp, 'f%03d.png'), '-vf', `scale=${cell}:-2,tile=${cols}x${rows}:padding=6:margin=6:color=0x202024`, '-frames:v', '1', path.join(qa, `${name}.png`)]);
fs.rmSync(tmp, {recursive: true, force: true});
console.log(JSON.stringify({contact: path.relative(ROOT, path.join(qa, `${name}.png`)), thumb: path.relative(ROOT, path.join(qa, 'frame0.png')), frames, times: frames.map((f) => Number((f / fps).toFixed(3)))}, null, 2));
