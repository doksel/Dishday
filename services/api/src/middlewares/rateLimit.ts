/**
 * Tier-aware rate limits for the AI endpoints.
 *
 *   Each action ("ai-generate", "ai-rewrite", …) keeps its own bucket so
 *   limits don't bleed across features. Within an action, the per-tier
 *   limit/window depends on the caller's plan.
 *
 *   Storage is an in-process `Map<bucketKey, timestamp[]>`. Fine for
 *   single-node dev / a small Railway dyno. When we scale out we'll swap
 *   this for a Redis sorted-set.
 */

import type { NextFunction, Response } from 'express';
import type { AppContainer } from '../container.js';
import type { AuthedRequest } from './auth.js';

interface ActionLimits {
  /** Free tier: { limit, windowMs }. Use limit=0 if Free should be blocked entirely. */
  free: { limit: number; windowMs: number };
  /** Pro / admin tier. */
  pro: { limit: number; windowMs: number };
}

/**
 * Per-action limits. Tweaking these is the easiest knob if Claude bills get
 * scary — bump down windows or limits without touching any route code.
 */
const LIMITS = {
  'ai-generate': {
    free: { limit: 1, windowMs: 7 * 24 * 60 * 60 * 1000 }, // 1 / week
    pro: { limit: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10 / day
  },
  'ai-rewrite': {
    // Free is blocked at the service layer (Pro-only feature) — limit=0 here
    // is defensive; the 402 should fire first.
    free: { limit: 0, windowMs: 24 * 60 * 60 * 1000 },
    pro: { limit: 20, windowMs: 24 * 60 * 60 * 1000 }, // 20 / day
  },
} satisfies Record<string, ActionLimits>;

type Action = keyof typeof LIMITS;

/** `${action}:${userId}` → timestamps of recent hits (ms epoch). */
const hits = new Map<string, number[]>();

function key(action: Action, userId: string) {
  return `${action}:${userId}`;
}

function record(action: Action, userId: string, now: number) {
  const k = key(action, userId);
  const arr = hits.get(k) ?? [];
  arr.push(now);
  hits.set(k, arr);
}

function prune(action: Action, userId: string, now: number, windowMs: number): number[] {
  const k = key(action, userId);
  const arr = hits.get(k) ?? [];
  const kept = arr.filter((ts) => now - ts < windowMs);
  hits.set(k, kept);
  return kept;
}

function makeRateLimit(action: Action) {
  return function rateLimit(container: AppContainer) {
    return async function (req: AuthedRequest, res: Response, next: NextFunction) {
      if (!req.userId) {
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing user' });
      }
      try {
        const user = await container.repos.users.findById(req.userId);
        const plan = user?.plan ?? 'free';
        const isPro = plan === 'pro' || plan === 'admin';
        const tier = isPro ? LIMITS[action].pro : LIMITS[action].free;

        // limit=0 means "this tier is not allowed at all" — short-circuit.
        if (tier.limit <= 0) {
          return res.status(429).json({
            code: 'RATE_LIMITED',
            message: 'This action is not available on your plan.',
          });
        }

        const now = Date.now();
        const kept = prune(action, req.userId, now, tier.windowMs);

        if (kept.length >= tier.limit) {
          const oldest = kept[0]!;
          const retryAfterSec = Math.max(1, Math.ceil((oldest + tier.windowMs - now) / 1000));
          res.setHeader('Retry-After', String(retryAfterSec));
          return res.status(429).json({
            code: 'RATE_LIMITED',
            message: isPro
              ? `Pro limit reached (${tier.limit}/window). Try again later.`
              : `Free limit reached (${tier.limit}/window). Upgrade for more.`,
            retryAfterSec,
          });
        }

        record(action, req.userId, now);
        next();
      } catch (err) {
        next(err);
      }
    };
  };
}

export const aiGenerateRateLimit = makeRateLimit('ai-generate');
export const aiRewriteRateLimit = makeRateLimit('ai-rewrite');
