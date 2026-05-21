import { Router } from 'express';
import type { AppContainer } from '../container.js';
import { authRouter } from './auth.js';
import { mealPlansRouter } from './meal-plans.js';
import { recipesRouter } from './recipes.js';
import { shoppingListsRouter } from './shopping-lists.js';
import { usersRouter } from './users.js';

/** Build the v1 router (excluding /subscriptions/webhook — mounted with raw body in app.ts). */
export function createRouter(container: AppContainer): Router {
  const router = Router();

  router.use('/auth', authRouter(container));
  router.use('/users', usersRouter(container));
  router.use('/recipes', recipesRouter(container));
  router.use('/meal-plans', mealPlansRouter(container));
  router.use('/shopping-lists', shoppingListsRouter(container));

  return router;
}
