import type {
  AuthSession,
  MealPlan,
  MealPlanEntry,
  MealType,
  Paginated,
  Recipe,
  RecipeFilter,
  ShoppingList,
  User,
  UserProfile,
} from '@dishday/types';
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
      forPlan: (planId: string) => client.get<ShoppingList>(`/shopping-lists/${planId}`),
      toggleItem: (listId: string, itemId: string, isChecked: boolean) =>
        client.patch<void>(`/shopping-lists/${listId}/items/${itemId}`, { isChecked }),
    },
  };
}

export type DishdayApi = ReturnType<typeof createDishdayApi>;
