import type { ReactNode } from 'react';

export interface DayCardMeal {
  type: 'Breakfast' | 'Lunch' | 'Dinner';
  title: string;
  imageUrl: string;
}

export interface DayCardProps {
  weekday: string;
  dayOfMonth: number;
  kcal?: number;
  /** Render the "TODAY" pill instead of the kcal counter. */
  isToday?: boolean;
  meals: DayCardMeal[];
  /** Highlight border for the focused day (clicked or today). */
  active?: boolean;
  /** Click handler — wraps the card in a button so the whole card is hittable. */
  onClick?: () => void;
}

/**
 * Single day in the horizontal weekly calendar. Designed to be 280px wide
 * and stack three meals (Breakfast / Lunch / Dinner) inside. The whole card
 * is clickable; the parent uses that to swap which day's meals are shown
 * in the detail row below.
 */
export function DayCard({
  weekday,
  dayOfMonth,
  kcal,
  isToday,
  meals,
  active,
  onClick,
}: DayCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex w-[280px] shrink-0 flex-col overflow-hidden rounded-xl bg-white border text-left transition-all ' +
        (active
          ? 'border-2 border-emerald-700 shadow-lg'
          : 'border-zinc-200 hover:border-zinc-300 hover:shadow-md')
      }
    >
      <header className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3">
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            {weekday}
          </span>
          <span className="block text-2xl font-bold leading-none text-zinc-900">{dayOfMonth}</span>
        </div>
        {isToday ? (
          <Pill>
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-700" />
            TODAY
          </Pill>
        ) : kcal ? (
          <span className="text-xs italic text-zinc-500">
            {kcal.toLocaleString()} kcal
          </span>
        ) : null}
      </header>

      <ul className="space-y-3 p-4">
        {meals.map((m) => (
          <li key={m.type} className="flex gap-3">
            <img
              src={m.imageUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                {m.type}
              </p>
              <p className="truncate text-sm leading-snug text-zinc-900">{m.title}</p>
            </div>
          </li>
        ))}
      </ul>
    </button>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
      {children}
    </span>
  );
}
