import type { MealPlan, MealPlanEntry } from '@dishday/types';
import { weekStartIso } from '@dishday/utils';
import type {
  AddEntryInput,
  CreateMealPlanInput,
  Repositories,
} from '../repositories/interfaces.js';
import { NotFoundError } from '../repositories/interfaces.js';

export class MealPlanService {
  constructor(private readonly repos: Repositories) {}

  listMine(userId: string): Promise<MealPlan[]> {
    return this.repos.mealPlans.listByUser(userId);
  }

  async get(id: string, userId: string): Promise<MealPlan> {
    const plan = await this.repos.mealPlans.findById(id);
    if (!plan || plan.userId !== userId) throw new NotFoundError('MealPlan', id);
    return plan;
  }

  async createManual(userId: string, weekStart?: string): Promise<MealPlan> {
    const week = weekStart ?? weekStartIso();
    const existing = await this.repos.mealPlans.findByUserAndWeek(userId, week);
    if (existing) return existing;
    return this.repos.mealPlans.create({
      userId,
      weekStart: week,
      generatedBy: 'manual',
    } satisfies CreateMealPlanInput);
  }

  async addEntry(planId: string, userId: string, entry: AddEntryInput): Promise<MealPlanEntry> {
    const plan = await this.repos.mealPlans.findById(planId);
    if (!plan || plan.userId !== userId) throw new NotFoundError('MealPlan', planId);
    if (plan.locked) throw new Error('Plan is locked');
    return this.repos.mealPlans.addEntry(planId, entry);
  }

  async removeEntry(planId: string, userId: string, entryId: string): Promise<void> {
    const plan = await this.repos.mealPlans.findById(planId);
    if (!plan || plan.userId !== userId) throw new NotFoundError('MealPlan', planId);
    if (plan.locked) throw new Error('Plan is locked');
    await this.repos.mealPlans.removeEntry(entryId);
  }

  async toggleLock(id: string, userId: string, locked: boolean): Promise<MealPlan> {
    const plan = await this.repos.mealPlans.findById(id);
    if (!plan || plan.userId !== userId) throw new NotFoundError('MealPlan', id);
    return this.repos.mealPlans.update(id, { locked });
  }

  delete(id: string, userId: string): Promise<void> {
    return this.get(id, userId).then(() => this.repos.mealPlans.delete(id));
  }
}
