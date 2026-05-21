import { Router } from 'express';
import { z } from 'zod';
import type { AppContainer } from '../container.js';
import { requireAuth, type AuthedRequest } from '../middlewares/auth.js';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  onboardingDone: z.boolean().optional(),
});

const updateDietarySchema = z.object({
  dietaryGoals: z
    .object({
      calories: z.number().positive().optional(),
      proteinG: z.number().nonnegative().optional(),
      carbsG: z.number().nonnegative().optional(),
      fatG: z.number().nonnegative().optional(),
    })
    .optional(),
  allergies: z.array(z.string()).optional(),
  diets: z.array(z.string()).optional(),
  cookingSkill: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  householdSize: z.number().int().positive().optional(),
  preferredCuisines: z.array(z.string()).optional(),
  dislikedIngredients: z.array(z.string()).optional(),
});

export function usersRouter(container: AppContainer): Router {
  const router = Router();
  const { users } = container.repos;
  router.use(requireAuth);

  router.get('/profile', async (req: AuthedRequest, res, next) => {
    try {
      const [user, profile] = await Promise.all([
        users.findById(req.userId!),
        users.getProfile(req.userId!),
      ]);
      if (!user) return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });
      res.json({ user, profile });
    } catch (e) {
      next(e);
    }
  });

  router.put('/profile', async (req: AuthedRequest, res, next) => {
    try {
      const data = updateProfileSchema.parse(req.body);
      const user = await users.update(req.userId!, data);
      res.json(user);
    } catch (e) {
      next(e);
    }
  });

  router.patch('/dietary', async (req: AuthedRequest, res, next) => {
    try {
      const data = updateDietarySchema.parse(req.body);
      const profile = await users.upsertProfile(req.userId!, data);
      res.json(profile);
    } catch (e) {
      next(e);
    }
  });

  router.delete('/account', async (req: AuthedRequest, res, next) => {
    try {
      await users.delete(req.userId!);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  return router;
}
