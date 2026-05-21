import type { PrismaClient } from '@prisma/client';
import type { AiUsageLog } from '@dishday/types';
import type { AiUsageLogRepository, LogAiUsageInput } from '../interfaces.js';
import { aiUsageLogFromPrisma } from './mappers.js';

export class PrismaAiUsageLogRepository implements AiUsageLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async log(data: LogAiUsageInput): Promise<AiUsageLog> {
    const l = await this.prisma.aiUsageLog.create({
      data: {
        userId: data.userId,
        type: data.type,
        tokensUsed: data.tokensUsed,
        costUsd: data.costUsd,
        latencyMs: data.latencyMs,
      },
    });
    return aiUsageLogFromPrisma(l);
  }

  async sumCostByUser(userId: string, sinceIso?: string): Promise<number> {
    const agg = await this.prisma.aiUsageLog.aggregate({
      where: { userId, ...(sinceIso && { createdAt: { gte: new Date(sinceIso) } }) },
      _sum: { costUsd: true },
    });
    return agg._sum.costUsd ? Number(agg._sum.costUsd.toString()) : 0;
  }
}
