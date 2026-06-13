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

interface DemoIngredient {
  id: string;
  text: string;
}

interface DemoStep {
  heading: string;
  body: string;
}

interface DemoRecipe {
  id: string;
  title: string;
  imageUrl: string;
  tags: string[];
  minutes: number;
  kcal: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  servings: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fiber: number;
  };
  ingredients: DemoIngredient[];
  steps: DemoStep[];
  chefTip?: string;
}

/**
 * Demo recipe — same shape we'll get back from `GET /v1/recipes/{id}` once
 * the page is wired to the API. For now everything lives here so the UI can
 * be reviewed without a server.
 */
const DEMO_RECIPE: DemoRecipe = {
  id: 'mediterranean-harvest-bowl',
  title: 'Mediterranean Harvest Bowl',
  imageUrl:
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=1500&fit=crop&q=80',
  tags: ['Vegan', 'High Protein'],
  minutes: 25,
  kcal: 480,
  difficulty: 'Easy',
  description:
    'A vibrant, nourishing bowl that captures the essence of the Mediterranean. This recipe combines the earthy tones of massaged kale and quinoa with the sweet depth of roasted potatoes and the satisfying crunch of spiced chickpeas. Finished with a velvety tahini dressing, it’s a high-protein plant-based powerhouse perfect for meal prep or a quick weeknight dinner.',
  servings: 1,
  nutrition: { calories: 480, protein: 18, carbs: 52, fiber: 12 },
  ingredients: [
    { id: 'ing-1', text: '1/2 cup Quinoa, cooked' },
    { id: 'ing-2', text: '2 cups Fresh Kale, chopped' },
    { id: 'ing-3', text: '1 large Sweet Potato, cubed' },
    { id: 'ing-4', text: '1/2 cup Chickpeas, canned' },
    { id: 'ing-5', text: '2 tbsp Tahini Dressing' },
  ],
  steps: [
    {
      heading: 'Preparation',
      body: 'Preheat your oven to 400°F (200°C). Toss cubed sweet potatoes and chickpeas with olive oil, salt, and smoked paprika. Spread on a baking sheet and roast for 20–25 minutes until tender and slightly crisp.',
    },
    {
      heading: 'Massage the Kale',
      body: 'While the potatoes roast, place chopped kale in a large bowl. Add a squeeze of lemon juice and a pinch of salt. Massage with your hands for 2 minutes until the leaves become soft and dark green.',
    },
    {
      heading: 'Assembly',
      body: 'In a serving bowl, start with a base of cooked quinoa. Layer the massaged kale on top. Add the roasted sweet potatoes and chickpeas in distinct sections for a beautiful presentation.',
    },
    {
      heading: 'The Finish',
      body: 'Drizzle generously with tahini dressing. Top with sesame seeds or red pepper flakes if desired. Serve warm or at room temperature.',
    },
  ],
  chefTip:
    'For extra creaminess, add half a mashed avocado to your kale while massaging. It adds healthy fats and makes the bowl even more satisfying!',
};

export default function RecipeDetailPage() {
  // `useParams` keeps this simple while we're a client component. When we
  // need server-rendered metadata we can split this into a server wrapper +
  // client interactive island.
  const params = useParams<{ id: string }>();
  const id = params?.id ?? DEMO_RECIPE.id;

  // For now, every requested id resolves to the demo recipe — once the API
  // lands this is `useQuery(['recipe', id], () => api.recipes.byId(id))`.
  const recipe = DEMO_RECIPE;

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

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

  return (
    <AppShell title="Recipe" subtitle={`#${id}`}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* ─── Left column: media + nutrition ───────────────── */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Hero image */}
          <div className="relative">
            <img
              src={recipe.imageUrl}
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
              {recipe.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700"
                >
                  {t}
                </span>
              ))}
            </div>
            <h1 className="text-3xl font-bold leading-tight text-zinc-900 md:text-4xl">
              {recipe.title}
            </h1>

            {/* Quick stats pill */}
            <div className="mt-4 inline-flex flex-wrap items-center gap-5 rounded-2xl border border-zinc-200 bg-white px-5 py-3">
              <Stat icon={<IconClock width={18} height={18} className="text-emerald-700" />} label={`${recipe.minutes} mins`} />
              <Divider />
              <Stat icon={<IconFlame width={18} height={18} className="text-emerald-700" />} label={`${recipe.kcal} kcal`} />
              <Divider />
              <Stat icon={<IconBars width={18} height={18} className="text-emerald-700" />} label={recipe.difficulty} />
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
                      className={on ? 'text-emerald-600' : 'text-zinc-300 group-hover:text-emerald-500'}
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

          {/* Chef's Tip */}
          {recipe.chefTip && (
            <div className="flex gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-5">
              <IconBulb width={22} height={22} className="flex-shrink-0 text-emerald-700" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">Chef’s Tip</p>
                <p className="mt-1 text-sm leading-relaxed text-emerald-900/80">{recipe.chefTip}</p>
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
