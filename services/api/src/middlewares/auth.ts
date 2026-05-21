import type { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

export interface AuthedRequest extends Request {
  userId?: string;
  userJwt?: string;
}

/**
 * Verify a Supabase access token (JWT) sent as `Authorization: Bearer <token>`.
 * Attaches userId & raw JWT for downstream RLS-aware queries.
 */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing bearer token' });
  }

  const token = header.slice(7);
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid token' });
    }
    req.userId = data.user.id;
    req.userJwt = token;
    next();
  } catch {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Token verification failed' });
  }
}
