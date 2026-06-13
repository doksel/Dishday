'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  IconBox,
  IconBread,
  IconCart,
  IconDrag,
  IconFridge,
  IconLeaf,
  IconPiggy,
  IconPlus,
  IconPrinter,
  IconShare,
} from '@/components/Icons';
import {
  getDisplayTags,
  getRecipeById,
  recipeImage,
} from '@/lib/demo-recipes';

/**
 * Shopping list — demo state.
 *
 *   Real wiring lives behind `api.shoppingLists.forPlan(plan.id)` and the
 *   `toggleItem` mutation we already have. To plug in:
 *     1. Resolve current plan via `weekStartIso()`
 *     2. Group items into aisles by a server-provided category, falling
 *        back to a keyword classifier if missing.
 *     3. Replace `useState<Set<string>>` with an optimistic mutation that
 *        invalidates `['shopping-list', plan.id]`.
 *
 *   Kept as demo for now so the UI can be reviewed without depending on
 *   schema work (categories aren't on `shopping_list_items` yet).
 */

interface DemoItem {
  id: string;
  text: string;
}

interface DemoAisle {
  key: string;
  label: string;
  icon: ReactNode;
  items: DemoItem[];
  /** Real total in the plan; the card shows only the first 4. */
  totalCount: number;
}

const AISLES: DemoAisle[] = [
  {
    key: 'produce',
    label: 'Produce',
    icon: <IconLeaf width={20} height={20} className="text-emerald-700" />,
    totalCount: 12,
    items: [
      { id: 'p1', text: 'Organic Baby Spinach (250g)' },
      { id: 'p2', text: 'Vine-Ripened Tomatoes (4)' },
      { id: 'p3', text: 'Fresh Cilantro Bunch' },
      { id: 'p4', text: 'Red Bell Peppers (3)' },
    ],
  },
  {
    key: 'dairy',
    label: 'Dairy',
    icon: <IconFridge width={20} height={20} className="text-emerald-700" />,
    totalCount: 8,
    items: [
      { id: 'd1', text: 'Greek Yogurt, Plain (1kg)' },
      { id: 'd2', text: 'Unsalted Grass-fed Butter' },
      { id: 'd3', text: 'Extra Mature Cheddar (200g)' },
      { id: 'd4', text: 'Almond Milk, Unsweetened' },
    ],
  },
  {
    key: 'pantry',
    label: 'Pantry',
    icon: <IconBox width={20} height={20} className="text-emerald-700" />,
    totalCount: 15,
    items: [
      { id: 'pa1', text: 'Quinoa, White (500g)' },
      { id: 'pa2', text: 'Extra Virgin Olive Oil' },
      { id: 'pa3', text: 'Chickpeas, Canned (2)' },
      { id: 'pa4', text: 'Raw Honey, Local' },
    ],
  },
  {
    key: 'bakery',
    label: 'Bakery',
    icon: <IconBread width={20} height={20} className="text-emerald-700" />,
    totalCount: 4,
    items: [
      { id: 'b1', text: 'Sourdough Loaf, Whole Grain' },
      { id: 'b2', text: 'English Muffins (Pack of 6)' },
    ],
  },
];

/**
 * Plan-specific overrides — just (recipeId, slot, servings). All visual
 * data (title, image, tags) is looked up from the shared catalogue. When
 * the API lands, this comes from `meal_plan_entries` for the current week.
 */
interface PlanEntry {
  recipeId: string;
  when: string;
  /** Plan-specific serving count — may differ from the recipe's default. */
  servings: number;
}

const PLAN_ENTRIES: PlanEntry[] = [
  { recipeId: 'mediterranean-harvest-bowl', when: 'Monday Lunch', servings: 2 },
  { recipeId: 'moroccan-falafel-bowl', when: 'Tuesday Dinner', servings: 4 },
  { recipeId: 'blueberry-almond-oats', when: 'Wednesday Breakfast', servings: 1 },
];

/* ─── Page ────────────────────────────────────────────────────────── */

