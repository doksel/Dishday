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
    // Include entries + recipe basics (title, macros) but NOT ingredients —
    // list view shows only recipe titles in slots; shopping list calls
    // `findById` separately when it needs the full ingredient breakdown.
    const plans = await this.prisma.mealPlan.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
      include: {
        entries: {
          include: { recipe: true },
          orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
        },
      },
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

  /**
   * Replace whatever dish currently occupies the (planId, dayOfWeek, mealType)
   * slot with `entry.recipeId`. Idempotent — calling twice with the same args
   * lands the same final state. Runs inside a transaction so a partial write
   * can't leave the slot empty.
   *
   * The DB-level unique constraint on (plan_id, day_of_week, meal_type) is
   * the ultimate safety net (see migration 20260612190000_unique_meal_plan_slot);
   * this method's job is to make the API ergonomic for "set this slot to X".
   */
  async addEntry(planId: string, entry: AddEntryInput): Promise<MealPlanEntry> {
    const e = await this.prisma.$transaction(async (tx) => {
      await tx.mealPlanEntry.deleteMany({
        where: { planId, dayOfWeek: entry.dayOfWeek, mealType: entry.mealType },
      });
      return tx.mealPlanEntry.create({
        data: {
          planId,
          recipeId: entry.recipeId,
          dayOfWeek: entry.dayOfWeek,
          mealType: entry.mealType,
          servings: entry.servings ?? 1,
        },
        include: { recipe: { include: { ingredients: { orderBy: { orderIndex: 'asc' } } } } },
      });
    });
    return mealPlanEntryFromPrisma(e);
  }

  async removeEntry(entryId: string): Promise<void> {
    await this.prisma.mealPlanEntry.delete({ where: { id: entryId } });
  }
}
