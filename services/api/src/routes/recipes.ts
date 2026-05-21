import { Router } from 'express';
import { z } from 'zod';
import type { AppContainer } from '../container.js';
import { requireAuth, type AuthedRequest } from '../middlewares/auth.js';
import { NotFoundError } from '../repositories/interfaces.js';

const listQuerySchema = z.object({
  q: z.string().optional(),
  cuisine: z.string().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  source: z.enum(['user', 'ai', 'official']).optional(),
  tags: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : undefined)),
  maxPrepTime: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
});

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  notes: z.string().nullable().optional(),
  orderIndex: z.number().int().nonnegative().optional(),
});

const createRecipeSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  prepTimeMin: z.number().int().nonnegative().nullable().optional(),
  cookTimeMin: z.number().int().nonnegative().nullable().optional(),
  servings: z.number().int().positive().optional(),
  caloriesPerServing: z.number().nullable().optional(),
  proteinG: z.number().nullable().optional(),
  carbsG: z.number().nullable().optional(),
  fatG: z.number().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  tags: z.array(z.string()).optional(),
  cuisine: z.string().nullable().optional(),
  mealType: z.array(z.enum(['breakfast', 'lunch', 'dinner', 'snack'])).optional(),
  ingredients: z.array(ingredientSchema).optional(),
});

const updateRecipeSchema = createRecipeSchema.partial();

export function recipesRouter(container: AppContainer): Router {
  const router = Router();
  const { recipes } = container.services;

  router.get('/', async (req, res, next) => {
    try {
      res.json(await recipes.list(listQuerySchema.parse(req.query)));
    } catch (e) {
      next(e);
    }
  });

  router.get('/bookmarks', requireAuth, async (req: AuthedRequest, res, next) => {
    try {
      res.json(await recipes.listBookmarks(req.userId!));
    } catch (e) {
      next(e);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      res.json(await recipes.get(req.params.id));
    } catch (e) {
      if (e instanceof NotFoundError) return res.status(404).json({ code: 'NOT_FOUND', message: e.message });
      next(e);
    }
  });

  router.post('/', requireAuth, async (req: AuthedRequest, res, next) => {
    try {
      const data = createRecipeSchema.parse(req.body);
      res.status(201).json(await recipes.create(req.userId!, data));
    } catch (e) {
      next(e);
    }
  });

  router.put('/:id', requireAuth, async (req: AuthedRequest, res, next) => {
    try {
      const data = updateRecipeSchema.parse(req.body);
      res.json(await recipes.update(req.params.id, req.userId!, data));
    } catch (e) {
      if (e instanceof NotFoundError) return res.status(404).json({ code: 'NOT_FOUND', message: e.message });
      next(e);
    }
  });

  router.delete('/:id', requireAuth, async (req: AuthedRequest, res, next) => {
    try {
      await recipes.delete(req.params.id, req.userId!);
      res.status(204).end();
    } catch (e) {
      if (e instanceof NotFoundError) return res.status(404).json({ code: 'NOT_FOUND', message: e.message });
      next(e);
    }
  });

  router.post('/:id/bookmark', requireAuth, async (req: AuthedRequest, res, next) => {
    try {
      await recipes.bookmark(req.userId!, req.params.id);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  router.delete('/:id/bookmark', requireAuth, async (req: AuthedRequest, res, next) => {
    try {
      await recipes.unbookmark(req.userId!, req.params.id);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  return router;
}
