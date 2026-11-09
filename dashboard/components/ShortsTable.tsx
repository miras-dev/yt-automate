'use client';

import Link from 'next/link';
import {useMemo, useState} from 'react';

export type Row = {
  slug: string; title: string; category: string; status: string; format: string; date: string; duration: string;
  cost: string; views: number; likes: number; thumb: string | null; wide: boolean; avgViewPct: number | null;
};

const fmt = (n: number) => new Intl.NumberFormat('en').format(n);

export function ShortsTable({rows}: {rows: Row[]}) {
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [format, setFormat] = useState('');
  const uniq = (k: 'status' | 'category' | 'format') => [...new Set(rows.map((r) => r[k]))].sort();
  const shown = useMemo(
    () => rows.filter((r) => (!status || r.status === status) && (!category || r.category === category) && (!format || r.format === format)),
    [rows, status, category, format],
  );
  const select = (label: string, value: string, set: (v: string) => void, options: string[]) => (
    <select aria-label={label} value={value} onChange={(e) => set(e.target.value)}>
      <option value="">{label}: all</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
  return (
    <>
      <div className="filters">
        {select('Status', status, setStatus, uniq('status'))}
        {select('Category', category, setCategory, uniq('category'))}
        {select('Format', format, setFormat, uniq('format'))}
        <span className="count">
          {shown.length} of {rows.length}
        </span>
      </div>
      <div className="tablebox">
        <table>
          <thead>
            <tr>
              <th>Video</th>
              <th className="hide-s">Category</th>
              <th>Status</th>
              <th className="hide-s">Date</th>
              <th className="r hide-s">Length</th>
              <th className="r hide-s">Cost</th>
              <th className="r">Views</th>
              <th className="r hide-s">Likes</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.slug}>
                <td>
                  <Link href={`/short/${r.slug}`} className="titlecell">
                    <span className={`thumb${r.wide ? ' wide' : ''}`} style={r.thumb ? {backgroundImage: `url(${r.thumb})`} : undefined} />
                    <span>
                      <span className="t">{r.title}</span>
                      <br />
                      <span className="s">
                        {r.format}
                        {r.avgViewPct !== null ? ` · ${r.avgViewPct}% viewed` : ''}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="hide-s">{r.category}</td>
                <td>
                  <span className={`pill ${r.status}`}>{r.status}</span>
                </td>
                <td className="hide-s num">{r.date}</td>
                <td className="r hide-s num">{r.duration}</td>
                <td className="r hide-s num">{r.cost}</td>
                <td className="r num">{fmt(r.views)}</td>
                <td className="r hide-s num">{fmt(r.likes)}</td>
              </tr>
            ))}
            {shown.length === 0 ? (
              <tr>
                <td colSpan={8} className="muted">
                  Nothing matches these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
