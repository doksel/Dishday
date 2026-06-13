import Link from 'next/link';
import type { MealType } from '@dishday/types';

export interface MealCardBigProps {
  /** Slot in the day, used for the route + label. */
  mealType: MealType;
  /** Day-of-week index (0=Mon … 6=Sun), forwarded to the meal-detail route. */
  dow: number;
  /** Recipe title — multi-dish slots can pre-join with " · " for now. */
  title: string;
  /** Hero image — landscape ratio renders best. */
  imageUrl: string;
  /** Optional metadata shown under the title. */
  kcal?: number;
  /** Total prep+cook minutes. */
  minutes?: number;
}

/**
 * Large meal slot card for the selected-day section of the Home page.
 *
 *   Renders a 16:9 hero image with the meal-type label on top, then the
 *   dish title + a compact metadata row. The entire card is a Link to the
 *   meal-detail page (same query-param shape as the mobile app) so the
 *   navigation flow stays consistent across platforms.
 */
export function MealCardBig({
  mealType,
  dow,
  title,
  imageUrl,
  kcal,
  minutes,
}: MealCardBigProps) {
  const label = mealType.toUpperCase();

  return (
    <Link
      href={{ pathname: '/meal', query: { dow: String(dow), type: mealType } }}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 shadow-sm">
          {label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-base font-bold leading-snug text-zinc-900 group-hover:text-emerald-700">
          {title}
        </h3>
        {(kcal != null || minutes != null) && (
          <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
            {minutes != null && <span>{minutes} min</span>}
            {kcal != null && (
              <>
                <span className="h-1 w-1 rounded-full bg-zinc-300" />
                <span>{Math.round(kcal)} kcal</span>
              </>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
