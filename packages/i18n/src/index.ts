export * from './locales';

// ─── English ──────────────────────────────────────────────
import enCommon from './locales/en/common.json';
import enProfile from './locales/en/profile.json';
import enHome from './locales/en/home.json';
import enAuth from './locales/en/auth.json';
import enMealTypes from './locales/en/mealTypes.json';
import enPlanner from './locales/en/planner.json';
import enRecipes from './locales/en/recipes.json';
import enMeal from './locales/en/meal.json';
import enRecipe from './locales/en/recipe.json';
import enScan from './locales/en/scan.json';
import enErrors from './locales/en/errors.json';
import enShoppingList from './locales/en/shoppingList.json';
import enPaywall from './locales/en/paywall.json';
// ─── Russian ──────────────────────────────────────────────
import ruCommon from './locales/ru/common.json';
import ruProfile from './locales/ru/profile.json';
import ruHome from './locales/ru/home.json';
import ruAuth from './locales/ru/auth.json';
import ruMealTypes from './locales/ru/mealTypes.json';
import ruPlanner from './locales/ru/planner.json';
import ruRecipes from './locales/ru/recipes.json';
import ruMeal from './locales/ru/meal.json';
import ruRecipe from './locales/ru/recipe.json';
import ruScan from './locales/ru/scan.json';
import ruErrors from './locales/ru/errors.json';
import ruShoppingList from './locales/ru/shoppingList.json';
import ruPaywall from './locales/ru/paywall.json';
// ─── Ukrainian ────────────────────────────────────────────
import ukCommon from './locales/uk/common.json';
import ukProfile from './locales/uk/profile.json';
import ukHome from './locales/uk/home.json';
import ukAuth from './locales/uk/auth.json';
import ukMealTypes from './locales/uk/mealTypes.json';
import ukPlanner from './locales/uk/planner.json';
import ukRecipes from './locales/uk/recipes.json';
import ukMeal from './locales/uk/meal.json';
import ukRecipe from './locales/uk/recipe.json';
import ukScan from './locales/uk/scan.json';
import ukErrors from './locales/uk/errors.json';
import ukShoppingList from './locales/uk/shoppingList.json';
import ukPaywall from './locales/uk/paywall.json';
// ─── German ───────────────────────────────────────────────
import deCommon from './locales/de/common.json';
import deProfile from './locales/de/profile.json';
import deHome from './locales/de/home.json';
import deAuth from './locales/de/auth.json';
import deMealTypes from './locales/de/mealTypes.json';
import dePlanner from './locales/de/planner.json';
import deRecipes from './locales/de/recipes.json';
import deMeal from './locales/de/meal.json';
import deRecipe from './locales/de/recipe.json';
import deScan from './locales/de/scan.json';
import deErrors from './locales/de/errors.json';
import deShoppingList from './locales/de/shoppingList.json';
import dePaywall from './locales/de/paywall.json';
// ─── Italian ──────────────────────────────────────────────
import itCommon from './locales/it/common.json';
import itProfile from './locales/it/profile.json';
import itHome from './locales/it/home.json';
import itAuth from './locales/it/auth.json';
import itMealTypes from './locales/it/mealTypes.json';
import itPlanner from './locales/it/planner.json';
import itRecipes from './locales/it/recipes.json';
import itMeal from './locales/it/meal.json';
import itRecipe from './locales/it/recipe.json';
import itScan from './locales/it/scan.json';
import itErrors from './locales/it/errors.json';
import itShoppingList from './locales/it/shoppingList.json';
import itPaywall from './locales/it/paywall.json';
// ─── Spanish ──────────────────────────────────────────────
import esCommon from './locales/es/common.json';
import esProfile from './locales/es/profile.json';
import esHome from './locales/es/home.json';
import esAuth from './locales/es/auth.json';
import esMealTypes from './locales/es/mealTypes.json';
import esPlanner from './locales/es/planner.json';
import esRecipes from './locales/es/recipes.json';
import esMeal from './locales/es/meal.json';
import esRecipe from './locales/es/recipe.json';
import esScan from './locales/es/scan.json';
import esErrors from './locales/es/errors.json';
import esShoppingList from './locales/es/shoppingList.json';
import esPaywall from './locales/es/paywall.json';
// ─── French ───────────────────────────────────────────────
import frCommon from './locales/fr/common.json';
import frProfile from './locales/fr/profile.json';
import frHome from './locales/fr/home.json';
import frAuth from './locales/fr/auth.json';
import frMealTypes from './locales/fr/mealTypes.json';
import frPlanner from './locales/fr/planner.json';
import frRecipes from './locales/fr/recipes.json';
import frMeal from './locales/fr/meal.json';
import frRecipe from './locales/fr/recipe.json';
import frScan from './locales/fr/scan.json';
import frErrors from './locales/fr/errors.json';
import frShoppingList from './locales/fr/shoppingList.json';
import frPaywall from './locales/fr/paywall.json';

