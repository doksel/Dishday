import type { ISODateString, UUID } from './common';

export type AiUsageType = 'meal_plan' | 'recipe' | 'nutrition';

export interface AiUsageLog {
  id: UUID;
  userId: UUID;
  type: AiUsageType;
  tokensUsed: number;
  costUsd: number;
  latencyMs: number;
  createdAt: ISODateString;
}
