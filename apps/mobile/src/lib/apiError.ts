/**
 * Translate API errors into localized user-facing strings.
 *
 *   Server returns `{ code: 'NOT_FOUND', message: 'Plan not found' }`.
 *   We render `t('errors:NOT_FOUND')` if that key exists, otherwise fall
 *   back to the server's English `message`, and finally to a generic
 *   "UNKNOWN" string.
 *
 * Why this lives in mobile/src and not in @dishday/api-client:
 *   - api-client is environment-agnostic (no React, no i18next).
 *   - The translation function is supplied by the caller via i18n hooks.
 */

import { ApiClientError } from '@dishday/api-client';
import type { i18n as I18n, TFunction } from 'i18next';
import { i18n } from '../i18n';

/**
 * Build a localized message from any thrown error.
 *
 * Accepts an explicit `t` (preferred — colocated with `useTranslation`) or
 * falls back to the global `i18n.t` for places where hooks are awkward.
 */
export function apiErrorMessage(
  error: unknown,
  tOrI18n: TFunction | I18n = i18n,
): string {
  const t: TFunction = typeof tOrI18n === 'function'
    ? (tOrI18n as TFunction)
    : ((key: string, opts?: object) =>
        (tOrI18n as I18n).t(key, opts as never)) as TFunction;

  if (error instanceof ApiClientError) {
    const code = error.body?.code ?? null;
    if (code) {
      // i18next returns the key itself when no value is found (returnNull: false),
      // so we explicitly probe with `exists` for a clean fallback.
      const key = `errors:${code}`;
      // i18n.exists(...) is the cleanest existence check; t() returns the key as fallback.
      if (i18n.exists(key)) return t(key);
    }
    if (error.body?.message) return error.body.message;
    if (error.message) return error.message;
    return t('errors:UNKNOWN');
  }

  if (error instanceof TypeError && /network/i.test(error.message)) {
    return t('errors:NETWORK_ERROR');
  }

  if (error instanceof Error && error.message) return error.message;
  return t('errors:UNKNOWN');
}
