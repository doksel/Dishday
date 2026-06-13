'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  IconBars,
  IconBulb,
  IconCalendarPlus,
  IconChart,
  IconCheckCircle,
  IconClock,
  IconFlame,
  IconHeart,
  IconHeartFilled,
  IconPrinter,
  IconShare,
} from '@/components/Icons';
import {
  getDisplayTags,
  getRecipeById,
  recipeImage,
} from '@/lib/demo-recipes';

/**
 * Recipe detail.
 *
 *   Resolves the recipe from the shared demo catalogue via `useParams.id`.
 *   When we wire to the real API this becomes:
 *     `useQuery(['recipe', id], () => api.recipes.byId(id))`
 *   with `notFound()` on a 404.
 */
export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const recipe = getRecipeById(id);

  // Hooks must run before any early return, so set up state up front.
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  if (!recipe) {
    return (
      <AppShell title="Recipe" subtitle={id ? `#${id}` : undefined}>
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <h2 className="text-xl font-semibold text-zinc-900">Recipe not found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            We couldn’t find a recipe with that id in the demo catalogue.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link
              href="/recipes"
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Browse all recipes
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  function toggleIngredient(ingId: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(ingId)) next.delete(ingId);
      else next.add(ingId);
      return next;
    });
  }

  function handlePrint() {
    if (typeof window !== 'undefined') window.print();
  }

  const displayTags = getDisplayTags(recipe);
  const imageUrl = recipeImage(recipe.imagePhotoId, 1200, 1500);

  return (
    <AppShell title="Recipe" subtitle={`#${recipe.id}`}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* ─── Left column: media + nutrition ───────────────── */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Hero image */}
          <div className="relative">
            <img
              src={imageUrl}
              alt={recipe.title}
              className="aspect-[4/5] w-full rounded-3xl object-cover shadow-md"
            />
            <button
              type="button"
              onClick={() => setBookmarked((b) => !b)}
              aria-label={bookmarked ? 'Remove from favorites' : 'Add to favorites'}
              className={
                'absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-lg transition-transform hover:scale-110 active:scale-95 ' +
                (bookmarked ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-500')
              }
            >
              {bookmarked ? (
                <IconHeartFilled width={22} height={22} />
              ) : (
                <IconHeart width={22} height={22} />
              )}
            </button>
          </div>

          {/* Nutrition card */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
              <IconChart width={20} height={20} className="text-amber-500" />
              Nutrition per serving
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <NutritionStat
                label="Calories"
                value={recipe.nutrition.calories}
                unit="kcal"
                barClass="bg-amber-500"
                barWidth="w-3/4"
              />
              <NutritionStat
                label="Protein"
                value={recipe.nutrition.protein}
                unit="g"
                barClass="bg-emerald-700"
                barWidth="w-2/3"
              />
              <NutritionStat
                label="Carbs"
                value={recipe.nutrition.carbs}
                unit="g"
                barClass="bg-sky-500"
                barWidth="w-1/2"
              />
              <NutritionStat
                label="Fiber"
                value={recipe.nutrition.fiber}
                unit="g"
                barClass="bg-emerald-300"
                barWidth="w-4/5"
              />
            </div>
          </div>
        </div>

        {/* ─── Right column: details + instructions ─────────── */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Header — tags + title */}
          <section>
            <div className="mb-2 flex flex-wrap gap-2">
              {displayTags.map((t) => (
                <span
                  key={t.label}
                  className={
                    'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ' +
                    (t.tone === 'primary'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700')
                  }
                >
                  {t.label}
                </span>
              ))}
            </div>
            <h1 className="text-3xl font-bold leading-tight text-zinc-900 md:text-4xl">
              {recipe.title}
            </h1>

            {/* Quick stats pill */}
            <div className="mt-4 inline-flex flex-wrap items-center gap-5 rounded-2xl border border-zinc-200 bg-white px-5 py-3">
              <Stat
                icon={<IconClock width={18} height={18} className="text-emerald-700" />}
                label={`${recipe.minutes} mins`}
              />
              <Divider />
              <Stat
                icon={<IconFlame width={18} height={18} className="text-emerald-700" />}
                label={`${recipe.kcal} kcal`}
              />
              <Divider />
              <Stat
                icon={<IconBars width={18} height={18} className="text-emerald-700" />}
                label={recipe.difficulty}
              />
            </div>

            {/* CTA buttons */}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-800 active:scale-95"
              >
                <IconCalendarPlus width={18} height={18} />
                Add to Plan
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-full border-2 border-emerald-700 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-95"
              >
                <IconPrinter width={18} height={18} />
                Print Recipe
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border-2 border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 active:scale-95"
              >
                <IconShare width={18} height={18} />
                Share
              </button>
            </div>
          </section>

          {/* Description */}
          <section className="max-w-2xl">
            <h2 className="mb-2 text-lg font-bold text-zinc-900">About this recipe</h2>
            <p className="text-[15px] leading-relaxed text-zinc-600">{recipe.description}</p>
          </section>

          <hr className="border-zinc-200" />

          {/* Ingredients */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Ingredients</h2>
              <span className="text-sm text-zinc-500">
                {recipe.servings} Serving{recipe.servings === 1 ? '' : 's'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {recipe.ingredients.map((ing) => {
                const on = checked.has(ing.id);
                return (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => toggleIngredient(ing.id)}
                    className={
                      'group flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left transition-colors ' +
                      (on
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-zinc-200 hover:border-emerald-200')
                    }
                  >
                    <span
                      className={
                        'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ' +
                        (on
                          ? 'border-emerald-700 bg-emerald-700 text-white'
                          : 'border-zinc-300 bg-white')
                      }
                    >
                      {on && (
                        <svg
                          width={12}
                          height={12}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m5 12 5 5L20 7" />
                        </svg>
                      )}
                    </span>
                    <span
                      className={
                        'flex-1 text-sm ' +
                        (on ? 'text-zinc-400 line-through' : 'text-zinc-900')
                      }
                    >
                      {ing.text}
                    </span>
                    <IconCheckCircle
                      width={18}
                      height={18}
                      className={
                        on
                          ? 'text-emerald-600'
                          : 'text-zinc-300 group-hover:text-emerald-500'
                      }
                    />
                  </button>
                );
              })}
            </div>
          </section>

          <hr className="border-zinc-200" />

          {/* Cooking Instructions */}
          <section>
            <h2 className="mb-5 text-lg font-bold text-zinc-900">Cooking Instructions</h2>
            <ol className="flex flex-col gap-5">
              {recipe.steps.map((step, idx) => {
                const isActive = idx === activeStep;
                return (
                  <li
                    key={step.heading}
                    className="flex cursor-pointer gap-4"
                    onClick={() => setActiveStep(idx)}
                  >
                    <div
                      className={
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base font-bold transition-colors ' +
                        (isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-zinc-200 text-zinc-500')
                      }
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4
                        className={
                          'mb-1 text-xs font-semibold uppercase tracking-wide ' +
                          (isActive ? 'text-emerald-700' : 'text-zinc-500')
                        }
                      >
                        {step.heading}
                      </h4>
                      <p className="text-[15px] leading-relaxed text-zinc-800">{step.body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Chef’s Tip */}
          {recipe.chefTip && (
            <div className="flex gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-5">
              <IconBulb width={22} height={22} className="flex-shrink-0 text-emerald-700" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">Chef’s Tip</p>
                <p className="mt-1 text-sm leading-relaxed text-emerald-900/80">
                  {recipe.chefTip}
                </p>
              </div>
            </div>
          )}

          {/* Footer nav */}
          <div className="mt-2 flex justify-start">
            <Link
              href="/recipes"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              ← All Recipes
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ─── Small presentation helpers ──────────────────────────────────── */

function NutritionStat({
  label,
  value,
  unit,
  barClass,
  barWidth,
}: {
  label: string;
  value: number;
  unit: string;
  barClass: string;
  barWidth: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900">
        {value} <span className="text-sm font-normal text-zinc-500">{unit}</span>
      </p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-200">
        <div className={`h-full rounded-full ${barClass} ${barWidth}`} />
      </div>
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-sm font-semibold text-zinc-900">{label}</span>
    </div>
  );
}

function Divider() {
  return <span className="h-5 w-px bg-zinc-200" />;
}
