import type { ISODateString, UUID } from './common';

export type RecipeSource = 'user' | 'ai' | 'official';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface RecipeIngredient {
  id: UUID;
  recipeId: UUID;
  name: string;
  quantity: number;
  unit: string;
  notes: string | null;
  orderIndex: number;
}

export interface Recipe {
  id: UUID;
  title: string;
  slug: string;
  description: string | null;
  authorId: UUID | null;
  source: RecipeSource;
  prepTimeMin: number | null;
  cookTimeMin: number | null;
  servings: number;
  caloriesPerServing: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  imageUrl: string | null;
  isPublic: boolean;
  isApproved: boolean;
  tags: string[];
  cuisine: string | null;
  mealType: MealType[];
  createdAt: ISODateString;
  ingredients?: RecipeIngredient[];
}

export interface RecipeFilter {
  q?: string;
  tags?: string[];
  cuisine?: string;
  mealType?: MealType;
  maxPrepTime?: number;
  source?: RecipeSource;
  page?: number;
  pageSize?: number;
}
