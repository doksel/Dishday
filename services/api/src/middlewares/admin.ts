/**
 * Admin guard.
 *
 *   Runs *after* `requireAuth` — it relies on `req.userId` being set. Loads
 *   the user record and rejects with `403 FORBIDDEN` unless `plan === 'admin'`.
 *
 *   Factory pattern (matches other middleware in this codebase) so we can
 *   inject the user repository from the composition root and keep the
 *   middleware itself trivially unit-testable.
 */

import type { NextFunction, Response } from 'express';
import type { AppContainer } from '../container.js';
import type { AuthedRequest } from './auth.js';

export function requireAdmin(container: AppContainer) {
  const users = container.repos.users;

  return async function (req: AuthedRequest, res: Response, next: NextFunction) {
    if (!req.userId) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing user' });
    }
    try {
      const user = await users.findById(req.userId);
      if (!user || user.plan !== 'admin') {
        return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin only' });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
