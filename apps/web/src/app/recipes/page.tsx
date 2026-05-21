'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card } from '@dishday/ui';
import type { MealType, Paginated, Recipe } from '@dishday/types';
import { getApi } from '@/lib/api';

const MEALS: { label: string; value: MealType | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

export default function RecipesPage() {
  const api = getApi();
  const [q, setQ] = useState('');
  const [mealType, setMealType] = useState<MealType | undefined>(undefined);

  const recipes = useQuery<Paginated<Recipe>>({
    queryKey: ['recipes', { q, mealType }],
    queryFn: () => api.recipes.list({ q: q || undefined, mealType, pageSize: 24 }),
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Recipes</h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <div className="flex gap-1">
          {MEALS.map((m) => (
            <button
              key={m.label}
              onClick={() => setMealType(m.value)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                mealType === m.value ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.data?.items.map((r) => (
          <Card key={r.id}>
            <div className="font-semibold">{r.title}</div>
            <div className="mt-1 text-sm text-zinc-600 line-clamp-2">{r.description}</div>
            <div className="mt-3 flex flex-wrap gap-1 text-xs">
              {r.tags.slice(0, 4).map((t) => (
                <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-3 text-xs text-zinc-500">
              {r.prepTimeMin ? `${r.prepTimeMin} min · ` : ''}
              {r.caloriesPerServing ? `${Math.round(r.caloriesPerServing)} kcal` : ''}
            </div>
          </Card>
        ))}
        {recipes.isLoading && <div className="text-sm text-zinc-500">Loading…</div>}
        {recipes.data && recipes.data.items.length === 0 && (
          <div className="text-sm text-zinc-500">No recipes match this filter.</div>
        )}
      </div>
    </main>
  );
}