export default function ShoppingPage() {
  // Per-item checked state. When wired to API: optimistic toggle against
  // `PATCH /v1/shopping-lists/{listId}/items/{itemId}`.
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handlePrint() {
    if (typeof window !== 'undefined') window.print();
  }

  const totalItems = useMemo(
    () => AISLES.reduce((sum, a) => sum + a.totalCount, 0),
    [],
  );

  return (
    <AppShell
      title="Shopping List"
      subtitle={`${totalItems} items across ${AISLES.length} aisles for this week’s plan`}
      toolbar={
        <>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            <IconShare width={16} height={16} />
            Share List
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
          >
            <IconPrinter width={16} height={16} />
            Print
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        {/* ─── Aisle grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
          {AISLES.map((aisle) => (
            <AisleSection
              key={aisle.key}
              aisle={aisle}
              checked={checked}
              onToggle={toggle}
            />
          ))}
        </div>

        {/* ─── Right rail: plan, nutrition, cost ────────────────── */}
        <aside className="flex flex-col gap-6 xl:border-l xl:border-zinc-200 xl:pl-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Plan Overview</h3>
              <button
                type="button"
                className="text-sm font-semibold text-emerald-700 hover:underline"
              >
                Edit Plan
              </button>
            </div>
            <div className="space-y-3">
              {PLAN_ENTRIES.map((entry) => (
                <PlanMealCard key={`${entry.recipeId}-${entry.when}`} entry={entry} />
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-zinc-100 p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Nutrition Goal (Avg/Day)
            </h4>
            <ProgressRow
              label="Protein"
              value="85g / 100g"
              pct={85}
              barClass="bg-emerald-700"
              valueClass="text-emerald-700"
            />
            <div className="mt-3" />
            <ProgressRow
              label="Calories"
              value="1,850 / 2,100"
              pct={88}
              barClass="bg-amber-600"
              valueClass="text-amber-700"
            />
          </section>

          <section className="flex items-center gap-3 rounded-2xl bg-emerald-700 p-5 text-white shadow-md">
            <IconPiggy width={36} height={36} className="text-emerald-100" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">
                Estimated Cost
              </p>
              <p className="mt-1 text-3xl font-bold leading-none">$84.20</p>
              <p className="mt-1 text-xs text-emerald-100/85">Save $12.50 with store offers</p>
            </div>
          </section>
        </aside>
      </div>

      {/* Floating action button — primary "start shopping" mode. */}
      <button
        type="button"
        aria-label="Start shopping"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
      >
        <IconCart width={24} height={24} />
      </button>
    </AppShell>
  );
}

/* ─── Aisle section ────────────────────────────────────────────────── */

function AisleSection({
  aisle,
  checked,
  onToggle,
}: {
  aisle: DemoAisle;
  checked: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center gap-2 px-1">
        {aisle.icon}
        <h3 className="text-lg font-bold text-zinc-900">{aisle.label}</h3>
        <span className="ml-auto rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          {aisle.totalCount} Items
        </span>
      </header>

      <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        {aisle.items.map((item) => {
          const on = checked.has(item.id);
          return (
            <div key={item.id} className="group flex items-center gap-3">
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                aria-pressed={on}
                aria-label={`Mark ${item.text} ${on ? 'pending' : 'done'}`}
                className={
                  'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ' +
                  (on
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-zinc-300 bg-white hover:border-emerald-500')
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
              </button>
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className={
                  'flex-1 text-left text-sm transition-colors ' +
                  (on ? 'text-zinc-400 line-through' : 'text-zinc-900')
                }
              >
                {item.text}
              </button>
              <IconDrag
                width={16}
                height={16}
                className="cursor-grab text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100"
              />
            </div>
          );
        })}

        <button
          type="button"
          className="mt-1 flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
        >
          <IconPlus width={16} height={16} />
          Add Item
        </button>
      </div>
    </section>
  );
}

/* ─── Right rail bits ─────────────────────────────────────────────── */

function PlanMealCard({ entry }: { entry: PlanEntry }) {
  // Look up the recipe metadata from the shared catalogue. If we don't
  // know about this recipe (shouldn't happen in the demo) we render a
  // muted placeholder rather than crashing.
  const recipe = getRecipeById(entry.recipeId);
  if (!recipe) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-2.5 text-xs text-zinc-400">
        <div className="h-16 w-16 rounded-xl bg-zinc-200" />
        <span>Unknown recipe</span>
      </div>
    );
  }

  // First two display tags — Plan Overview cards are small, can't fit more.
  const tags = getDisplayTags(recipe, 2);

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-transparent bg-zinc-50 p-2.5 transition-colors hover:border-emerald-200 hover:bg-white"
    >
      <img
        src={recipeImage(recipe.imagePhotoId, 200, 200)}
        alt=""
        className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">
          {recipe.title}
        </h4>
        <p className="truncate text-xs text-zinc-500">
          {entry.when} · {entry.servings} {entry.servings === 1 ? 'Serving' : 'Servings'}
        </p>
        {tags.length > 0 && (
          <div className="mt-1 flex gap-1.5">
            {tags.map((t) => (
              <span
                key={t.label}
                className={
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold ' +
                  (t.tone === 'primary'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700')
                }
              >
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function ProgressRow({
  label,
  value,
  pct,
  barClass,
  valueClass,
}: {
  label: string;
  value: string;
  pct: number;
  barClass: string;
  valueClass: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-semibold">
        <span className="text-zinc-700">{label}</span>
        <span className={valueClass}>{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}
