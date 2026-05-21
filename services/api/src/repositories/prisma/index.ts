import type { PrismaClient } from '@prisma/client';
import type { Repositories } from '../interfaces.js';
import { PrismaAiUsageLogRepository } from './ai-usage.repository.js';
import { PrismaMealPlanRepository } from './meal-plan.repository.js';
import { PrismaRecipeRepository } from './recipe.repository.js';
import { PrismaShoppingListRepository } from './shopping-list.repository.js';
import { PrismaSubscriptionRepository } from './subscription.repository.js';
import { PrismaUserRepository } from './user.repository.js';

/** Bind all repository interfaces to their Prisma implementations. */
export function createPrismaRepositories(prisma: PrismaClient): Repositories {
  return {
    users: new PrismaUserRepository(prisma),
    recipes: new PrismaRecipeRepository(prisma),
    mealPlans: new PrismaMealPlanRepository(prisma),
    shoppingLists: new PrismaShoppingListRepository(prisma),
    subscriptions: new PrismaSubscriptionRepository(prisma),
    aiUsageLogs: new PrismaAiUsageLogRepository(prisma),
  };
}
