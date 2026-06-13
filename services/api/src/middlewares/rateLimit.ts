/**
 * Tier-aware rate limit for the AI meal-plan generator.
 *
 *   Free: 1 generation per rolling 7 days. The number is intentionally tiny —
 *         each Claude call costs us real money and the Free experience is a
 *         "menu preview" that doesn't need refreshing daily.
 *   Pro / admin: 10 per rolling 24 hours. Soft anti-abuse cap; legitimate
 *         users rarely cross 1-2/day.
 *
 *   Storage is an in-process `Map<userId, timestamp[]>`. Fine for single-node
 *   dev / a small Railway dyno. When we scale out we'll swap this for a Redis
 *   sorted-set keyed by userId.
 */

import type { NextFunction, Response } from 'express';
import type { AppContainer } from '../container.js';
import type { AuthedRequest } from './auth.js';

const FREE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const FREE_LIMIT = 1;
const PRO_WINDOW_MS = 24 * 60 * 60 * 1000;
const PRO_LIMIT = 10;

/** userId → timestamps of recent successful enqueues (ms epoch). */
const hits = new Map<string, number[]>();

function record(userId: string, now: number) {
  const arr = hits.get(userId) ?? [];
  arr.push(now);
  hits.set(userId, arr);
}

function prune(userId: string, now: number, windowMs: number): number[] {
  const arr = hits.get(userId) ?? [];
  const kept = arr.filter((ts) => now - ts < windowMs);
  hits.set(userId, kept);
  return kept;
}

export function aiGenerateRateLimit(container: AppContainer) {
  return async function (req: AuthedRequest, res: Response, next: NextFunction) {
    if (!req.userId) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing user' });
    }
    try {
      const user = await container.repos.users.findById(req.userId);
      const plan = user?.plan ?? 'free';
      const isPro = plan === 'pro' || plan === 'admin';
      const windowMs = isPro ? PRO_WINDOW_MS : FREE_WINDOW_MS;
      const limit = isPro ? PRO_LIMIT : FREE_LIMIT;

      const now = Date.now();
      const kept = prune(req.userId, now, windowMs);

      if (kept.length >= limit) {
        const oldest = kept[0]!;
        const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
        res.setHeader('Retry-After', String(retryAfterSec));
        return res.status(429).json({
          code: 'RATE_LIMITED',
          message: isPro
            ? `Pro generation limit reached (${limit}/day). Try again later.`
            : `Free generation limit reached (${limit}/week). Upgrade for more.`,
          retryAfterSec,
        });
      }

      record(req.userId, now);
      next();
    } catch (err) {
      next(err);
    }
  };
}
