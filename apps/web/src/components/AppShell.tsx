'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { IconBell, IconMenu } from './Icons';
import { Sidebar } from './Sidebar';

export interface AppShellProps {
  /** Page heading shown in the top bar. */
  title?: string;
  /** Optional secondary line under the title (e.g. a date range). */
  subtitle?: string;
  /** Slot for page-specific controls in the top bar (e.g. a view toggle). */
  toolbar?: ReactNode;
  children: ReactNode;
}

/**
 * Top-level shell for the web app.
 *
 *   Layout
 *   ┌──────────┬──────────────────────────────┐
 *   │ Sidebar  │  TopBar                      │
 *   │ (fixed   ├──────────────────────────────┤
 *   │  on lg+) │  Children                    │
 *   └──────────┴──────────────────────────────┘
 *
 *   Responsive
 *   - lg+   (≥1024px) → sidebar is permanently visible
 *   - md/sm (<1024px) → sidebar collapses; hamburger button opens it as a
 *                       slide-in drawer with backdrop. Auto-closes on route
 *                       change (so navigation tap is a single gesture).
 */
export function AppShell({ title, subtitle, toolbar, children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer when the route changes — common gotcha is that a nav link
  // tap navigates but leaves the drawer overlay covering the new screen.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open (mobile UX nicety).
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Permanent sidebar on lg+ */}
      <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:w-64">
        <Sidebar />
      </div>

      {/* Drawer + scrim on <lg */}
      {drawerOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar mobile onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      {/* Main column — offset by sidebar on lg+ */}
      <div className="flex min-h-screen w-full flex-col lg:pl-64">
        <TopBar
          title={title}
          subtitle={subtitle}
          toolbar={toolbar}
          onMenu={() => setDrawerOpen(true)}
        />
        <main className="flex-1 px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

interface TopBarProps {
  title?: string;
  subtitle?: string;
  toolbar?: ReactNode;
  onMenu: () => void;
}

function TopBar({ title, subtitle, toolbar, onMenu }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
      {/* Hamburger — only on <lg */}
      <button
        type="button"
        onClick={onMenu}
        className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 lg:hidden"
        aria-label="Open menu"
      >
        <IconMenu />
      </button>

      <div className="min-w-0 flex-1">
        {title && (
          <h1 className="truncate text-lg font-bold leading-tight md:text-xl">{title}</h1>
        )}
        {subtitle && (
          <p className="truncate text-xs text-zinc-500 md:text-sm">{subtitle}</p>
        )}
      </div>

      {toolbar && <div className="hidden md:flex md:items-center md:gap-2">{toolbar}</div>}

      <button
        type="button"
        className="rounded-full p-2 text-zinc-700 hover:bg-zinc-100"
        aria-label="Notifications"
      >
        <IconBell width={20} height={20} />
      </button>

      <div
        className="h-9 w-9 overflow-hidden rounded-full border border-zinc-200 bg-emerald-700 text-white"
        aria-label="Account"
      >
        <div className="flex h-full w-full items-center justify-center text-sm font-semibold">D</div>
      </div>
    </header>
  );
}
