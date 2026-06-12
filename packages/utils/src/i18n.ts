/**
 * Pick the best string for a given locale from a canonical value + a
 * BCP-47 keyed translation map.
 *
 *   1. Exact match — `i18n['ru']`
 *   2. Base language — `i18n['en']` for `'en-US'`
 *   3. Canonical fallback (the column that's always populated)
 *
 * Designed for `Recipe.titleI18n` / `Recipe.descriptionI18n` and similar
 * fields where the canonical column is the source of truth and the i18n
 * map is an optional layer of translations.
 *
 *   const title = pickLocalized(recipe.title, recipe.titleI18n, user.locale);
 */
export function pickLocalized(
  canonical: string,
  i18n: Partial<Record<string, string>> | null | undefined,
  locale: string | null | undefined,
): string;
export function pickLocalized(
  canonical: string | null,
  i18n: Partial<Record<string, string>> | null | undefined,
  locale: string | null | undefined,
): string | null;
export function pickLocalized(
  canonical: string | null,
  i18n: Partial<Record<string, string>> | null | undefined,
  locale: string | null | undefined,
): string | null {
  if (i18n && locale) {
    const exact = i18n[locale];
    if (typeof exact === 'string' && exact.length > 0) return exact;
    // Try base language: 'en' from 'en-US'
    const base = locale.split('-')[0];
    if (base && base !== locale) {
      const baseHit = i18n[base];
      if (typeof baseHit === 'string' && baseHit.length > 0) return baseHit;
    }
  }
  return canonical;
}
