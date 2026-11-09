import Link from 'next/link';
import {loadIndex, loadTopics} from '@/lib/data';

export const dynamic = 'force-dynamic';

export default function Topics() {
  const topics = loadTopics().slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const made = new Set(loadIndex().shorts.map((s) => s.slug));
  const cats = new Map<string, typeof topics>();
  for (const t of topics) cats.set(t.category, [...(cats.get(t.category) ?? []), t]);
  const max = Math.max(1, ...[...cats.values()].map((v) => v.length));
  const recent = topics.slice(0, 3).map((t) => t.category);

  return (
    <main>
      <h1>Topics</h1>
      <p className="muted" style={{marginTop: 0}}>Every topic used so far, so ideas never repeat. A new video picks a category that is not among the last three.</p>
      {topics.length === 0 ? (
        <div className="empty"><b>No topics yet</b>The script step adds each topic to <code>data/topics.json</code>.</div>
      ) : (
        <>
          <h2>Rotation</h2>
          <div className="panel bars">
            {[...cats.entries()].sort((a, b) => b[1].length - a[1].length).map(([c, list]) => (
              <div className="bar" key={c}>
                <span>{c}{recent.includes(c) ? <span className="muted"> · recent</span> : null}</span>
                <span className="track"><span className="fill" style={{display: 'block', width: `${(100 * list.length) / max}%`}} /></span>
                <span className="num">{list.length}</span>
              </div>
            ))}
          </div>
          {[...cats.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([c, list]) => (
            <section key={c}>
              <h2>{c}</h2>
              <div className="tablebox">
                <table>
                  <tbody>
                    {list.map((t) => (
                      <tr key={t.slug}>
                        <td className="num muted" style={{width: 110}}>{t.date}</td>
                        <td>{made.has(t.slug) ? <Link href={`/short/${t.slug}`}>{t.topic}</Link> : t.topic}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </>
      )}
    </main>
  );
}
