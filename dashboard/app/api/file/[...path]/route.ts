import fs from 'node:fs';
import {Readable} from 'node:stream';
import {servablePath} from '@/lib/data';

export const dynamic = 'force-dynamic';

const TYPES: Record<string, string> = {png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', mp4: 'video/mp4'};

/** Serves QA pictures and local renders from the repository (see servablePath). Supports Range for the player. */
export async function GET(req: Request, ctx: {params: Promise<{path: string[]}>}) {
  const {path: parts} = await ctx.params;
  const abs = servablePath(parts.map(decodeURIComponent).join('/'));
  if (!abs) return new Response('not found', {status: 404});
  const size = fs.statSync(abs).size;
  const type = TYPES[abs.split('.').pop()!.toLowerCase()] ?? 'application/octet-stream';
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '');
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) return new Response(null, {status: 416, headers: {'Content-Range': `bytes */${size}`}});
    const stream = Readable.toWeb(fs.createReadStream(abs, {start, end})) as ReadableStream;
    return new Response(stream, {status: 206, headers: {'Content-Type': type, 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes'}});
  }
  const stream = Readable.toWeb(fs.createReadStream(abs)) as ReadableStream;
  return new Response(stream, {headers: {'Content-Type': type, 'Content-Length': String(size), 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache'}});
}
