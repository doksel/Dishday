/**
 * AI provider factory — picks the implementation based on env.
 *
 * Priority:
 *   1. ANTHROPIC_API_KEY present  → Claude (recommended; best quality)
 *   2. GEMINI_API_KEY present     → Gemini 2.0 Flash (free tier OK)
 *   3. nothing                    → AI features throw a clear error
 *
 * To switch from Gemini → Claude later: just put a real `ANTHROPIC_API_KEY`
 * in `.env`. No code changes needed.
 */

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { AnthropicProvider } from './anthropic.js';
import { GeminiProvider } from './gemini.js';
import { MockProvider } from './mock.js';
import type { AiProvider } from './types.js';

let cached: AiProvider | null = null;

/**
 * Treat placeholder values (from .env.example like `sk-ant-...`) as missing.
 * Without this guard a placeholder would be picked, then fail with 401 at runtime.
 */
function isUsable(key: string | undefined): key is string {
  if (!key) return false;
  if (key.includes('...')) return false;   // placeholder
  if (key.length < 16) return false;       // way too short to be real
  return true;
}

export function getAiProvider(): AiProvider {
  if (cached) return cached;

  // Allow forcing the mock even when real keys are set — useful for tests / quota issues.
  if (process.env.USE_MOCK_AI === '1') {
    logger.info('USE_MOCK_AI=1 — using MockProvider regardless of API keys');
    cached = new MockProvider();
    return cached;
  }

  if (isUsable(env.ANTHROPIC_API_KEY)) {
    cached = new AnthropicProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL);
    return cached;
  }

  if (isUsable(env.GEMINI_API_KEY)) {
    cached = new GeminiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL);
    return cached;
  }

  // Dev fallback — deterministic JSON, no network. Activated when:
  //  - no provider keys are set, OR
  //  - explicitly forced via USE_MOCK_AI=1 (handy for tests / when quotas hit)
  logger.warn(
    'No usable AI provider key found — falling back to MockProvider (deterministic local plan).',
  );
  cached = new MockProvider();
  return cached;
}

/** Optional helper: returns null instead of throwing — useful for status endpoints. */
export function getAiProviderOrNull(): AiProvider | null {
  try {
    return getAiProvider();
  } catch {
    return null;
  }
}
