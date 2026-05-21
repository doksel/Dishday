import { Router } from 'express';
import type { AppContainer } from '../container.js';
import { requireAuth, type AuthedRequest } from '../middlewares/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Auth router — Supabase manages the actual identity (signup, login, OAuth,
 * password reset). The API only verifies access tokens and exposes
 * application-level shape via /auth/me.
 *
 * On first call /auth/me for a Supabase user, we lazily create the
 * corresponding row in our `users` table.
 */
export function authRouter(container: AppContainer): Router {
  const router = Router();
  const { users } = container.repos;

  router.get('/me', requireAuth, async (req: AuthedRequest, res, next) => {
    try {
      const userId = req.userId!;
      let user = await users.findById(userId);

      if (!user) {
        // Lazily mirror auth.users → public.users on first authenticated request.
        const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
        const sb = data.user;
        if (!sb?.email) {
          return res.status(404).json({ code: 'NOT_FOUND', message: 'Supabase user not found' });
        }
        user = await users.create({
          id: userId,
          email: sb.email,
          name: (sb.user_metadata?.name as string) ?? sb.email.split('@')[0],
          avatarUrl: (sb.user_metadata?.avatar_url as string | null) ?? null,
        });
      }

      const profile = await users.getProfile(userId);
      res.json({ user, profile });
    } catch (e) {
      next(e);
    }
  });

  router.post('/logout', requireAuth, async (req: AuthedRequest, res) => {
    // Supabase manages the session; the client should also call
    // supabase.auth.signOut(). Here we could revoke refresh tokens
    // server-side via supabaseAdmin.auth.admin.signOut(jwt) if needed.
    if (req.userJwt) {
      await supabaseAdmin.auth.admin.signOut(req.userJwt).catch(() => undefined);
    }
    res.json({ ok: true });
  });

  return router;
}
