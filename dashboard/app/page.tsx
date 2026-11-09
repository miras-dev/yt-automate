import {ShortsTable, type Row} from '@/components/ShortsTable';
import {fmtDuration, fmtNum, fmtUsd, loadIndex, thumbOf} from '@/lib/data';

export const dynamic = 'force-dynamic';

export default function Home() {
  const {totals, shorts} = loadIndex();
  const rows: Row[] = shorts.map((s) => ({
    slug: s.slug, title: s.title, category: s.category, status: s.status, format: s.format, date: s.date,
    duration: fmtDuration(s.duration_s), cost: fmtUsd(s.cost_usd), views: s.stats?.views ?? 0, likes: s.stats?.likes ?? 0,
    thumb: thumbOf(s), wide: s.format === 'long-horizontal', avgViewPct: s.stats?.avg_view_pct ?? null,
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
