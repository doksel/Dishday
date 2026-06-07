import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';

/** Lazy Anthropic client — null when ANTHROPIC_API_KEY is not configured. */
export const anthropic: Anthropic | null = env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  : null;

export function requireAnthropic(): Anthropic {
  if (!anthropic) {
    throw new Error('Anthropic is not configured (set ANTHROPIC_API_KEY in .env)');
  }
  return anthropic;
}

/** Rough USD cost for claude-sonnet-4 (Dec 2024 pricing: $3 in / $15 out per 1M tokens). */
export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
}
