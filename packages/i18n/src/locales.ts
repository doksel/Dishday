/**
 * Single source of truth for supported locales.
 *
 * Add a new language by:
 *   1. Creating `locales/<code>/` with the same JSON files as `en/`
 *   2. Adding the entry below
 *   3. Registering the resources in each app's i18n bootstrap
 */

export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]['code'];

export const DEFAULT_LOCALE: LocaleCode = 'en';

export function isSupportedLocale(code: string): code is LocaleCode {
  return SUPPORTED_LOCALES.some((l) => l.code === code);
}
