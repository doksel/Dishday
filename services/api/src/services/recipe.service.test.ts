import { describe, expect, it, beforeEach } from 'vitest';
import { InMemoryRecipeRepository } from '../repositories/memory/recipe.repository.js';
import { NotFoundError, type Repositories } from '../repositories/interfaces.js';
import { RecipeService } from './recipe.service.js';

/**
 * Demonstrates how the repository pattern makes services trivially testable:
 * we hand RecipeService an in-memory repo and it works without Prisma,
 * Postgres, or Supabase. Same contract, zero infrastructure.
 */

function buildRepos(): Repositories {
  const recipes = new InMemoryRecipeRepository();
  // Other repos can stay as `null as unknown as ...` because RecipeService
  // only depends on `recipes`.
  return {
    recipes,
    users: null as never,
    mealPlans: null as never,
    shoppingLists: null as never,
    subscriptions: null as never,
    aiUsageLogs: null as never,
  };
}

describe('RecipeService', () => {
  let service: RecipeService;
  let repos: Repositories;

  beforeEach(() => {
    repos = buildRepos();
    service = new RecipeService(repos);
  });

  it('creates a recipe with a unique slug', async () => {
    const a = await service.create('user-1', { title: 'Pasta Carbonara' });
    expect(a.slug).toBe('pasta-carbonara');
    expect(a.source).toBe('user');
    expect(a.authorId).toBe('user-1');
  });

  it('disambiguates the slug when the same title is used twice', async () => {
    await service.create('u', { title: 'Pizza' });
    const b = await service.create('u', { title: 'Pizza' });
    expect(b.slug).toMatch(/^pizza(-\d+)?$/);
    expect(b.slug).not.toBe('pizza');
  });

  it('forbids editing another user\'s recipe', async () => {
    const r = await service.create('alice', { title: 'Soup' });
    await expect(service.update(r.id, 'bob', { title: 'Hacked' })).rejects.toThrow(
      /author/i,
    );
  });

  it('throws NotFoundError for an unknown recipe', async () => {
    await expect(service.get('does-not-exist')).rejects.toBeInstanceOf(NotFoundError);
  });
});
