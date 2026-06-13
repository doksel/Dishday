import { Router } from 'express';
import { z } from 'zod';
import { isSupportedLocale } from '@dishday/i18n';
import type { AppContainer } from '../container.js';
import { requireAuth, type AuthedRequest } from '../middlewares/auth.js';
import { LimitReachedError, NotFoundError, PlanRequiredError } from '../repositories/interfaces.js';

/** Map a LimitReachedError to a 402 response with structured body. */
function send402Limit(res: import('express').Response, err: LimitReachedError) {
  return res.status(402).json({
    code: 'LIMIT_REACHED',
    message: err.message,
    kind: err.kind,
    limit: err.limit,
    current: err.current,
  });
}

/**
 * BCP-47 → string map (`{ en: 'Pasta', ru: 'Паста' }`). Only known locale
 * codes from `@dishday/i18n` SUPPORTED_LOCALES are accepted; unknown codes
 * are dropped. Empty objects are normalised to `null`.
 */
const localizedTextSchema = z
  .record(z.string(), z.string().min(1))
  .transform((raw) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (isSupportedLocale(k)) out[k] = v;
    }
    return Object.keys(out).length > 0 ? out : null;
  })
  .nullable()
  .optional();

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
  nameI18n: localizedTextSchema,
  quantity: z.number().positive(),
  unit: z.string().min(1),
  notes: z.string().nullable().optional(),
  orderIndex: z.number().int().nonnegative().optional(),
});

const createRecipeSchema = z.object({
  title: z.string().min(1).max(255),
  titleI18n: localizedTextSchema,
  description: z.string().nullable().optional(),
  descriptionI18n: localizedTextSchema,
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

  router.get('/:id', requireAuth, async (req: AuthedRequest, res, next) => {
    try {
      res.json(await recipes.get(req.params.id, req.userId));
    } catch (e) {
      if (e instanceof NotFoundError) {
        return res.status(404).json({ code: 'NOT_FOUND', message: e.message });
      }
      if (e instanceof PlanRequiredError) {
        // Include the title as a "teaser" so the client can show a paywall
        // overlay over the real recipe name. We re-fetch the row directly
        // from the repo to bypass the gate (we know it exists).
        const r = await container.repos.recipes.findById(req.params.id);
        return res.status(402).json({
          code: 'PLAN_REQUIRED',
          message: e.message,
          teaser: r ? { id: r.id, title: r.title, titleI18n: r.titleI18n } : null,
        });
      }
      next(e);
    }
  });

  router.post('/', requireAuth, async (req: AuthedRequest, res, next) => {
    try {
      const data = createRecipeSchema.parse(req.body);
      res.status(201).json(await recipes.create(req.userId!, data));
    } catch (e) {
      if (e instanceof LimitReachedError) return send402Limit(res, e);
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
      if (e instanceof LimitReachedError) return send402Limit(res, e);
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
