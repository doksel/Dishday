import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dishday Admin',
  description: 'Internal admin panel — moderation, analytics, billing.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-100 text-zinc-900 antialiased">
        <Providers>
          <div className="flex min-h-screen">
            <aside className="w-56 border-r border-zinc-200 bg-white p-4">
              <div className="text-lg font-bold">Dishday Admin</div>
              <nav className="mt-6 flex flex-col gap-1 text-sm">
                <Link className="rounded px-2 py-1.5 hover:bg-zinc-100" href="/">Overview</Link>
                <Link className="rounded px-2 py-1.5 hover:bg-zinc-100" href="/users">Users</Link>
                <Link className="rounded px-2 py-1.5 hover:bg-zinc-100" href="/recipes">Recipes</Link>
                <Link className="rounded px-2 py-1.5 hover:bg-zinc-100" href="/ai-cost">AI cost</Link>
              </nav>
            </aside>
            <div className="flex-1">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
