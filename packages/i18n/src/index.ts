export * from './locales';

// Re-export each locale's namespaces as a single object so consumers can do:
//   import { resources } from '@dishday/i18n';
//   i18next.init({ resources })

// ─── English ──────────────────────────────────────────────
import enCommon from './locales/en/common.json';
import enProfile from './locales/en/profile.json';
import enHome from './locales/en/home.json';
import enAuth from './locales/en/auth.json';
import enMealTypes from './locales/en/mealTypes.json';
// ─── Russian ──────────────────────────────────────────────
import ruCommon from './locales/ru/common.json';
import ruProfile from './locales/ru/profile.json';
import ruHome from './locales/ru/home.json';
import ruAuth from './locales/ru/auth.json';
import ruMealTypes from './locales/ru/mealTypes.json';
// ─── Ukrainian ────────────────────────────────────────────
import ukCommon from './locales/uk/common.json';
import ukProfile from './locales/uk/profile.json';
import ukHome from './locales/uk/home.json';
import ukAuth from './locales/uk/auth.json';
import ukMealTypes from './locales/uk/mealTypes.json';
// ─── German ───────────────────────────────────────────────
import deCommon from './locales/de/common.json';
import deProfile from './locales/de/profile.json';
import deHome from './locales/de/home.json';
import deAuth from './locales/de/auth.json';
import deMealTypes from './locales/de/mealTypes.json';
// ─── Italian ──────────────────────────────────────────────
import itCommon from './locales/it/common.json';
import itProfile from './locales/it/profile.json';
import itHome from './locales/it/home.json';
import itAuth from './locales/it/auth.json';
import itMealTypes from './locales/it/mealTypes.json';
// ─── Spanish ──────────────────────────────────────────────
import esCommon from './locales/es/common.json';
import esProfile from './locales/es/profile.json';
import esHome from './locales/es/home.json';
import esAuth from './locales/es/auth.json';
import esMealTypes from './locales/es/mealTypes.json';
// ─── French ───────────────────────────────────────────────
import frCommon from './locales/fr/common.json';
import frProfile from './locales/fr/profile.json';
import frHome from './locales/fr/home.json';
import frAuth from './locales/fr/auth.json';
import frMealTypes from './locales/fr/mealTypes.json';

export const en = {
  common: enCommon,
  profile: enProfile,
  home: enHome,
  auth: enAuth,
  mealTypes: enMealTypes,
};
export const ru = {
  common: ruCommon,
  profile: ruProfile,
  home: ruHome,
  auth: ruAuth,
  mealTypes: ruMealTypes,
};
export const uk = {
  common: ukCommon,
  profile: ukProfile,
  home: ukHome,
  auth: ukAuth,
  mealTypes: ukMealTypes,
};
export const de = {
  common: deCommon,
  profile: deProfile,
  home: deHome,
  auth: deAuth,
  mealTypes: deMealTypes,
};
export const it = {
  common: itCommon,
  profile: itProfile,
  home: itHome,
  auth: itAuth,
  mealTypes: itMealTypes,
};
export const es = {
  common: esCommon,
  profile: esProfile,
  home: esHome,
  auth: esAuth,
  mealTypes: esMealTypes,
};
export const fr = {
  common: frCommon,
  profile: frProfile,
  home: frHome,
  auth: frAuth,
  mealTypes: frMealTypes,
};

/** All locales bundled together — ready to feed into `i18next.init({ resources })`. */
export const resources = { en, ru, uk, de, it, es, fr } as const;

/** TypeScript-friendly namespace list. */
export const NAMESPACES = ['common', 'profile', 'home', 'auth', 'mealTypes'] as const;
export type Namespace = (typeof NAMESPACES)[number];
