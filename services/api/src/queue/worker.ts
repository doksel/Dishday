/**
 * Standalone worker entry point.
 *
 * Run alongside the API:
 *   npm run worker -w @dishday/api      (dev, tsx watch)
 *   node dist/queue/worker.js           (prod, after `npm run build`)
 *
 * The worker connects to the same Redis as the API, picks up jobs from
 * `aiQueue`, runs them, and persists results to Postgres. It's stateless —
 * scale horizontally by running multiple instances.
 */

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { aiQueue } from './ai-queue.js';
import { startAiWorker } from './ai-worker.js';

startAiWorker();

logger.info(
  { redis: env.REDIS_URL.replace(/\/\/.*@/, '//***@') },
  '🤖 Dishday AI worker started — waiting for jobs',
);

async function shutdown(signal: string) {
  logger.info({ signal }, 'Worker received shutdown signal, draining queue…');
  await aiQueue.close();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
