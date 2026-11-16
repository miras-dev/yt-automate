import {ShortsTable, type Row} from '@/components/ShortsTable';
import {fmtDuration, fmtNum, fmtUsd, loadIndex, thumbOf, type PartnerProgress} from '@/lib/data';

export const dynamic = 'force-dynamic';

const compact = (n: number | null | undefined) =>
  n === null || n === undefined ? '-' : new Intl.NumberFormat('en', {notation: 'compact', maximumFractionDigits: 1}).format(n);

/** Progress toward the YouTube Partner Program: subscribers plus either Shorts views (90 days) or watch hours (12 months). */
function Partner({p}: {p: PartnerProgress}) {
  const later = new Date() >= new Date('2027-02-01T00:00:00Z');
  const goal = later ? p.targets.from_2027_02_01 : p.targets.now;
  const next = p.targets.from_2027_02_01;
  const rows = [
    {k: 'Subscribers', v: p.subscribers, goal: goal.subscribers,
      note: p.subscribers === null ? 'run youtube_stats.py' : p.channel_updated ? `updated ${p.channel_updated}` : ''},
    {k: 'Shorts views, 90 days', v: p.shorts_views_90d, goal: goal.shorts_views_90d,
      note: p.shorts_views_exact ? '' : 'upper bound: no snapshot from 90 days ago'},
    {k: 'Watch hours, 12 months', v: p.watch_hours_365d, goal: goal.watch_hours_365d,
      note: p.long_videos_without_avg_view_pct
        ? `${p.long_videos_without_avg_view_pct} long video(s) without avg_view_pct are not counted`
        : p.watch_hours_exact ? 'estimate from average % viewed' : 'estimate'},
  ];
  return (
    <>
      <h2>Partner Program</h2>
      <div className="panel bars">
        {rows.map((r) => (
          <div className="bar" key={r.k}>
            <span>{r.k}</span>
            <span className="track"><span className="fill" style={{display: 'block', width: `${Math.min(100, (100 * (r.v ?? 0)) / r.goal)}%`}} /></span>
            <span className="num">{compact(r.v)} / {compact(r.goal)}</span>
          </div>
        ))}
        <p className="muted" style={{margin: '4px 0 0', fontSize: 12.5}}>
          Needed: the subscribers, plus the Shorts views or the watch hours (Shorts views do not count as watch hours).
          {later ? '' : ` From 1 Feb 2027 new applicants need ${compact(next.shorts_views_90d)} Shorts views or ${compact(next.watch_hours_365d)} watch hours.`}
          {rows.filter((r) => r.note).map((r) => ` ${r.k}: ${r.note}.`).join('')}
        </p>
      </div>
    </>
  );
}

export default function Home() {
  const {totals, shorts} = loadIndex();
  const rows: Row[] = shorts.map((s) => ({
    slug: s.slug, title: s.title, category: s.category, status: s.status, format: s.format, date: s.date,
    duration: fmtDuration(s.duration_s), cost: fmtUsd(s.cost_usd), views: s.stats?.views ?? 0, likes: s.stats?.likes ?? 0,
    thumb: thumbOf(s), wide: s.aspect === '16:9', avgViewPct: s.stats?.avg_view_pct ?? null,
  }));

  // views per minute of runtime, per format (published videos only)
  const byFormat = new Map<string, {n: number; views: number; minutes: number}>();
  for (const s of shorts) {
    if (s.status !== 'published') continue;
    const f = byFormat.get(s.format) ?? {n: 0, views: 0, minutes: 0};
    f.n += 1;
    f.views += s.stats?.views ?? 0;
    f.minutes += (s.duration_s ?? 0) / 60;
    byFormat.set(s.format, f);
  }
  const perMinute = [...byFormat.entries()].map(([format, f]) => ({format, n: f.n, vpm: f.minutes ? Math.round(f.views / f.minutes) : 0}));
  const maxVpm = Math.max(1, ...perMinute.map((p) => p.vpm));

  return (
    <main>
      <div className="totals">
        <div className="tile"><div className="k">Videos made</div><div className="v">{fmtNum(totals.count)}</div></div>
        <div className="tile"><div className="k">Total spend</div><div className="v">{totals.spend_usd ? `$${totals.spend_usd.toFixed(2)}` : '$0'}</div></div>
        <div className="tile"><div className="k">Total views</div><div className="v">{fmtNum(totals.views)}</div></div>
        <div className="tile"><div className="k">Average views per published video</div><div className="v">{fmtNum(totals.avg_views)}</div></div>
        <div className="tile"><div className="k">Best category</div><div className="v">{totals.best_category ?? '-'}</div></div>
      </div>

      {shorts.length === 0 ? (
        <div className="empty">
          <b>No videos yet</b>
          Run <code>/new-short</code> in Claude Code to make the first one. It appears here after <code>python scripts/register.py</code>.
        </div>
      ) : (
        <ShortsTable rows={rows} />
      )}

      {totals.ypp ? <Partner p={totals.ypp} /> : null}

      {perMinute.length > 0 ? (
        <>
          <h2>Views per minute of runtime, by format</h2>
          <div className="panel bars">
            {perMinute.map((p) => (
              <div className="bar" key={p.format}>
                <span>{p.format} <span className="muted">({p.n})</span></span>
                <span className="track"><span className="fill" style={{display: 'block', width: `${(100 * p.vpm) / maxVpm}%`}} /></span>
                <span className="num">{fmtNum(p.vpm)}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </main>
  );
}
