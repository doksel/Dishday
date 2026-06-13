import type {
  AuthSession,
  MealPlan,
  MealPlanEntry,
  MealType,
  Paginated,
  Recipe,
  RecipeFilter,
  ShoppingList,
  ShoppingListItem,
  Subscription,
  User,
  UserPlan,
  UserProfile,
} from '@dishday/types';

/** Admin-only filter for the moderation queue. */
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'all';
import { ApiClient } from './client';

export function createDishdayApi(client: ApiClient) {
  return {
    auth: {
      register: (data: { email: string; password: string; name: string }) =>
        client.post<AuthSession>('/auth/register', data),
      login: (data: { email: string; password: string }) =>
        client.post<AuthSession>('/auth/login', data),
      refresh: (refreshToken: string) =>
        client.post<AuthSession>('/auth/refresh', { refreshToken }),
      logout: () => client.post<void>('/auth/logout'),
      me: () => client.get<User>('/auth/me'),
    },
    users: {
      getProfile: () => client.get<UserProfile>('/users/profile'),
      updateProfile: (data: Partial<UserProfile>) =>
        client.put<UserProfile>('/users/profile', data),
      /**
       * Pin the user's UI/content language across devices.
       * Pass `null` to clear the pin (clients fall back to device locale).
       * Server validates against `@dishday/i18n` SUPPORTED_LOCALES.
       */
      setLocale: (locale: string | null) =>
        client.put<User>('/users/profile', { locale }),
    },
    recipes: {
      list: (filter: RecipeFilter = {}) => {
        const qs = new URLSearchParams(
          Object.entries(filter).flatMap(([k, v]) =>
            v === undefined ? [] : [[k, Array.isArray(v) ? v.join(',') : String(v)]],
          ) as [string, string][],
        );
        return client.get<Paginated<Recipe>>(`/recipes?${qs}`);
      },
      get: (id: string) => client.get<Recipe>(`/recipes/${id}`),
      create: (data: Partial<Recipe>) => client.post<Recipe>('/recipes', data),
      bookmark: (id: string) => client.post<void>(`/recipes/${id}/bookmark`),
      unbookmark: (id: string) => client.delete<void>(`/recipes/${id}/bookmark`),
    },
    mealPlans: {
      list: () => client.get<MealPlan[]>('/meal-plans'),
      get: (id: string) => client.get<MealPlan>(`/meal-plans/${id}`),
      create: (data: Partial<MealPlan>) => client.post<MealPlan>('/meal-plans', data),
      aiGenerate: (data: { weekStart?: string }) =>
        client.post<{ jobId: string; status: string }>('/meal-plans/ai/generate', data),
      aiJob: (jobId: string) =>
        client.get<{
          id: string;
          state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
          result: { ok: boolean; resultId?: string } | null;
          failedReason: string | null;
        }>(`/meal-plans/ai/jobs/${jobId}`),
      addEntry: (
        planId: string,
        data: { recipeId: string; dayOfWeek: number; mealType: MealType; servings?: number },
      ) => client.post<MealPlanEntry>(`/meal-plans/${planId}/entries`, data),
      removeEntry: (planId: string, entryId: string) =>
        client.delete<void>(`/meal-plans/${planId}/entries/${entryId}`),
    },
    shoppingLists: {
      /** Get the shopping list for a plan (auto-generates on first call). */
      forPlan: (planId: string) => client.get<ShoppingList>(`/shopping-lists/${planId}`),
      /** Drop the existing list and re-consolidate ingredients from the plan. */
      regenerate: (planId: string) =>
        client.post<ShoppingList>('/shopping-lists/generate', { planId }),
      /** Toggle the checked state of a single item. */
      toggleItem: (listId: string, itemId: string, isChecked: boolean) =>
        client.patch<void>(`/shopping-lists/${listId}/items/${itemId}`, { isChecked }),
      /** Append a custom item to the list. */
      addItem: (
        listId: string,
        data: {
          ingredientName: string;
          totalQuantity: number;
          unit: string;
          category?: string | null;
        },
      ) => client.post<ShoppingListItem>(`/shopping-lists/${listId}/items`, data),
      /** Remove an item (custom or generated). */
      removeItem: (listId: string, itemId: string) =>
        client.delete<void>(`/shopping-lists/${listId}/items/${itemId}`),
    },
    subscriptions: {
      /** Marketing plans list (Free + Pro). Includes Stripe priceId when configured. */
      getPlans: () =>
        client.get<SubscriptionPlan[]>('/subscriptions/plans'),
      /** Current user's plan and active subscription (if any). */
      getStatus: () =>
        client.get<{ plan: UserPlan; subscription: Subscription | null }>(
          '/subscriptions/status',
        ),
      /**
       * Create a Stripe Checkout session and return its hosted URL.
       * Open the URL in an external browser; after payment Stripe will
       * redirect to `returnUrl` (or the default web success page).
       */
      createCheckout: (data: { priceId?: string; returnUrl?: string } = {}) =>
        client.post<{ url: string }>('/subscriptions/checkout', data),
      /** Stripe billing portal — manage existing subscription. */
      createPortal: (data: { returnUrl?: string } = {}) =>
        client.post<{ url: string }>('/subscriptions/portal', data),
    },
    admin: {
      /**
       * List recipes for moderation. Default `status='pending'` returns the
       * queue of publicly-submitted, unapproved recipes. Requires the caller
       * to be `plan='admin'`; otherwise the server replies 403 FORBIDDEN.
       */
      listRecipes: (params: { status?: ModerationStatus; page?: number; pageSize?: number } = {}) => {
        const qs = new URLSearchParams();
        if (params.status) qs.set('status', params.status);
        if (params.page !== undefined) qs.set('page', String(params.page));
        if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
        const tail = qs.toString();
        return client.get<Paginated<Recipe>>(`/admin/recipes${tail ? `?${tail}` : ''}`);
      },
      /** Flip `isApproved=true` — recipe joins the public catalog. */
      approveRecipe: (id: string) =>
        client.post<Recipe>(`/admin/recipes/${id}/approve`, {}),
      /** Flip `isPublic=false` — recipe is soft-deleted; the author keeps a copy. */
      rejectRecipe: (id: string) =>
        client.post<Recipe>(`/admin/recipes/${id}/reject`, {}),
    },
  };
}

/** Shape returned by `GET /subscriptions/plans`. Kept here (not in @dishday/types)
 *  because it's a presentation-layer concern, not a domain entity. */
export interface SubscriptionPlan {
  id: 'free' | 'pro';
  name: string;
  priceMonthlyUsd: number;
  stripePriceId?: string | null;
  features: string[];
}

export type DishdayApi = ReturnType<typeof createDishdayApi>;
