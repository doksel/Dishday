import Stripe from 'stripe';
import { env } from '../config/env.js';

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' })
  : null;

export function requireStripe(): Stripe {
  if (!stripe) throw new Error('Stripe is not configured (set STRIPE_SECRET_KEY)');
  return stripe;
}
