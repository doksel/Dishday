import type { ISODateString, UUID } from './common';
import type { MealType, Recipe } from './recipe';

export type GeneratedBy = 'manual' | 'ai';
/** 0 = Monday, 6 = Sunday */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface MealPlanEntry {
  id: UUID;
  planId: UUID;
  recipeId: UUID;
  dayOfWeek: DayOfWeek;
  mealType: MealType;
  servings: number;
  recipe?: Recipe;
}

export interface MealPlan {
  id: UUID;
  userId: UUID;
  weekStart: ISODateString;
  generatedBy: GeneratedBy;
  aiPromptSummary: string | null;
  locked: boolean;
  createdAt: ISODateString;
  entries?: MealPlanEntry[];
}

export interface NutritionSummary {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}
