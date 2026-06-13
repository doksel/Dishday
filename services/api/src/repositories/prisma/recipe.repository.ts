import type { Prisma, PrismaClient } from '@prisma/client';
import type { Paginated, Recipe, RecipeFilter } from '@dishday/types';
import type {
  CreateRecipeInput,
  ModerationFilter,
  RecipeRepository,
  UpdateRecipeInput,
} from '../interfaces.js';
import { recipeFromPrisma } from './mappers.js';

export class PrismaRecipeRepository implements RecipeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Recipe | null> {
    const r = await this.prisma.recipe.findUnique({
      where: { id },
      include: { ingredients: { orderBy: { orderIndex: 'asc' } } },
    });
    return r ? recipeFromPrisma(r) : null;
  }

  async findBySlug(slug: string): Promise<Recipe | null> {
    const r = await this.prisma.recipe.findUnique({
      where: { slug },
      include: { ingredients: { orderBy: { orderIndex: 'asc' } } },
    });
    return r ? recipeFromPrisma(r) : null;
  }

  async list(filter: RecipeFilter): Promise<Paginated<Recipe>> {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));

    const where: Prisma.RecipeWhereInput = {
      isPublic: true,
      isApproved: true,
      ...(filter.q && {
        OR: [
          { title: { contains: filter.q, mode: 'insensitive' } },
          { description: { contains: filter.q, mode: 'insensitive' } },
        ],
      }),
      ...(filter.cuisine && { cuisine: filter.cuisine }),
      ...(filter.source && { source: filter.source }),
      ...(filter.mealType && { mealType: { has: filter.mealType } }),
      ...(filter.tags?.length && { tags: { hasEvery: filter.tags } }),
      ...(filter.maxPrepTime !== undefined && { prepTimeMin: { lte: filter.maxPrepTime } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    return { items: items.map((r) => recipeFromPrisma(r)), total, page, pageSize };
  }

  async listForModeration(filter: ModerationFilter): Promise<Paginated<Recipe>> {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));
    const status = filter.status ?? 'pending';

    let where: Prisma.RecipeWhereInput;
    switch (status) {
      case 'pending':
        where = { isPublic: true, isApproved: false };
        break;
      case 'approved':
        where = { isApproved: true };
        break;
      case 'rejected':
        where = { isPublic: false };
        break;
      case 'all':
      default:
        where = {};
    }

    const [items, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { ingredients: { orderBy: { orderIndex: 'asc' } } },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    return { items: items.map((r) => recipeFromPrisma(r)), total, page, pageSize };
  }

  async create(data: CreateRecipeInput): Promise<Recipe> {
    const created = await this.prisma.recipe.create({
      data: {
        title: data.title,
        ...(data.titleI18n !== undefined && { titleI18n: data.titleI18n ?? undefined }),
        slug: data.slug,
        description: data.description ?? null,
        ...(data.descriptionI18n !== undefined && {
          descriptionI18n: data.descriptionI18n ?? undefined,
        }),
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
        previewOnly: data.previewOnly ?? false,
        tags: data.tags ?? [],
        cuisine: data.cuisine ?? null,
        mealType: data.mealType ?? [],
        ...(data.ingredients?.length && {
          ingredients: {
            create: data.ingredients.map((ing) => ({
              name: ing.name,
              ...(ing.nameI18n != null && { nameI18n: ing.nameI18n }),
              quantity: ing.quantity,
              unit: ing.unit,
              notes: ing.notes ?? null,
              orderIndex: ing.orderIndex ?? 0,
            })),
          },
        }),
      },
      include: { ingredients: { orderBy: { orderIndex: 'asc' } } },
    });
    return recipeFromPrisma(created);
  }

  async update(id: string, data: UpdateRecipeInput): Promise<Recipe> {
    const updated = await this.prisma.recipe.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.titleI18n !== undefined && { titleI18n: data.titleI18n ?? undefined }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.descriptionI18n !== undefined && {
          descriptionI18n: data.descriptionI18n ?? undefined,
        }),
        ...(data.prepTimeMin !== undefined && { prepTimeMin: data.prepTimeMin }),
        ...(data.cookTimeMin !== undefined && { cookTimeMin: data.cookTimeMin }),
        ...(data.servings !== undefined && { servings: data.servings }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.isApproved !== undefined && { isApproved: data.isApproved }),
        ...(data.previewOnly !== undefined && { previewOnly: data.previewOnly }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.cuisine !== undefined && { cuisine: data.cuisine }),
        ...(data.mealType !== undefined && { mealType: data.mealType }),
      },
      include: { ingredients: { orderBy: { orderIndex: 'asc' } } },
    });
    return recipeFromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.recipe.delete({ where: { id } });
  }

  async bookmark(userId: string, recipeId: string): Promise<void> {
    await this.prisma.recipeBookmark.upsert({
      where: { userId_recipeId: { userId, recipeId } },
      create: { userId, recipeId },
      update: {},
    });
  }

  async unbookmark(userId: string, recipeId: string): Promise<void> {
    await this.prisma.recipeBookmark
      .delete({ where: { userId_recipeId: { userId, recipeId } } })
      .catch(() => undefined);
  }

  async listBookmarks(userId: string): Promise<Recipe[]> {
    const rows = await this.prisma.recipeBookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { recipe: { include: { ingredients: { orderBy: { orderIndex: 'asc' } } } } },
    });
    return rows.map((r) => recipeFromPrisma(r.recipe));
  }

  countBookmarks(userId: string): Promise<number> {
    return this.prisma.recipeBookmark.count({ where: { userId } });
  }

  countUserRecipes(userId: string): Promise<number> {
    return this.prisma.recipe.count({ where: { authorId: userId, source: 'user' } });
  }
}
