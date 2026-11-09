import fs from 'node:fs';
import path from 'node:path';

/** Repository root: the dashboard is started from dashboard/, so the repo is one level up. */
export const ROOT = process.env.SHORTS_FACTORY_ROOT ? path.resolve(process.env.SHORTS_FACTORY_ROOT) : path.resolve(process.cwd(), '..');

export type Snapshot = {date: string; views?: number; likes?: number; comments?: number; avg_view_pct?: number | null};

export type Short = {
  slug: string;
  title: string;
  topic: string;
  category: string;
  status: string;
  format: string;
  aspect: string;
  date: string;
  duration_s: number | null;
  word_count: number | null;
  cost_usd: number;
  voice: {name: string; id: string; credits: number};
  images: {model: string; count: number; est_usd: number};
  sounds: {cue?: string; source?: string; license?: string; title?: string}[];
  scenes?: {count?: number; durations?: number[]};
  files: Record<string, string>;
  youtube: {url: string; video_id: string; published: string};
  stats: {views: number; likes: number; comments: number; avg_view_pct: number | null; updated: string};
  stats_history: Snapshot[];
  has: Record<string, boolean>;
};

export type Index = {
  generated: string;
  totals: {count: number; published: number; spend_usd: number; views: number; avg_views: number; best_category: string | null};
  shorts: Short[];
};

const EMPTY: Index = {generated: '', totals: {count: 0, published: 0, spend_usd: 0, views: 0, avg_views: 0, best_category: null}, shorts: []};

const readJson = <T,>(file: string, fallback: T): T => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
};

/** data/shorts.json, written by scripts/register.py. Missing or broken file = empty list. */
export const loadIndex = (): Index => {
  const d = readJson<Partial<Index>>(path.join(ROOT, 'data', 'shorts.json'), EMPTY);
  return {generated: d.generated ?? '', totals: {...EMPTY.totals, ...(d.totals ?? {})}, shorts: Array.isArray(d.shorts) ? d.shorts : []};
};

export type Topic = {slug: string; topic: string; category: string; date: string};
export const loadTopics = (): Topic[] => {
  const t = readJson<Topic[]>(path.join(ROOT, 'data', 'topics.json'), []);
  return Array.isArray(t) ? t : [];
};

const SLUG = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** A text file of one Short (script.md, sources.md, ...). Returns null when it does not exist. */
export const readShortFile = (slug: string, name: string): string | null => {
  if (!SLUG.test(slug) || !/^[A-Za-z0-9._-]+$/.test(name)) return null;
  try {
    return fs.readFileSync(path.join(ROOT, 'shorts', slug, name), 'utf8');
  } catch {
    return null;
  }
};

export const listQa = (slug: string): string[] => {
  if (!SLUG.test(slug)) return [];
  try {
    return fs.readdirSync(path.join(ROOT, 'shorts', slug, 'qa')).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
  } catch {
    return [];
  }
};

/** Only these repository files may be served to the browser: QA pictures of a Short and local renders. */
export const servablePath = (rel: string): string | null => {
  const clean = path.posix.normalize(rel.replace(/\\/g, '/'));
  if (clean.startsWith('..') || path.isAbsolute(clean)) return null;
  const ok = /^shorts\/[A-Za-z0-9][A-Za-z0-9._-]*\/qa\/[A-Za-z0-9._-]+\.(png|jpe?g)$/i.test(clean) || /^out\/[A-Za-z0-9._-]+\.(mp4|png|jpe?g)$/i.test(clean);
  if (!ok) return null;
  const abs = path.join(ROOT, clean);
  return fs.existsSync(abs) ? abs : null;
};

export const fileUrl = (rel: string) => `/api/file/${rel.split('/').map(encodeURIComponent).join('/')}`;

export const thumbOf = (s: Short): string | null => {
  for (const rel of [s.files?.thumb, s.files?.thumbnail, s.files?.contact]) {
    if (rel && servablePath(rel)) return fileUrl(rel);
  }
  return null;
};

export const fmtDuration = (s: number | null | undefined) => {
  if (!s) return '-';
  const m = Math.floor(s / 60);
  const r = Math.round(s - m * 60);
  return m ? `${m}:${String(r).padStart(2, '0')}` : `${s.toFixed(1)} s`;
};
export const fmtNum = (n: number | null | undefined) => (n === null || n === undefined ? '-' : new Intl.NumberFormat('en').format(n));
export const fmtUsd = (n: number | null | undefined) => (n ? `$${n.toFixed(2)}` : '-');
