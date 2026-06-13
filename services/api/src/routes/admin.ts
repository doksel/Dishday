/**
 * Admin routes — moderation of user-submitted recipes.
 *
 *   Mount under `/v1/admin`. Every route requires:
 *     1. a valid Supabase JWT (`requireAuth`)
 *     2. the user's `plan === 'admin'` (`requireAdmin`)
 *
 *   Endpoints
 *     GET    /recipes?status=pending|approved|rejected|all   list for moderation
 *     POST   /recipes/:id/approve                            isApproved → true
 *     POST   /recipes/:id/reject                             isPublic   → false (soft delete)
 *
 *   "Reject" is soft so a misclick is recoverable — admin can change status
 *   back to "all" and re-approve. A hard DELETE endpoint is intentionally
 *   left out for now.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { AppContainer } from '../container.js';
import { requireAuth, type AuthedRequest } from '../middlewares/auth.js';
import { requireAdmin } from '../middlewares/admin.js';
import { NotFoundError } from '../repositories/interfaces.js';

const listQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'all']).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export function adminRouter(container: AppContainer): Router {
  const router = Router();
  const { recipes } = container.repos;

  router.use(requireAuth, requireAdmin(container));

  router.get('/recipes', async (req: AuthedRequest, res, next) => {
    try {
      const filter = listQuerySchema.parse(req.query);
      res.json(await recipes.listForModeration(filter));
    } catch (e) {
      next(e);
    }
  });

  router.post('/recipes/:id/approve', async (req: AuthedRequest, res, next) => {
    try {
      const updated = await recipes.update(req.params.id, { isApproved: true });
      res.json(updated);
    } catch (e) {
      if (e instanceof NotFoundError) {
        return res.status(404).json({ code: 'NOT_FOUND', message: e.message });
      }
      next(e);
    }
  });

  router.post('/recipes/:id/reject', async (req: AuthedRequest, res, next) => {
    try {
      const updated = await recipes.update(req.params.id, { isPublic: false });
      res.json(updated);
    } catch (e) {
      if (e instanceof NotFoundError) {
        return res.status(404).json({ code: 'NOT_FOUND', message: e.message });
      }
      next(e);
    }
  });

  return router;
}
