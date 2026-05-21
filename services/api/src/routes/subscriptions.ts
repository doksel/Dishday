import express, { Router } from 'express';
import { z } from 'zod';
import type Stripe from 'stripe';
import type { AppContainer } from '../container.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { requireAuth, type AuthedRequest } from '../middlewares/auth.js';
import { requireStripe } from '../services/stripe.js';

const checkoutSchema = z.object({
  priceId: z.string().optional(),
  returnUrl: z.string().url().optional(),
});

export function subscriptionsRouter(container: AppContainer): Router {
  const router = Router();
  const { subscriptions, users } = container.repos;

  router.get('/plans', (_req, res) => {
    res.json([
      {
        id: 'free',
        name: 'Free',
        priceMonthlyUsd: 0,
        features: ['Browse recipes', 'Manual meal plan', 'Shopping list'],
      },
      {
        id: 'pro',
        name: 'Pro',
        priceMonthlyUsd: 9.99,
        stripePriceId: env.STRIPE_PRICE_PRO_MONTHLY ?? null,
        features: ['AI meal plan generation', 'Pantry AI', 'Priority support'],
      },
    ]);
  });

  router.get('/status', requireAuth, async (req: AuthedRequest, res, next) => {
    try {
      const sub = await subscriptions.findActiveByUser(req.userId!);
      const user = await users.findById(req.userId!);
      res.json({ plan: user?.plan ?? 'free', subscription: sub });
    } catch (e) {
      next(e);
    }
  });

  router.post('/checkout', requireAuth, async (req: AuthedRequest, res, next) => {
    try {
      const stripe = requireStripe();
      const { priceId, returnUrl } = checkoutSchema.parse(req.body);
      const user = await users.findById(req.userId!);
      if (!user) return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: user.email,
        line_items: [{ price: priceId ?? env.STRIPE_PRICE_PRO_MONTHLY!, quantity: 1 }],
        client_reference_id: user.id,
        success_url: `${returnUrl ?? 'http://localhost:3000'}/dashboard?upgraded=1`,
        cancel_url: `${returnUrl ?? 'http://localhost:3000'}/billing?cancelled=1`,
        metadata: { userId: user.id },
      });

      res.json({ url: session.url });
    } catch (e) {
      next(e);
    }
  });

  router.post('/portal', requireAuth, async (req: AuthedRequest, res, next) => {
    try {
      const stripe = requireStripe();
      const sub = await subscriptions.findActiveByUser(req.userId!);
      if (!sub || sub.provider !== 'stripe') {
        return res.status(400).json({ code: 'NO_SUBSCRIPTION', message: 'No Stripe subscription' });
      }
      const stripeSub = await stripe.subscriptions.retrieve(sub.providerSubId);
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeSub.customer as string,
        return_url: req.body.returnUrl ?? 'http://localhost:3000/billing',
      });
      res.json({ url: session.url });
    } catch (e) {
      next(e);
    }
  });

  /**
   * Stripe webhook — verifies signature using raw body, then upserts the
   * Subscription row and flips user.plan accordingly. Mount BEFORE the
   * global JSON body parser; see app.ts.
   */
  router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const stripe = requireStripe();
      const sig = req.headers['stripe-signature'];
      if (!sig || !env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).send('Missing signature/secret');
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
      } catch (e) {
        logger.warn({ err: (e as Error).message }, 'Webhook signature verification failed');
        return res.status(400).send('Invalid signature');
      }

      try {
        switch (event.type) {
          case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.client_reference_id ?? session.metadata?.userId;
            const subId = session.subscription as string;
            if (userId && subId) {
              const sub = await stripe.subscriptions.retrieve(subId);
              await subscriptions.upsertFromProvider({
                userId,
                provider: 'stripe',
                providerSubId: sub.id,
                status: mapStripeStatus(sub.status),
                currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
              });
              await users.update(userId, {
                plan: 'pro',
                planExpiresAt: new Date(sub.current_period_end * 1000).toISOString(),
              });
            }
            break;
          }
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted': {
            const sub = event.data.object as Stripe.Subscription;
            const existing = await subscriptions.findByProviderRef('stripe', sub.id);
            if (existing) {
              await subscriptions.upsertFromProvider({
                userId: existing.userId,
                provider: 'stripe',
                providerSubId: sub.id,
                status: mapStripeStatus(sub.status),
                currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
              });
              const stillPro =
                sub.status === 'active' || sub.status === 'trialing';
              await users.update(existing.userId, {
                plan: stillPro ? 'pro' : 'free',
                planExpiresAt: new Date(sub.current_period_end * 1000).toISOString(),
              });
            }
            break;
          }
          default:
            logger.debug({ type: event.type }, 'Unhandled Stripe event');
        }
        res.json({ received: true });
      } catch (err) {
        logger.error({ err }, 'Webhook handler failed');
        res.status(500).send('Handler error');
      }
    },
  );

  return router;
}

function mapStripeStatus(s: Stripe.Subscription.Status) {
  switch (s) {
    case 'active':
      return 'active' as const;
    case 'trialing':
      return 'trialing' as const;
    case 'past_due':
    case 'unpaid':
      return 'past_due' as const;
    case 'canceled':
    case 'incomplete_expired':
    default:
      return 'cancelled' as const;
  }
}
