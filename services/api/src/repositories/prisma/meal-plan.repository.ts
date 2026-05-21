import type { PrismaClient } from '@prisma/client';
import type { MealPlan, MealPlanEntry } from '@dishday/types';
import type {
  AddEntryInput,
  CreateMealPlanInput,
  MealPlanRepository,
} from '../interfaces.js';
import { mealPlanEntryFromPrisma, mealPlanFromPrisma } from './mappers.js';

const FULL_INCLUDE = {
  entries: {
    include: { recipe: { include: { ingredients: { orderBy: { orderIndex: 'asc' as const } } } } },
    orderBy: [{ dayOfWeek: 'asc' as const }, { mealType: 'asc' as const }],
  },
};

export class PrismaMealPlanRepository implements MealPlanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<MealPlan | null> {
    const p = await this.prisma.mealPlan.findUnique({ where: { id }, include: FULL_INCLUDE });
    return p ? mealPlanFromPrisma(p) : null;
  }

  async findByUserAndWeek(userId: string, weekStart: string): Promise<MealPlan | null> {
    const p = await this.prisma.mealPlan.findUnique({
      where: { userId_weekStart: { userId, weekStart: new Date(weekStart) } },
      include: FULL_INCLUDE,
    });
    return p ? mealPlanFromPrisma(p) : null;
  }

  async listByUser(userId: string): Promise<MealPlan[]> {
    const plans = await this.prisma.mealPlan.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
    });
    return plans.map((p) => mealPlanFromPrisma(p));
  }

  async create(data: CreateMealPlanInput): Promise<MealPlan> {
    const p = await this.prisma.mealPlan.create({
      data: {
        userId: data.userId,
        weekStart: new Date(data.weekStart),
        generatedBy: data.generatedBy,
        aiPromptSummary: data.aiPromptSummary ?? null,
      },
      include: FULL_INCLUDE,
    });
    return mealPlanFromPrisma(p);
  }

  async update(
    id: string,
    data: { locked?: boolean; aiPromptSummary?: string | null },
  ): Promise<MealPlan> {
    const p = await this.prisma.mealPlan.update({
      where: { id },
      data: {
        ...(data.locked !== undefined && { locked: data.locked }),
        ...(data.aiPromptSummary !== undefined && { aiPromptSummary: data.aiPromptSummary }),
      },
      include: FULL_INCLUDE,
    });
    return mealPlanFromPrisma(p);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.mealPlan.delete({ where: { id } });
  }

  async addEntry(planId: string, entry: AddEntryInput): Promise<MealPlanEntry> {
    const e = await this.prisma.mealPlanEntry.create({
      data: {
        planId,
        recipeId: entry.recipeId,
        dayOfWeek: entry.dayOfWeek,
        mealType: entry.mealType,
        servings: entry.servings ?? 1,
      },
      include: { recipe: { include: { ingredients: { orderBy: { orderIndex: 'asc' } } } } },
    });
    return mealPlanEntryFromPrisma(e);
  }

  async removeEntry(entryId: string): Promise<void> {
    await this.prisma.mealPlanEntry.delete({ where: { id: entryId } });
  }
}
