'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconAiPlan,
  IconClose,
  IconHome,
  IconPlus,
  IconProfile,
  IconRecipes,
  IconShopping,
} from './Icons';
import type { ComponentType, SVGProps } from 'react';

interface NavItem {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV: NavItem[] = [
  { href: '/', label: 'Home', Icon: IconHome },
  { href: '/recipes', label: 'Recipes', Icon: IconRecipes },
  { href: '/ai-plan', label: 'AI Plan', Icon: IconAiPlan },
  { href: '/shopping', label: 'Shopping', Icon: IconShopping },
  { href: '/profile', label: 'Profile', Icon: IconProfile },
];

export interface SidebarProps {
  /** True when rendered inside the mobile drawer — adds a close button. */
  mobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobile, onClose }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-white border-r border-zinc-200">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <span className="text-lg font-bold leading-none">D</span>
          </div>
          <div className="leading-tight">
            <div className="font-bold text-zinc-900">Dishday</div>
            <div className="text-[11px] text-zinc-500">Your kitchen companion</div>
          </div>
        </Link>
        {mobile && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100"
            aria-label="Close menu"
          >
            <IconClose width={20} height={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={mobile ? onClose : undefined}
                  className={
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ' +
                    (active
                      ? 'bg-emerald-700 text-white'
                      : 'text-zinc-700 hover:bg-zinc-100')
                  }
                >
                  <Icon width={20} height={20} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* CTA — primary action across the whole app */}
      <div className="p-4">
        <Link
          href="/ai-plan"
          onClick={mobile ? onClose : undefined}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition-colors"
        >
          <IconPlus width={18} height={18} />
          Create New Plan
        </Link>
      </div>
    </aside>
  );
}
