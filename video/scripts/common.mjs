// Shared by render.mjs and contact.mjs: bundle once to a fixed folder, pick the composition, find a browser.
import {bundle} from '@remotion/bundler';
import {selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const VIDEO_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = path.resolve(VIDEO_DIR, '..');
export const BUILD_DIR = path.join(VIDEO_DIR, 'build');

export const parseArgs = (argv) => {
  const out = {_: []};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) out[k] = v;
      else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) out[k] = argv[++i];
      else out[k] = true;
    } else out._.push(a);
  }
  return out;
};

/** Bundle src/index.ts into video/build (reused with --no-bundle while only props / nothing changed). */
export const getBundle = async (args) => {
  if (args['no-bundle'] && fs.existsSync(path.join(BUILD_DIR, 'index.html'))) return BUILD_DIR;
  process.stderr.write('bundling...\n');
  return bundle({entryPoint: path.join(VIDEO_DIR, 'src', 'index.ts'), outDir: BUILD_DIR, publicDir: path.join(VIDEO_DIR, 'public')});
};

/** GPU by default (--gl=angle). On a machine without a GPU pass --gl=swangle (software, slow). */
export const chromium = (args) => ({
  chromiumOptions: {gl: args.gl ?? process.env.REMOTION_GL ?? 'angle'},
  browserExecutable: args.browser ?? process.env.REMOTION_BROWSER ?? undefined,
});

export const getComposition = async (serveUrl, id, args) => selectComposition({serveUrl, id, ...chromium(args)});

export const ffprobe = (file) =>
  JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], {encoding: 'utf8'}));
