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
import { LimitReachedError, NotFoundError, PlanRequiredError } from '../repositories/interfaces.js';

/** Free-tier caps. Pro / admin are uncapped. */
const FREE_BOOKMARK_LIMIT = 10;
const FREE_QUICK_DISH_LIMIT = 10;

export class RecipeService {
  constructor(private readonly repos: Repositories) {}

  list(filter: RecipeFilter): Promise<Paginated<Recipe>> {
    return this.repos.recipes.list(filter);
  }

  /**
   * Fetch a recipe with tier-aware visibility.
   *
   *   - `requesterId === undefined` → anonymous request; previewOnly rows
   *     are treated as paywalled (the caller can decide how to render).
   *   - Author of the recipe always sees their own row in full (they made
   *     it; no point hiding it from them).
   *   - Otherwise: if the row is `previewOnly` and the requester is Free,
   *     throw `PlanRequiredError`. The HTTP layer maps it to a 402 with the
   *     row's title attached (so the client can keep a teaser visible).
   */
  async get(id: string, requesterId?: string): Promise<Recipe> {
    const r = await this.repos.recipes.findById(id);
    if (!r) throw new NotFoundError('Recipe', id);
    if (!r.previewOnly) return r;

    // previewOnly path — author always sees full content
    if (requesterId && r.authorId === requesterId) return r;

    const requester = requesterId ? await this.repos.users.findById(requesterId) : null;
    if (!requester || requester.plan === 'free') {
      throw new PlanRequiredError('This recipe is preview-only — upgrade to view full content');
    }
    return r;
  }

  /**
   * Tier policy for user-created recipes:
   *   - Free authors are forced to `isPublic=false` — recipe is visible only
   *     to themselves. Upgrading later doesn't retroactively flip it; the user
   *     can edit and re-submit.
   *   - Pro / admin authors keep whatever the request says (default true).
   *     Even when public, `isApproved` stays false so the recipe queues for
   *     moderator approval before joining the public catalog.
   *
   * Always strips `previewOnly` — only the AI worker may set that flag.
   */
  async create(
    authorId: string,
    input: Omit<CreateRecipeInput, 'slug' | 'authorId' | 'source' | 'previewOnly'>,
  ): Promise<Recipe> {
    const author = await this.repos.users.findById(authorId);
    const isFree = !author || author.plan === 'free';

    if (isFree) {
      const current = await this.repos.recipes.countUserRecipes(authorId);
      if (current >= FREE_QUICK_DISH_LIMIT) {
        throw new LimitReachedError('quickDishes', FREE_QUICK_DISH_LIMIT, current);
      }
    }

    const slug = await this.uniqueSlug(input.title);
    return this.repos.recipes.create({
      ...input,
      authorId,
      slug,
      source: 'user',
      isPublic: isFree ? false : input.isPublic,
      previewOnly: false,
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

  /**
   * Free users may bookmark up to FREE_BOOKMARK_LIMIT recipes — beyond that,
   * the upgrade flow is the only path. Pro / admin are uncapped.
   *
   * We check on the *add* side only, not on toggle — so existing bookmarks
   * survive a Pro → Free downgrade. The user simply can't add more until
   * they prune below the cap or upgrade again.
   */
  async bookmark(userId: string, recipeId: string): Promise<void> {
    const user = await this.repos.users.findById(userId);
    const isFree = !user || user.plan === 'free';
    if (isFree) {
      const current = await this.repos.recipes.countBookmarks(userId);
      if (current >= FREE_BOOKMARK_LIMIT) {
        throw new LimitReachedError('bookmarks', FREE_BOOKMARK_LIMIT, current);
      }
    }
    await this.repos.recipes.bookmark(userId, recipeId);
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
