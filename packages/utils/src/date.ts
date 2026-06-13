import { startOfWeek, addDays, format } from 'date-fns';

/** Returns the Monday of the week containing `date`, as YYYY-MM-DD. */
export function weekStartIso(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

/** Day-of-week (0 = Mon ... 6 = Sun) used in meal_plan_entries. */
export function dayOfWeekMondayFirst(date: Date): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const js = date.getDay(); // 0 = Sun ... 6 = Sat
  return ((js + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/** Build the 7 dates of the plan week, starting Monday. */
export function planWeekDates(weekStart: string): Date[] {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Shift a Monday-ISO week by N weeks (negative = past). Result is the same
 * YYYY-MM-DD format returned by `weekStartIso()`. Used by the planner's
 * prev/next week navigation.
 */
export function addWeeksIso(weekStart: string, weeks: number): string {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  return format(addDays(start, weeks * 7), 'yyyy-MM-dd');
}

/**
 * Human-friendly label for a plan week, localized via `Intl.DateTimeFormat`.
 *
 *   en   → "Jun 9–15"
 *   ru   → "9–15 июня"
 *   de   → "9.–15. Juni"
 *   uk   → "9–15 червня"
 *
 *   Uses `formatRange()` when available (Hermes 0.71+ / modern V8). Falls
 *   back to two formatted dates joined with an en-dash if not — the result
 *   is slightly more verbose ("Jun 9 – Jun 15") but always works.
 */
export function formatWeekRange(weekStart: string, locale: string): string {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  const end = addDays(start, 6);
  const fmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const range = fmt as Intl.DateTimeFormat & {
    formatRange?: (start: Date, end: Date) => string;
  };
  if (typeof range.formatRange === 'function') {
    return range.formatRange(start, end);
  }
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}
