// Load .env BEFORE we parse process.env.
// In a monorepo, .env lives at the workspace root. We try common locations
// (closest first) so this works whether you run from services/api or from the root.
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const here = dirname(fileURLToPath(import.meta.url));

// Candidates in order of preference (closer wins on conflict because override:false)
const candidates = [
  resolve(process.cwd(), '.env'),
  resolve(here, '../../.env'), // services/api/.env (if running from compiled dist)
  resolve(here, '../../../.env'), // services/api/src/.env (tsx mode, unlikely)
  resolve(here, '../../../../.env'), // workspace root from services/api/src/config
];

for (const candidate of candidates) {
  if (existsSync(candidate)) {
    loadEnv({ path: candidate });
  }
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Database (Prisma — Supabase Postgres)
  DATABASE_URL: z.string().url(),         // Transaction pooler for runtime
  DIRECT_URL: z.string().url().optional(), // Direct connection for migrations

  // Auth — internal short-lived service tokens / Supabase JWT secret if used
  JWT_SECRET: z.string().min(32),

  // AI — optional. API starts without it; only /meal-plans/ai/* fails.
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-20250514'),

  // Payments
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),

  // Queue
  REDIS_URL: z.string().min(1),

  // CORS
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3001')
    .transform((s) => s.split(',').map((x) => x.trim())),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
  // eslint-disable-next-line no-console
  console.error('Looked for .env in:');
  for (const c of candidates) {
    // eslint-disable-next-line no-console
    console.error(`  ${existsSync(c) ? '✓' : '✗'} ${c}`);
  }
  throw new Error('Invalid environment variables — see .env.example');
}

export const env = parsed.data;
