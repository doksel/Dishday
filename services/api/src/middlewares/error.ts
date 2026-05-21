import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request payload',
      details: err.flatten(),
    });
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Something went wrong' });
}
