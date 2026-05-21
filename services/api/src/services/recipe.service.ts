/**
 * RecipeService — application-level use cases for recipes.
 *
 * Depends ONLY on repository interfaces. Knows nothing about Prisma,
 * Supabase, HTTP, or any external SDK. That's what makes the backend
 * swappable.
 */

import type { Paginated, Recipe, RecipeFilter } from '@dishday/types';
import { slugify } from '@dishday/utils';
import type { CreateRecipeInput, Repositories, UpdateRecipeInput } from '../repositories/interfaces.js';
import { NotFoundError } from '../repositories/interfaces.js';

export class RecipeService {
  constructor(private readonly repos: Repositories) {}

  list(filter: RecipeFilter): Promise<Paginated<Recipe>> {
    return this.repos.recipes.list(filter);
  }

  async get(id: string): Promise<Recipe> {
    const r = await this.repos.recipes.findById(id);
    if (!r) throw new NotFoundError('Recipe', id);
    return r;
  }

  async create(authorId: string, input: Omit<CreateRecipeInput, 'slug' | 'authorId' | 'source'>): Promise<Recipe> {
    const slug = await this.uniqueSlug(input.title);
    return this.repos.recipes.create({
      ...input,
      authorId,
      slug,
      source: 'user',
    });
  }

  async update(id: string, requesterId: string, data: UpdateRecipeInput): Promise<Recipe> {
    const existing = await this.repos.recipes.findById(id);
    if (!existing) throw new NotFoundError('Recipe', id);
    if (existing.authorId !== requesterId) {
      throw new Error('Only the author can update this recipe');
    }
    return this.repos.recipes.update(id, data);
  }

  async delete(id: string, requesterId: string): Promise<void> {
    const existing = await this.repos.recipes.findById(id);
    if (!existing) throw new NotFoundError('Recipe', id);
    if (existing.authorId !== requesterId) {
      throw new Error('Only the author can delete this recipe');
    }
    await this.repos.recipes.delete(id);
  }

  bookmark(userId: string, recipeId: string) {
    return this.repos.recipes.bookmark(userId, recipeId);
  }
  unbookmark(userId: string, recipeId: string) {
    return this.repos.recipes.unbookmark(userId, recipeId);
  }
  listBookmarks(userId: string) {
    return this.repos.recipes.listBookmarks(userId);
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base = slugify(title) || 'recipe';
    let candidate = base;
    let n = 1;
    // Bounded loop — extremely unlikely to need more than a handful of attempts.
    while (await this.repos.recipes.findBySlug(candidate)) {
      n += 1;
      candidate = `${base}-${n}`;
      if (n > 50) {
        candidate = `${base}-${Date.now()}`;
        break;
      }
    }
    return candidate;
  }
}
