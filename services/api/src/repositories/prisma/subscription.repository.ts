import type { PrismaClient } from '@prisma/client';
import type { Subscription, SubscriptionProvider } from '@dishday/types';
import type { SubscriptionRepository, UpsertSubscriptionInput } from '../interfaces.js';
import { subscriptionFromPrisma } from './mappers.js';

export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActiveByUser(userId: string): Promise<Subscription | null> {
    const s = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'trialing'] } },
      orderBy: { currentPeriodEnd: 'desc' },
    });
    return s ? subscriptionFromPrisma(s) : null;
  }

  async findByProviderRef(
    provider: SubscriptionProvider,
    providerSubId: string,
  ): Promise<Subscription | null> {
    const s = await this.prisma.subscription.findUnique({
      where: { provider_providerSubId: { provider, providerSubId } },
    });
    return s ? subscriptionFromPrisma(s) : null;
  }

  async upsertFromProvider(data: UpsertSubscriptionInput): Promise<Subscription> {
    const s = await this.prisma.subscription.upsert({
      where: {
        provider_providerSubId: { provider: data.provider, providerSubId: data.providerSubId },
      },
      create: {
        userId: data.userId,
        provider: data.provider,
        providerSubId: data.providerSubId,
        status: data.status,
        currentPeriodEnd: new Date(data.currentPeriodEnd),
      },
      update: {
        status: data.status,
        currentPeriodEnd: new Date(data.currentPeriodEnd),
      },
    });
    return subscriptionFromPrisma(s);
  }
}
