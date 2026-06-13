'use client';

export interface FilterChipsProps<T extends string> {
  /** Available filter keys in render order. */
  options: readonly { key: T; label: string }[];
  /** Currently active filter key (single-select). */
  active: T;
  onChange: (next: T) => void;
}

/**
 * Horizontal pill row for filter selection. Single-select for now — flips
 * to the tapped option immediately, no debounce. If we later want multi-
 * select, swap `active` for `Set<T>` and toggle in the click handler.
 */
export function FilterChips<T extends string>({ options, active, onChange }: FilterChipsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ key, label }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={
              'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ' +
              (isActive
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
