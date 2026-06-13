/**
 * i18next bootstrap for the mobile app.
 *
 *   - Resources come from `@dishday/i18n` (shared JSON files)
 *   - Initial locale: user-saved (AsyncStorage) → device locale → `'en'`
 *   - Persisted on every change via AsyncStorage
 *
 *   NOTE: `intl-pluralrules` must be imported BEFORE i18next so that
 *   `Intl.PluralRules` exists on Hermes (otherwise i18next v23 falls back to
 *   compatibilityJSON v3 and our `_one/_few/_many/_other` keys won't resolve).
 */

// Polyfill must run first — Hermes does not ship Intl.PluralRules.
import 'intl-pluralrules';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LOCALE, isSupportedLocale, resources, type LocaleCode } from '@dishday/i18n';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const STORAGE_KEY = 'dishday.locale';

/** Best initial locale — user override → device → English. */
async function pickInitialLocale(): Promise<LocaleCode> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && isSupportedLocale(saved)) return saved;
  } catch {
    // ignore — fall through to device detection
  }
  const deviceCode = Localization.getLocales()[0]?.languageCode ?? '';
  if (isSupportedLocale(deviceCode)) return deviceCode;
  return DEFAULT_LOCALE;
}

let initPromise: Promise<typeof i18n> | null = null;

/** Idempotent init — safe to call from anywhere; the first caller wins. */
export function initI18n(): Promise<typeof i18n> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const lng = await pickInitialLocale();
    await i18n.use(initReactI18next).init({
      resources,
      lng,
      fallbackLng: DEFAULT_LOCALE,
      ns: [
        'common', 'profile', 'home', 'auth', 'mealTypes',
        'planner', 'recipes', 'meal', 'recipe', 'scan',
        'errors', 'shoppingList', 'paywall',
      ],
      defaultNS: 'common',
      interpolation: { escapeValue: false }, // React already escapes
      returnNull: false,
      compatibilityJSON: 'v4', // CLDR plural rules
    });
    return i18n;
  })();
  return initPromise;
}

/** Change app language. Persists to storage so it survives restarts. */
export async function setLocale(code: LocaleCode): Promise<void> {
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, code);
  } catch {
    // best-effort persistence
  }
}

export { i18n };
