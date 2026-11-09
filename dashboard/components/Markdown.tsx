import React from 'react';

/** Small Markdown renderer for the repo's own files (script.md, sources.md, beats.md, prompts.md): no HTML passes through. */
const inline = (text: string, key: string): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  const re = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)<>]+)|\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[2]) out.push(<a key={k} href={m[3]} target="_blank" rel="noreferrer noopener">{m[2]}</a>);
    else if (m[4]) out.push(<a key={k} href={m[4]} target="_blank" rel="noreferrer noopener">{m[4]}</a>);
    else if (m[5]) out.push(<strong key={k}>{m[5]}</strong>);
    else if (m[6]) out.push(<code key={k}>{m[6]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export function Markdown({text}: {text: string}) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const k = `b${i}`;
    if (/^```/.test(line)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      blocks.push(<pre key={k}>{buf.join('\n')}</pre>);
    } else if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^#+/)![0].length;
      const body = inline(line.replace(/^#+\s*/, ''), k);
      blocks.push(level <= 2 ? <h3 key={k}>{body}</h3> : <h4 key={k}>{body}</h4>);
      i++;
    } else if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(cells(lines[i++]));
      blocks.push(
        <div className="tablebox" key={k}>
          <table>
            <thead><tr>{head.map((h, j) => <th key={j}>{inline(h, `${k}h${j}`)}</th>)}</tr></thead>
            <tbody>{rows.map((r, a) => <tr key={a}>{r.map((c, j) => <td key={j}>{inline(c, `${k}r${a}c${j}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
    } else if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ''));
      const lis = items.map((t, j) => <li key={j}>{inline(t, `${k}l${j}`)}</li>);
      blocks.push(ordered ? <ol key={k}>{lis}</ol> : <ul key={k}>{lis}</ul>);
    } else if (line.trim() === '') {
      i++;
    } else {
      const buf: string[] = [];
      do buf.push(lines[i++]);
      while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,6}\s|```|\s*\||\s*([-*]|\d+\.)\s+)/.test(lines[i]));
      blocks.push(<p key={k}>{buf.flatMap((t, j) => [...inline(t, `${k}p${j}`), j < buf.length - 1 ? <br key={`${k}br${j}`} /> : null])}</p>);
    }
  }
  return <div className="md">{blocks}</div>;
}
