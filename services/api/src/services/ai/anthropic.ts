import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';

export const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

/** Rough USD cost for claude-sonnet-4 (Dec 2024 pricing: $3 in / $15 out per 1M tokens). */
export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
}
