import type { ISODateString, UUID } from './common';

export type SubscriptionProvider = 'stripe' | 'apple' | 'google';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';

export interface Subscription {
  id: UUID;
  userId: UUID;
  provider: SubscriptionProvider;
  providerSubId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: ISODateString;
  createdAt: ISODateString;
}
