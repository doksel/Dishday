/**
 * In-memory RecipeRepository — same contract, zero infrastructure.
 *
 * Use it for unit tests, Storybook stub backends, or quick local
 * experimentation without a database. Drop-in replacement for the
 * Prisma version — `container.ts` is the only place you need to change.
 */

import { randomUUID } from 'node:crypto';
import type { Paginated, Recipe, RecipeFilter } from '@dishday/types';
import type {
  CreateRecipeInput,
  RecipeRepository,
  UpdateRecipeInput,
} from '../interfaces.js';
import { NotFoundError } from '../interfaces.js';

export class InMemoryRecipeRepository implements RecipeRepository {
  private recipes = new Map<string, Recipe>();
  private bookmarks = new Set<string>(); // `${userId}:${recipeId}`

  constructor(seed: Recipe[] = []) {
    seed.forEach((r) => this.recipes.set(r.id, r));
  }

  async findById(id: string): Promise<Recipe | null> {
    return this.recipes.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<Recipe | null> {
    return [...this.recipes.values()].find((r) => r.slug === slug) ?? null;
  }

  async list(filter: RecipeFilter): Promise<Paginated<Recipe>> {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));

    let items = [...this.recipes.values()].filter((r) => r.isPublic && r.isApproved);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description?.toLowerCase().includes(q) ?? false),
      );
    }
    if (filter.cuisine) items = items.filter((r) => r.cuisine === filter.cuisine);
    if (filter.source) items = items.filter((r) => r.source === filter.source);
    if (filter.mealType) items = items.filter((r) => r.mealType.includes(filter.mealType!));
    if (filter.tags?.length) {
      items = items.filter((r) => filter.tags!.every((t) => r.tags.includes(t)));
    }
    if (filter.maxPrepTime !== undefined) {
      items = items.filter((r) => (r.prepTimeMin ?? Infinity) <= filter.maxPrepTime!);
    }

    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const total = items.length;
    const slice = items.slice((page - 1) * pageSize, page * pageSize);
    return { items: slice, total, page, pageSize };
  }

  async create(data: CreateRecipeInput): Promise<Recipe> {
    const id = randomUUID();
    const recipe: Recipe = {
      id,
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      authorId: data.authorId ?? null,
      source: data.source,
      prepTimeMin: data.prepTimeMin ?? null,
      cookTimeMin: data.cookTimeMin ?? null,
      servings: data.servings ?? 2,
      caloriesPerServing: data.caloriesPerServing ?? null,
      proteinG: data.proteinG ?? null,
      carbsG: data.carbsG ?? null,
      fatG: data.fatG ?? null,
      imageUrl: data.imageUrl ?? null,
      isPublic: data.isPublic ?? true,
      isApproved: data.isApproved ?? false,
      tags: data.tags ?? [],
      cuisine: data.cuisine ?? null,
      mealType: data.mealType ?? [],
      createdAt: new Date().toISOString(),
      ingredients: data.ingredients?.map((ing, i) => ({
        id: randomUUID(),
        recipeId: id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes ?? null,
        orderIndex: ing.orderIndex ?? i,
      })),
    };
    this.recipes.set(id, recipe);
    return recipe;
  }

  async update(id: string, data: UpdateRecipeInput): Promise<Recipe> {
    const existing = this.recipes.get(id);
    if (!existing) throw new NotFoundError('Recipe', id);
    const updated: Recipe = { ...existing, ...data, id, createdAt: existing.createdAt };
    this.recipes.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.recipes.delete(id);
  }

  async bookmark(userId: string, recipeId: string): Promise<void> {
    this.bookmarks.add(`${userId}:${recipeId}`);
  }

  async unbookmark(userId: string, recipeId: string): Promise<void> {
    this.bookmarks.delete(`${userId}:${recipeId}`);
  }

  async listBookmarks(userId: string): Promise<Recipe[]> {
    const ids = [...this.bookmarks]
      .filter((k) => k.startsWith(`${userId}:`))
      .map((k) => k.split(':')[1]);
    return ids.flatMap((id) => {
      const r = this.recipes.get(id);
      return r ? [r] : [];
    });
  }
}
