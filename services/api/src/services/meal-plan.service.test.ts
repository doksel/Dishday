import { describe, expect, it } from 'vitest';
import { weekStartIso } from '@dishday/utils';
import { MealPlanService } from './meal-plan.service.js';
import type { MealPlanRepository, Repositories } from '../repositories/interfaces.js';

/** Minimal stub: only exercise what MealPlanService touches. */
class StubMealPlanRepository implements MealPlanRepository {
  private byId = new Map<string, any>();
  async findById(id: string) { return this.byId.get(id) ?? null; }
  async findByUserAndWeek(userId: string, weekStart: string) {
    return [...this.byId.values()].find((p) => p.userId === userId && p.weekStart === weekStart) ?? null;
  }
  async listByUser(userId: string) {
    return [...this.byId.values()].filter((p) => p.userId === userId);
  }
  async create(data: any) {
    const plan = { id: `plan-${this.byId.size + 1}`, ...data, locked: false, createdAt: '2026-01-01T00:00:00Z', entries: [] };
    this.byId.set(plan.id, plan);
    return plan;
  }
  async update(id: string, data: any) {
    const p = { ...this.byId.get(id), ...data };
    this.byId.set(id, p);
    return p;
  }
  async delete(id: string) { this.byId.delete(id); }
  async addEntry(planId: string, entry: any) {
    const p = this.byId.get(planId);
    const e = { id: `e-${(p.entries.length ?? 0) + 1}`, planId, ...entry };
    p.entries.push(e);
    return e;
  }
  async removeEntry(entryId: string) {
    for (const p of this.byId.values()) p.entries = p.entries.filter((e: any) => e.id !== entryId);
  }
}

describe('MealPlanService', () => {
  it('createManual returns existing plan if one exists for the same week', async () => {
    const repos = { mealPlans: new StubMealPlanRepository() } as unknown as Repositories;
    const service = new MealPlanService(repos);
    const week = weekStartIso();
    const a = await service.createManual('u', week);
    const b = await service.createManual('u', week);
    expect(b.id).toBe(a.id);
  });

  it('toggleLock blocks editing locked plans', async () => {
    const repos = { mealPlans: new StubMealPlanRepository() } as unknown as Repositories;
    const service = new MealPlanService(repos);
    const plan = await service.createManual('u');
    await service.toggleLock(plan.id, 'u', true);
    await expect(
      service.addEntry(plan.id, 'u', { recipeId: 'r', dayOfWeek: 0, mealType: 'lunch' }),
    ).rejects.toThrow(/locked/i);
  });
});
