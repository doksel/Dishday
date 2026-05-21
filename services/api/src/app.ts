import cors from 'cors';
import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { createContainer, type AppContainer } from './container.js';
import { errorHandler } from './middlewares/error.js';
import { createRouter } from './routes/index.js';
import { subscriptionsRouter } from './routes/subscriptions.js';

export function createApp(container: AppContainer = createContainer()): Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));

  // Stripe webhook needs the RAW body — mount BEFORE express.json().
  // We expose only the /webhook handler at the top level; the rest of
  // /v1/subscriptions mounts again below under the regular pipeline.
  app.use('/v1/subscriptions', subscriptionsRouter(container));

  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'dishday-api', version: '0.1.0' });
  });

  app.use('/v1', createRouter(container));

  app.use(errorHandler);
  return app;
}
