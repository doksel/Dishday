'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { FilterChips } from '@/components/recipes/FilterChips';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { SearchBar } from '@/components/recipes/SearchBar';
import {
  DEMO_RECIPES,
  getDisplayTags,
  getPrimaryTagLabel,
  recipeImage,
  type DemoTag,
} from '@/lib/demo-recipes';

type FilterKey = 'all' | DemoTag;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'quick', label: 'Quick' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'high-protein', label: 'High Protein' },
  { key: 'low-carb', label: 'Low Carb' },
  { key: 'gluten-free', label: 'Gluten-Free' },
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'desserts', label: 'Desserts' },
];

export default function RecipesPage() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');

  /**
   * Local filtering — fine for the static demo set. When we wire to the
   * real catalog, this turns into a `useQuery(['recipes', { q, filter }])`.
   */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEMO_RECIPES.filter((r) => {
      if (filter !== 'all' && !r.tags.includes(filter)) return false;
      if (q && !r.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [filter, query]);

  return (
    <AppShell title="Explore Recipes" subtitle="Discover dishes you’ll love">
      <div className="space-y-6">
        {/* Search */}
        <div className="max-w-md">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search ingredients or dishes…"
          />
        </div>

        {/* Filters */}
        <FilterChips options={FILTERS} active={filter} onChange={setFilter} />

        {/* Bento grid — featured card spans 2 cols / 2 rows on md+ */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center text-sm text-zinc-500">
            No recipes match this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((r) => {
              // Featured card uses a larger source image + chips overlay;
              // compact card gets a single corner pill.
              const isFeatured = !!r.featured;
              return (
                <RecipeCard
                  key={r.id}
                  id={r.id}
                  title={r.title}
                  imageUrl={recipeImage(
                    r.imagePhotoId,
                    isFeatured ? 1200 : 600,
                    isFeatured ? 900 : 400,
                  )}
                  minutes={r.minutes}
                  kcal={r.kcal}
                  featured={isFeatured}
                  rating={r.rating}
                  description={isFeatured ? r.description : undefined}
                  chips={
                    isFeatured ? getDisplayTags(r, 2).map((t) => t.label) : undefined
                  }
                  tag={!isFeatured ? getPrimaryTagLabel(r) : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
