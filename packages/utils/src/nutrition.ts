import type { MealPlanEntry, NutritionSummary, Recipe } from '@dishday/types';

const empty = (): NutritionSummary => ({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });

export function sumNutrition(recipes: Recipe[]): NutritionSummary {
  return recipes.reduce<NutritionSummary>((acc, r) => {
    acc.calories += r.caloriesPerServing ?? 0;
    acc.proteinG += r.proteinG ?? 0;
    acc.carbsG += r.carbsG ?? 0;
    acc.fatG += r.fatG ?? 0;
    return acc;
  }, empty());
}

export function sumEntryNutrition(entries: MealPlanEntry[]): NutritionSummary {
  return entries.reduce<NutritionSummary>((acc, e) => {
    if (!e.recipe) return acc;
    const factor = e.servings;
    acc.calories += (e.recipe.caloriesPerServing ?? 0) * factor;
    acc.proteinG += (e.recipe.proteinG ?? 0) * factor;
    acc.carbsG += (e.recipe.carbsG ?? 0) * factor;
    acc.fatG += (e.recipe.fatG ?? 0) * factor;
    return acc;
  }, empty());
}
