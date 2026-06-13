import { Router } from 'express';
import { z } from 'zod';
import type { AppContainer } from '../container.js';
import { requireAuth, type AuthedRequest } from '../middlewares/auth.js';
import { aiGenerateRateLimit } from '../middlewares/rateLimit.js';
import { NotFoundError } from '../repositories/interfaces.js';
import { aiQueue } from '../queue/ai-queue.js';

const createSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const addEntrySchema = z.object({
  recipeId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  servings: z.number().positive().optional(),
});

const aiGenerateSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export function mealPlansRouter(container: AppContainer): Router {
  const router = Router();
  const { mealPlans } = container.services;

  router.use(requireAuth);

  router.get('/', async (req: AuthedRequest, res, next) => {
    try {
      res.json(await mealPlans.listMine(req.userId!));
    } catch (e) {
      next(e);
    }
  });

  router.post('/', async (req: AuthedRequest, res, next) => {
    try {
      const { weekStart } = createSchema.parse(req.body);
      res.status(201).json(await mealPlans.createManual(req.userId!, weekStart));
    } catch (e) {
      next(e);
    }
  });

  router.get('/:id', async (req: AuthedRequest, res, next) => {
    try {
      res.json(await mealPlans.get(req.params.id, req.userId!));
    } catch (e) {
      if (e instanceof NotFoundError) return res.status(404).json({ code: 'NOT_FOUND', message: e.message });
      next(e);
    }
  });

  router.delete('/:id', async (req: AuthedRequest, res, next) => {
    try {
      await mealPlans.delete(req.params.id, req.userId!);
      res.status(204).end();
    } catch (e) {
      if (e instanceof NotFoundError) return res.status(404).json({ code: 'NOT_FOUND', message: e.message });
      next(e);
    }
  });

  router.post('/:id/entries', async (req: AuthedRequest, res, next) => {
    try {
      const data = addEntrySchema.parse(req.body);
      const entry = await mealPlans.addEntry(req.params.id, req.userId!, {
        recipeId: data.recipeId,
        dayOfWeek: data.dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        mealType: data.mealType,
        servings: data.servings,
      });
      res.status(201).json(entry);
    } catch (e) {
      next(e);
    }
  });

  router.delete('/:id/entries/:entryId', async (req: AuthedRequest, res, next) => {
    try {
      await mealPlans.removeEntry(req.params.id, req.userId!, req.params.entryId);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  /**
   * Queue a Claude meal-plan generation job. Available to ALL plans:
   *   - Free users get a titles-only menu preview (the worker picks the mode
   *     based on user.plan; see services/ai/meal-plan-generator.ts).
   *   - Pro users get full recipes with ingredients, macros, etc.
   *
   * Rate-limited via `aiGenerateRateLimit` — Free is throttled aggressively
   * (1 generation per week) to keep Claude costs in check.
   */
  router.post(
    '/ai/generate',
    aiGenerateRateLimit(container),
    async (req: AuthedRequest, res, next) => {
      try {
        const data = aiGenerateSchema.parse(req.body);
        const job = await aiQueue.add('meal_plan', {
          userId: req.userId!,
          type: 'meal_plan',
          input: { weekStart: data.weekStart },
        });
        res.status(202).json({ jobId: job.id, status: 'queued' });
      } catch (e) {
        next(e);
      }
    },
  );

  router.get('/ai/jobs/:jobId', async (req, res, next) => {
    try {
      const job = await aiQueue.getJob(req.params.jobId);
      if (!job) return res.status(404).json({ code: 'NOT_FOUND', message: 'Job not found' });
      const state = await job.getState();
      const result = job.returnvalue ?? null;
      res.json({ id: job.id, state, result, failedReason: job.failedReason ?? null });
    } catch (e) {
      next(e);
    }
  });

  return router;
}
