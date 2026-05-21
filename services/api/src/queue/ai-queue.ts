import Bull from 'bull';
import { env } from '../config/env.js';

export type AiJobType = 'meal_plan' | 'recipe' | 'nutrition';

export interface AiJobPayload {
  userId: string;
  type: AiJobType;
  input: Record<string, unknown>;
}

export interface AiJobResult {
  ok: boolean;
  resultId?: string;
  error?: string;
}

export const aiQueue = new Bull<AiJobPayload>('ai-jobs', env.REDIS_URL, {
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 1500 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});
