import type { ISODateString, UUID } from './common';

export type RecipeSource = 'user' | 'ai' | 'official';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * BCP-47 keyed translation map (`{ en: '...', ru: '...' }`).
 *
 *   - `null` on a field means "no translations available — use the canonical
 *     column verbatim".
 *   - Missing keys inside the map mean "no translation for that language —
 *     fall back to the canonical column".
 *
 * Stored as JSONB in Postgres.
 */
export type LocalizedText = Partial<Record<string, string>>;

export interface RecipeIngredient {
  id: UUID;
  recipeId: UUID;
  /** Canonical name (typically English for AI-generated recipes). */
  name: string;
  /** Optional translations of `name` keyed by BCP-47 code. */
  nameI18n: LocalizedText | null;
  quantity: number;
  unit: string;
  notes: string | null;
  orderIndex: number;
}

export interface Recipe {
  id: UUID;
  /** Canonical title (English for AI-generated recipes). */
  title: string;
  /** Optional translations of `title` keyed by BCP-47 code. */
  titleI18n: LocalizedText | null;
  slug: string;
  /** Canonical description; may be null. */
  description: string | null;
  /** Optional translations of `description` keyed by BCP-47 code. */
  descriptionI18n: LocalizedText | null;
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
  /**
   * AI-generated recipe owned by a Free-tier user — only the title is exposed
   * by the API. `GET /recipes/:id` returns 402 PLAN_REQUIRED for Free users
   * viewing a preview-only row. Pro users see the full body.
   */
  previewOnly: boolean;
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
