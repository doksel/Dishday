/**
 * Repository contracts — the data access layer.
 *
 * Business code (services/, routes/) depends ONLY on these interfaces.
 * Swap the implementation (Prisma → Supabase JS → REST → in-memory mock)
 * by binding a different concrete class in `container.ts`.
 *
 * All methods accept/return DOMAIN types from `@dishday/types`, never
 * Prisma-generated or driver-specific shapes. Mapping lives inside each
 * concrete implementation (see infrastructure/prisma/mappers.ts).
 */

import type {
  AiUsageLog,
  AiUsageType,
  DayOfWeek,
  GeneratedBy,
  MealPlan,
  MealPlanEntry,
  MealType,
  Paginated,
  Recipe,
  RecipeFilter,
  RecipeIngredient,
  ShoppingList,
  ShoppingListItem,
  Subscription,
  SubscriptionProvider,
  SubscriptionStatus,
  User,
  UserPlan,
  UserProfile,
} from '@dishday/types';

// ─── Users ────────────────────────────────────────────────

export interface CreateUserInput {
  id?: string; // optionally pre-assigned (e.g. Supabase auth user id)
  email: string;
  name: string;
  passwordHash?: string | null;
  avatarUrl?: string | null;
  plan?: UserPlan;
  /** BCP-47 code (en, ru, uk…). `null` = follow device locale. */
  locale?: string | null;
}

export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string | null;
  plan?: UserPlan;
  planExpiresAt?: string | null;
  onboardingDone?: boolean;
  /** BCP-47 code (en, ru, uk…). `null` clears the pin → follow device locale. */
  locale?: string | null;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserInput): Promise<User>;
  update(id: string, data: UpdateUserInput): Promise<User>;
  delete(id: string): Promise<void>;

  getProfile(userId: string): Promise<UserProfile | null>;
  upsertProfile(
    userId: string,
    data: Partial<Omit<UserProfile, 'id' | 'userId'>>,
  ): Promise<UserProfile>;
}

// ─── Recipes ──────────────────────────────────────────────

export interface CreateRecipeInput {
  title: string;
  /** Optional translations of title, BCP-47 keyed. */
  titleI18n?: Partial<Record<string, string>> | null;
  slug: string;
  description?: string | null;
  /** Optional translations of description, BCP-47 keyed. */
  descriptionI18n?: Partial<Record<string, string>> | null;
  authorId?: string | null;
  source: Recipe['source'];
  prepTimeMin?: number | null;
  cookTimeMin?: number | null;
  servings?: number;
  caloriesPerServing?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  imageUrl?: string | null;
  isPublic?: boolean;
  isApproved?: boolean;
  previewOnly?: boolean;
  tags?: string[];
  cuisine?: string | null;
  mealType?: MealType[];
  ingredients?: Array<Omit<RecipeIngredient, 'id' | 'recipeId'>>;
}

export type UpdateRecipeInput = Partial<CreateRecipeInput>;

/**
 * Admin moderation filter — orthogonal to the user-facing RecipeFilter.
 *   - `pending`  → publicly-submitted recipes awaiting approval (isPublic=true, isApproved=false)
 *   - `approved` → recipes already visible in the catalog (isApproved=true)
 *   - `rejected` → soft-deleted recipes (isPublic=false)
 *   - `all`      → no filter on visibility/approval
 */
export interface ModerationFilter {
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  page?: number;
  pageSize?: number;
}

export interface RecipeRepository {
  findById(id: string): Promise<Recipe | null>;
  findBySlug(slug: string): Promise<Recipe | null>;
  list(filter: RecipeFilter): Promise<Paginated<Recipe>>;
  /** Admin-only — bypasses the public+approved visibility filter. */
  listForModeration(filter: ModerationFilter): Promise<Paginated<Recipe>>;
  create(data: CreateRecipeInput): Promise<Recipe>;
  update(id: string, data: UpdateRecipeInput): Promise<Recipe>;
  delete(id: string): Promise<void>;

  bookmark(userId: string, recipeId: string): Promise<void>;
  unbookmark(userId: string, recipeId: string): Promise<void>;
  listBookmarks(userId: string): Promise<Recipe[]>;
}

// ─── Meal Plans ───────────────────────────────────────────

export interface CreateMealPlanInput {
  userId: string;
  weekStart: string; // ISO date (YYYY-MM-DD)
  generatedBy: GeneratedBy;
  aiPromptSummary?: string | null;
}

export interface AddEntryInput {
  recipeId: string;
  dayOfWeek: DayOfWeek;
  mealType: MealType;
  servings?: number;
}

export interface MealPlanRepository {
  findById(id: string): Promise<MealPlan | null>;
  findByUserAndWeek(userId: string, weekStart: string): Promise<MealPlan | null>;
  listByUser(userId: string): Promise<MealPlan[]>;
  create(data: CreateMealPlanInput): Promise<MealPlan>;
  update(id: string, data: { locked?: boolean; aiPromptSummary?: string | null }): Promise<MealPlan>;
  delete(id: string): Promise<void>;

  addEntry(planId: string, entry: AddEntryInput): Promise<MealPlanEntry>;
  removeEntry(entryId: string): Promise<void>;
}

// ─── Shopping Lists ───────────────────────────────────────

export interface CreateShoppingListInput {
  planId: string;
  userId: string;
  items: Array<Omit<ShoppingListItem, 'id' | 'listId' | 'isChecked'>>;
}

export interface ShoppingListRepository {
  findById(id: string): Promise<ShoppingList | null>;
  findByPlan(planId: string): Promise<ShoppingList | null>;
  create(data: CreateShoppingListInput): Promise<ShoppingList>;
  delete(id: string): Promise<void>;

  toggleItem(itemId: string, isChecked: boolean): Promise<void>;
  addItem(
    listId: string,
    data: Omit<ShoppingListItem, 'id' | 'listId' | 'isChecked'>,
  ): Promise<ShoppingListItem>;
  removeItem(itemId: string): Promise<void>;
}

// ─── Subscriptions ────────────────────────────────────────

export interface UpsertSubscriptionInput {
  userId: string;
  provider: SubscriptionProvider;
  providerSubId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
}

export interface SubscriptionRepository {
  findActiveByUser(userId: string): Promise<Subscription | null>;
  findByProviderRef(provider: SubscriptionProvider, providerSubId: string): Promise<Subscription | null>;
  upsertFromProvider(data: UpsertSubscriptionInput): Promise<Subscription>;
}

// ─── AI Usage Logs ────────────────────────────────────────

export interface LogAiUsageInput {
  userId: string;
  type: AiUsageType;
  tokensUsed: number;
  costUsd: number;
  latencyMs: number;
}

export interface AiUsageLogRepository {
  log(data: LogAiUsageInput): Promise<AiUsageLog>;
  sumCostByUser(userId: string, sinceIso?: string): Promise<number>;
}

// ─── Aggregate ────────────────────────────────────────────

export interface Repositories {
  users: UserRepository;
  recipes: RecipeRepository;
  mealPlans: MealPlanRepository;
  shoppingLists: ShoppingListRepository;
  subscriptions: SubscriptionRepository;
  aiUsageLogs: AiUsageLogRepository;
}

// ─── Domain errors ────────────────────────────────────────

export class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} ${id} not found` : `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Thrown when a Free-tier user tries to access content that requires Pro.
 * The HTTP layer maps this to `402 PLAN_REQUIRED`.
 */
export class PlanRequiredError extends Error {
  constructor(message = 'Pro plan required') {
    super(message);
    this.name = 'PlanRequiredError';
  }
}
