'use client';

import { IconSearch } from '../Icons';

export interface SearchBarProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

/**
 * Pill-shaped search input with a leading magnifier icon. Defaults to full
 * width so the consumer can constrain via the wrapper.
 */
export function SearchBar({ value, onChange, placeholder = 'Search…' }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <IconSearch
        width={18}
        height={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-transparent bg-zinc-100 pl-11 pr-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/15 transition-colors"
      />
    </div>
  );
}
