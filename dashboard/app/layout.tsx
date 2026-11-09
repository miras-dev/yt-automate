import type {Metadata, Viewport} from 'next';
import Link from 'next/link';
import './globals.css';
import {loadIndex} from '@/lib/data';

export const metadata: Metadata = {title: 'Shorts Factory', description: 'Every Short made in this repo: status, cost and results.'};
export const viewport: Viewport = {width: 'device-width', initialScale: 1, themeColor: '#0e1014'};
export const dynamic = 'force-dynamic';

export default function RootLayout({children}: {children: React.ReactNode}) {
  const {generated} = loadIndex();
  return (
    <html lang="en">
      <body>
        <div className="wrap">
          <header className="top">
            <Link href="/" className="brand">
              Shorts <span>Factory</span>
            </Link>
            <nav>
              <Link href="/">Videos</Link>
              <Link href="/topics">Topics</Link>
            </nav>
            <div className="gen">{generated ? `index built ${generated.replace('T', ' ').replace('Z', ' UTC')}` : 'no index yet: run python scripts/register.py'}</div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
