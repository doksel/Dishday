// env.ts loads .env internally before parsing — no need to do it here.
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, `🍽  Dishday API listening on :${env.PORT}`);
});

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal');
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
