'use client';

import { useState } from 'react';
import { IconCheck } from '../Icons';

export interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  category: string;
  checked?: boolean;
}

export interface GroceryPreviewProps {
  items: GroceryItem[];
  totalCount?: number;
}

/**
 * Right-side grocery list panel. Items can be locally toggled to give the
 * user immediate feedback — wire up to a mutation later (this is just UI
 * scaffolding for now).
 */
export function GroceryPreview({ items, totalCount }: GroceryPreviewProps) {
  const [checked, setChecked] = useState<Set<string>>(
    new Set(items.filter((i) => i.checked).map((i) => i.id)),
  );

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-bold text-zinc-900">Grocery Preview</h3>
        <button
          type="button"
          className="text-sm font-semibold text-emerald-700 hover:underline"
        >
          Full List
        </button>
      </div>

      <ul className="flex-1 space-y-3">
        {items.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <li key={item.id} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-pressed={isChecked}
                className={
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors ' +
                  (isChecked
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-emerald-200 hover:bg-emerald-50')
                }
              >
                {isChecked && <IconCheck width={14} height={14} strokeWidth={3} />}
              </button>
              <div className={'min-w-0 flex-1 ' + (isChecked ? 'opacity-40' : '')}>
                <p
                  className={
                    'truncate text-sm font-medium text-zinc-900 ' +
                    (isChecked ? 'line-through' : '')
                  }
                >
                  {item.name}
                </p>
                <p className="text-[11px] text-zinc-500">{item.amount}</p>
              </div>
              <span
                className={
                  'shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold text-zinc-700 bg-zinc-100 ' +
                  (isChecked ? 'opacity-40' : '')
                }
              >
                {item.category}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 border-t border-zinc-100 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-zinc-500">Items to buy:</span>
          <span className="text-sm font-bold text-zinc-900">
            {totalCount ?? items.length} items
          </span>
        </div>
        <button
          type="button"
          className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 active:scale-[0.98] transition-all"
        >
          Sync with Instacart
        </button>
      </div>
    </section>
  );
}