const bundle = <T extends Record<string, unknown>>(t: T) => t;

export const en = bundle({
  common: enCommon, profile: enProfile, home: enHome, auth: enAuth,
  mealTypes: enMealTypes, planner: enPlanner, recipes: enRecipes,
  meal: enMeal, recipe: enRecipe, scan: enScan, errors: enErrors,
  shoppingList: enShoppingList, paywall: enPaywall,
});
export const ru = bundle({
  common: ruCommon, profile: ruProfile, home: ruHome, auth: ruAuth,
  mealTypes: ruMealTypes, planner: ruPlanner, recipes: ruRecipes,
  meal: ruMeal, recipe: ruRecipe, scan: ruScan, errors: ruErrors,
  shoppingList: ruShoppingList, paywall: ruPaywall,
});
export const uk = bundle({
  common: ukCommon, profile: ukProfile, home: ukHome, auth: ukAuth,
  mealTypes: ukMealTypes, planner: ukPlanner, recipes: ukRecipes,
  meal: ukMeal, recipe: ukRecipe, scan: ukScan, errors: ukErrors,
  shoppingList: ukShoppingList, paywall: ukPaywall,
});
export const de = bundle({
  common: deCommon, profile: deProfile, home: deHome, auth: deAuth,
  mealTypes: deMealTypes, planner: dePlanner, recipes: deRecipes,
  meal: deMeal, recipe: deRecipe, scan: deScan, errors: deErrors,
  shoppingList: deShoppingList, paywall: dePaywall,
});
export const it = bundle({
  common: itCommon, profile: itProfile, home: itHome, auth: itAuth,
  mealTypes: itMealTypes, planner: itPlanner, recipes: itRecipes,
  meal: itMeal, recipe: itRecipe, scan: itScan, errors: itErrors,
  shoppingList: itShoppingList, paywall: itPaywall,
});
export const es = bundle({
  common: esCommon, profile: esProfile, home: esHome, auth: esAuth,
  mealTypes: esMealTypes, planner: esPlanner, recipes: esRecipes,
  meal: esMeal, recipe: esRecipe, scan: esScan, errors: esErrors,
  shoppingList: esShoppingList, paywall: esPaywall,
});
export const fr = bundle({
  common: frCommon, profile: frProfile, home: frHome, auth: frAuth,
  mealTypes: frMealTypes, planner: frPlanner, recipes: frRecipes,
  meal: frMeal, recipe: frRecipe, scan: frScan, errors: frErrors,
  shoppingList: frShoppingList, paywall: frPaywall,
});

/** All locales bundled together — ready to feed into `i18next.init({ resources })`. */
export const resources = { en, ru, uk, de, it, es, fr } as const;

/** TypeScript-friendly namespace list. */
export const NAMESPACES = [
  'common', 'profile', 'home', 'auth', 'mealTypes',
  'planner', 'recipes', 'meal', 'recipe', 'scan',
  'errors', 'shoppingList', 'paywall',
] as const;
export type Namespace = (typeof NAMESPACES)[number];
