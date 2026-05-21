import type { Repositories } from '../repositories/interfaces.js';
import { MealPlanService } from './meal-plan.service.js';
import { RecipeService } from './recipe.service.js';

export interface Services {
  recipes: RecipeService;
  mealPlans: MealPlanService;
}

export function createServices(repos: Repositories): Services {
  return {
    recipes: new RecipeService(repos),
    mealPlans: new MealPlanService(repos),
  };
}

export { MealPlanService, RecipeService };
