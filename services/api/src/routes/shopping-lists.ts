import { Router } from 'express';
import { z } from 'zod';
import type { AppContainer } from '../container.js';
import { requireAuth, type AuthedRequest } from '../middlewares/auth.js';

const toggleSchema = z.object({ isChecked: z.boolean() });
const addItemSchema = z.object({
  ingredientName: z.string().min(1),
  totalQuantity: z.number().positive(),
  unit: z.string().min(1),
  category: z.string().nullable().optional(),
});

export function shoppingListsRouter(container: AppContainer): Router {
  const router = Router();
  const { shoppingLists, mealPlans } = container.repos;
  router.use(requireAuth);

  /** Get or auto-generate shopping list for a meal plan */
  router.get('/:planId', async (req: AuthedRequest, res, next) => {
    try {
      const plan = await mealPlans.findById(req.params.planId);
      if (!plan || plan.userId !== req.userId) {
        return res.status(404).json({ code: 'NOT_FOUND', message: 'Plan not found' });
      }

      let list = await shoppingLists.findByPlan(req.params.planId);
      if (!list) list = await consolidate(container, plan.id, req.userId!);
      res.json(list);
    } catch (e) {
      next(e);
    }
  });

  router.post('/generate', async (req: AuthedRequest, res, next) => {
    try {
      const { planId } = z.object({ planId: z.string().uuid() }).parse(req.body);
      const plan = await mealPlans.findById(planId);
      if (!plan || plan.userId !== req.userId) {
        return res.status(404).json({ code: 'NOT_FOUND', message: 'Plan not found' });
      }
      // Drop old list, recompute
      const old = await shoppingLists.findByPlan(planId);
      if (old) await shoppingLists.delete(old.id);
      const fresh = await consolidate(container, planId, req.userId!);
      res.status(201).json(fresh);
    } catch (e) {
      next(e);
    }
  });

  router.patch('/:id/items/:itemId', async (req: AuthedRequest, res, next) => {
    try {
      const { isChecked } = toggleSchema.parse(req.body);
      await shoppingLists.toggleItem(req.params.itemId, isChecked);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  router.post('/:id/items', async (req: AuthedRequest, res, next) => {
    try {
      const data = addItemSchema.parse(req.body);
      const item = await shoppingLists.addItem(req.params.id, data);
      res.status(201).json(item);
    } catch (e) {
      next(e);
    }
  });

  router.delete('/:id/items/:itemId', async (req: AuthedRequest, res, next) => {
    try {
      await shoppingLists.removeItem(req.params.itemId);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  return router;
}

/** Consolidate ingredients across all entries of a meal plan. */
async function consolidate(container: AppContainer, planId: string, userId: string) {
  const plan = await container.repos.mealPlans.findById(planId);
  if (!plan) throw new Error('Plan not found');

  type Key = string; // `${name}|${unit}`
  const map = new Map<Key, { ingredientName: string; totalQuantity: number; unit: string }>();

  for (const entry of plan.entries ?? []) {
    const ingredients = entry.recipe?.ingredients ?? [];
    for (const ing of ingredients) {
      const key = `${ing.name.toLowerCase()}|${ing.unit.toLowerCase()}`;
      const factor = entry.servings;
      const existing = map.get(key);
      if (existing) existing.totalQuantity += ing.quantity * factor;
      else
        map.set(key, {
          ingredientName: ing.name,
          totalQuantity: ing.quantity * factor,
          unit: ing.unit,
        });
    }
  }

  return container.repos.shoppingLists.create({
    planId,
    userId,
    items: [...map.values()].map((v) => ({ ...v, category: null })),
  });
}
