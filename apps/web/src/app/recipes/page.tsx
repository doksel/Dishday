'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { FilterChips } from '@/components/recipes/FilterChips';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { SearchBar } from '@/components/recipes/SearchBar';

type FilterKey =
  | 'all'
  | 'quick'
  | 'vegan'
  | 'high-protein'
  | 'low-carb'
  | 'gluten-free'
  | 'breakfast'
  | 'desserts';

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

interface DemoRecipe {
  id: string;
  title: string;
  imageUrl: string;
  minutes: number;
  kcal: number;
  tags: FilterKey[];
  /** Render as the bento hero card. Exactly one in the demo set. */
  featured?: boolean;
  rating?: number;
  description?: string;
  chips?: string[];
  tag?: string;
}

const RECIPES: DemoRecipe[] = [
  {
    id: 'mediterranean-harvest-bowl',
    title: 'Mediterranean Harvest Bowl',
    imageUrl:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=900&fit=crop',
    minutes: 25,
    kcal: 480,
    tags: ['vegan', 'high-protein'],
    featured: true,
    rating: 4.9,
    description:
      'A nutritious blend of organic quinoa, maple-roasted sweet potato, and fresh heirloom greens topped with a zesty tahini dressing.',
    chips: ['Vegan', 'High Protein'],
  },
  {
    id: 'wild-basil-pesto-linguine',
    title: 'Wild Basil Pesto Linguine',
    imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&h=400&fit=crop',
    minutes: 15,
    kcal: 320,
    tags: ['quick'],
    tag: 'Quick',
  },
  {
    id: 'beet-goat-cheese-salad',
    title: 'Beet & Goat Cheese Salad',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop',
    minutes: 10,
    kcal: 210,
    tags: ['gluten-free'],
    tag: 'Vegetarian',
  },
  {
    id: 'lemon-glazed-salmon',
    title: 'Lemon Glazed Atlantic Salmon',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop',
    minutes: 20,
    kcal: 450,
    tags: ['low-carb', 'high-protein'],
    tag: 'Low Carb',
  },
  {
    id: 'moroccan-falafel-bowl',
    title: 'Moroccan Falafel Bowl',
    imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=400&fit=crop',
    minutes: 15,
    kcal: 510,
    tags: ['vegan'],
    tag: 'Vegan',
  },
  {
    id: 'blueberry-almond-oats',
    title: 'Blueberry Almond Oats',
    imageUrl: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600&h=400&fit=crop',
    minutes: 5,
    kcal: 280,
    tags: ['quick', 'breakfast'],
    tag: 'Quick',
  },
  {
    id: 'golden-chickpea-curry',
    title: 'Golden Chickpea Curry',
    imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&h=400&fit=crop',
    minutes: 35,
    kcal: 420,
    tags: ['vegan'],
    tag: 'Vegan',
  },
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
    return RECIPES.filter((r) => {
      if (filter !== 'all' && !r.tags.includes(filter)) return false;
      if (q && !r.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [filter, query]);

  return (
    <AppShell title="Explore Recipes" subtitle="Discover dishes you'll love">
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
            {filtered.map((r) => (
              <RecipeCard key={r.id} {...r} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
