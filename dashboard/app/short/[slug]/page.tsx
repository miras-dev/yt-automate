import Link from 'next/link';
import {notFound} from 'next/navigation';
import {CopyButton} from '@/components/CopyButton';
import {Markdown} from '@/components/Markdown';
import {fileUrl, fmtDuration, fmtNum, fmtUsd, listQa, loadIndex, readShortFile, servablePath} from '@/lib/data';

export const dynamic = 'force-dynamic';

const Section = ({title, text}: {title: string; text: string | null}) =>
  text ? (
    <>
      <h2>{title}</h2>
      <div className="panel"><Markdown text={text} /></div>
    </>
  ) : null;

export default async function ShortPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const s = loadIndex().shorts.find((x) => x.slug === decodeURIComponent(slug));
  if (!s) notFound();

  const [script, sources, beats, prompts, credits] = ['script.md', 'sources.md', 'beats.md', 'prompts.md', 'credits.txt'].map((f) => readShortFile(s.slug, f));
  const qa = listQa(s.slug).filter((f) => f !== 'frame0.png');
  const render = s.files?.render && servablePath(s.files.render) ? fileUrl(s.files.render) : null;
  const history = s.stats_history ?? [];
  const maxViews = Math.max(1, ...history.map((h) => h.views ?? 0));
  const description = [s.title, '', credits ? `Sound credits:\n${credits.trim()}` : ''].join('\n').trim();

  return (
    <main>
      <p className="muted"><Link href="/">← All videos</Link></p>
      <h1>{s.title}</h1>
      <div className="chips" style={{margin: '8px 0 18px'}}>
        <span className={`pill ${s.status}`}>{s.status}</span>
        <span className="pill">{s.category}</span>
        <span className="pill">{s.format} · {s.aspect}</span>
        <span className="pill num">{s.date}</span>
        {s.youtube?.url ? <a className="pill accent" href={s.youtube.url} target="_blank" rel="noreferrer noopener">Open on YouTube</a> : null}
      </div>

      <div className="grid2">
        <div>
          {render ? (
            <video className="player" src={render} controls preload="metadata" playsInline />
          ) : (
            <div className="empty">
              <b>No render on this computer</b>
              MP4 files live in <code>out/</code> and are not committed.{s.files?.render ? <> Expected: <code>{s.files.render}</code></> : null}
            </div>
          )}
          <Section title="Script" text={script} />
          <Section title="Beat sheet" text={beats} />
          <Section title="Sources" text={sources} />
          {qa.length > 0 ? (
            <>
              <h2>Checks</h2>
              <div className="panel" style={{display: 'grid', gap: 12}}>
                {qa.map((f) => (
                  <figure key={f} style={{margin: 0}}>
                    <img className="sheet" src={fileUrl(`shorts/${s.slug}/qa/${f}`)} alt={f} loading="lazy" />
                    <figcaption className="muted" style={{fontSize: 12.5, marginTop: 4}}>{f}</figcaption>
                  </figure>
                ))}
              </div>
            </>
          ) : null}
          <Section title="Picture prompts" text={prompts} />
        </div>

        <aside>
          <div className="panel">
            <dl className="kv">
              <dt>Length</dt><dd className="num">{fmtDuration(s.duration_s)}</dd>
              <dt>Words</dt><dd className="num">{s.word_count ?? '-'}</dd>
              {s.scenes?.count ? (<><dt>Scenes</dt><dd className="num">{s.scenes.count}</dd></>) : null}
              <dt>Voice</dt><dd>{s.voice?.name || '-'}{s.voice?.credits ? <span className="muted"> · {fmtNum(s.voice.credits)} credits</span> : null}</dd>
              <dt>Pictures</dt><dd>{s.images?.count ?? 0}{s.images?.model ? <span className="muted"> · {s.images.model}</span> : null}</dd>
              <dt>Cost</dt><dd className="num">{fmtUsd(s.cost_usd)}</dd>
              <dt>Sounds</dt><dd>{s.sounds?.length ? s.sounds.map((x) => `${x.cue ?? x.title ?? 'sound'} (${x.license ?? '?'})`).join(', ') : '-'}</dd>
            </dl>
          </div>

          <h2>Results</h2>
          <div className="panel">
            <dl className="kv">
              <dt>Views</dt><dd className="num">{fmtNum(s.stats?.views ?? 0)}</dd>
              <dt>Likes</dt><dd className="num">{fmtNum(s.stats?.likes ?? 0)}</dd>
              <dt>Comments</dt><dd className="num">{fmtNum(s.stats?.comments ?? 0)}</dd>
              <dt>Average viewed</dt><dd className="num">{s.stats?.avg_view_pct !== null && s.stats?.avg_view_pct !== undefined ? `${s.stats.avg_view_pct}%` : '-'}</dd>
              <dt>Updated</dt><dd className="num">{s.stats?.updated || '-'}</dd>
            </dl>
            {history.length > 0 ? (
              <div className="tablebox" style={{marginTop: 12, background: 'transparent'}}>
                <table>
                  <thead><tr><th>Date</th><th className="r">Views</th><th className="r">Likes</th><th className="r">Comments</th></tr></thead>
                  <tbody>
                    {history.slice().reverse().map((h, i) => (
                      <tr key={i}>
                        <td className="num">{h.date}</td>
                        <td className="r num" style={{backgroundImage: `linear-gradient(to left, var(--accent-soft) ${(100 * (h.views ?? 0)) / maxViews}%, transparent 0)`}}>{fmtNum(h.views ?? 0)}</td>
                        <td className="r num">{fmtNum(h.likes ?? 0)}</td>
                        <td className="r num">{fmtNum(h.comments ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted" style={{margin: '10px 0 0', fontSize: 13}}>No history yet. Paste the YouTube URL into meta.json after upload, then run register.py.</p>
            )}
          </div>

          <div className="rowhead">
            <h2>YouTube description</h2>
            {credits ? <CopyButton text={description} label="Copy description" /> : null}
          </div>
          <div className="panel md">
            {credits ? <pre style={{margin: 0}}>{credits.trim()}</pre> : <span className="muted">No credits.txt yet (it is written in the sound step).</span>}
          </div>
        </aside>
      </div>
    </main>
  );
}
