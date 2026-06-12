/**
 * Prisma → domain (`@dishday/types`) mappers.
 *
 * Why: Prisma's generated types use `Decimal`, `Date`, etc.; the rest of the
 * codebase and all clients only deal with `number` and ISO strings. Mapping
 * here keeps the rest of the app driver-agnostic.
 */

import type {
  AiUsageLog as PAiUsageLog,
  MealPlan as PMealPlan,
  MealPlanEntry as PMealPlanEntry,
  Recipe as PRecipe,
  RecipeIngredient as PRecipeIngredient,
  ShoppingList as PShoppingList,
  ShoppingListItem as PShoppingListItem,
  Subscription as PSubscription,
  User as PUser,
  UserProfile as PUserProfile,
} from '@prisma/client';
import type {
  AiUsageLog,
  DayOfWeek,
  DietaryGoals,
  MealPlan,
  MealPlanEntry,
  Recipe,
  RecipeIngredient,
  ShoppingList,
  ShoppingListItem,
  Subscription,
  User,
  UserProfile,
} from '@dishday/types';

const num = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v.toString());

export function userFromPrisma(u: PUser): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
    plan: u.plan,
    planExpiresAt: u.planExpiresAt?.toISOString() ?? null,
    onboardingDone: u.onboardingDone,
    locale: u.locale ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

export function userProfileFromPrisma(p: PUserProfile): UserProfile {
  return {
    id: p.id,
    userId: p.userId,
    dietaryGoals: (p.dietaryGoals as DietaryGoals | null) ?? null,
    allergies: p.allergies,
    diets: p.diets,
    cookingSkill: p.cookingSkill,
    householdSize: p.householdSize,
    preferredCuisines: p.preferredCuisines,
    dislikedIngredients: p.dislikedIngredients,
  };
}

/**
 * Coerce Prisma JSON (`Prisma.JsonValue | null`) into our `LocalizedText` shape.
 * Only accepts plain `Record<string, string>` — anything else (array, scalar,
 * nested object) is treated as "no translations". This keeps callers from
 * having to defensively typecheck JSONB content.
 */
function localizedFromJson(v: unknown): Record<string, string> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === 'string') out[k] = val;
  }
  return Object.keys(out).length ? out : null;
}

export function ingredientFromPrisma(i: PRecipeIngredient): RecipeIngredient {
  return {
    id: i.id,
    recipeId: i.recipeId,
    name: i.name,
    nameI18n: localizedFromJson(i.nameI18n),
    quantity: Number(i.quantity.toString()),
    unit: i.unit,
    notes: i.notes,
    orderIndex: i.orderIndex,
  };
}

export function recipeFromPrisma(
  r: PRecipe & { ingredients?: PRecipeIngredient[] },
): Recipe {
  return {
    id: r.id,
    title: r.title,
    titleI18n: localizedFromJson(r.titleI18n),
    slug: r.slug,
    description: r.description,
    descriptionI18n: localizedFromJson(r.descriptionI18n),
    authorId: r.authorId,
    source: r.source,
    prepTimeMin: r.prepTimeMin,
    cookTimeMin: r.cookTimeMin,
    servings: r.servings,
    caloriesPerServing: num(r.caloriesPerServing),
    proteinG: num(r.proteinG),
    carbsG: num(r.carbsG),
    fatG: num(r.fatG),
    imageUrl: r.imageUrl,
    isPublic: r.isPublic,
    isApproved: r.isApproved,
    tags: r.tags,
    cuisine: r.cuisine,
    mealType: r.mealType,
    createdAt: r.createdAt.toISOString(),
    ingredients: r.ingredients?.map(ingredientFromPrisma),
  };
}

export function mealPlanEntryFromPrisma(
  e: PMealPlanEntry & { recipe?: PRecipe & { ingredients?: PRecipeIngredient[] } },
): MealPlanEntry {
  return {
    id: e.id,
    planId: e.planId,
    recipeId: e.recipeId,
    dayOfWeek: e.dayOfWeek as DayOfWeek,
    mealType: e.mealType,
    servings: Number(e.servings.toString()),
    recipe: e.recipe ? recipeFromPrisma(e.recipe) : undefined,
  };
}

export function mealPlanFromPrisma(
  p: PMealPlan & {
    entries?: Array<PMealPlanEntry & { recipe?: PRecipe & { ingredients?: PRecipeIngredient[] } }>;
  },
): MealPlan {
  return {
    id: p.id,
    userId: p.userId,
    weekStart: p.weekStart.toISOString().slice(0, 10),
    generatedBy: p.generatedBy,
    aiPromptSummary: p.aiPromptSummary,
    locked: p.locked,
    createdAt: p.createdAt.toISOString(),
    entries: p.entries?.map(mealPlanEntryFromPrisma),
  };
}

export function shoppingListItemFromPrisma(i: PShoppingListItem): ShoppingListItem {
  return {
    id: i.id,
    listId: i.listId,
    ingredientName: i.ingredientName,
    totalQuantity: Number(i.totalQuantity.toString()),
    unit: i.unit,
    category: i.category,
    isChecked: i.isChecked,
  };
}

export function shoppingListFromPrisma(
  l: PShoppingList & { items?: PShoppingListItem[] },
): ShoppingList {
  return {
    id: l.id,
    planId: l.planId,
    userId: l.userId,
    generatedAt: l.generatedAt.toISOString(),
    items: l.items?.map(shoppingListItemFromPrisma),
  };
}

export function subscriptionFromPrisma(s: PSubscription): Subscription {
  return {
    id: s.id,
    userId: s.userId,
    provider: s.provider,
    providerSubId: s.providerSubId,
    status: s.status,
    currentPeriodEnd: s.currentPeriodEnd.toISOString(),
    createdAt: s.createdAt.toISOString(),
  };
}

export function aiUsageLogFromPrisma(l: PAiUsageLog): AiUsageLog {
  return {
    id: l.id,
    userId: l.userId,
    type: l.type,
    tokensUsed: l.tokensUsed,
    costUsd: Number(l.costUsd.toString()),
    latencyMs: l.latencyMs,
    createdAt: l.createdAt.toISOString(),
  };
}
