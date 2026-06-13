import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

interface MealPageProps {
  searchParams: Promise<{ dow?: string; type?: string }>;
}

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

/**
 * Meal-detail placeholder.
 *
 *   Mirrors the mobile `meal.tsx` shape — accepts `dow` (0=Mon) and `type`
 *   (breakfast/lunch/dinner/snack) via query params so the URL is shareable
 *   and bookmarkable. The real layout (macros bento + dish list + add-dish
 *   action) lands when the design comes in; for now it's a stub that proves
 *   the click flow from Home works end-to-end.
 */
export default async function MealPage({ searchParams }: MealPageProps) {
  const { dow: dowStr, type } = await searchParams;
  const dowNum = Number(dowStr);
  const dayName = Number.isFinite(dowNum) && dowNum >= 0 && dowNum <= 6
    ? WEEKDAY_NAMES[dowNum]
    : '—';
  const mealLabel = type ? (MEAL_LABELS[type] ?? type) : '—';

  return (
    <AppShell title={`${dayName} ${mealLabel}`} subtitle="Meal details">
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
        <h2 className="text-xl font-semibold text-zinc-900">Coming soon</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
          Meal-detail page is being designed. It will show macros for this slot, the list of
          dishes, and let you add or remove items — same flow as the mobile app.
        </p>
        <dl className="mx-auto mt-6 grid w-full max-w-sm grid-cols-2 gap-2 rounded-lg bg-zinc-50 p-4 text-left text-xs">
          <dt className="text-zinc-500">Day</dt>
          <dd className="font-medium text-zinc-900">{dayName}</dd>
          <dt className="text-zinc-500">Meal type</dt>
          <dd className="font-medium text-zinc-900">{mealLabel}</dd>
        </dl>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
