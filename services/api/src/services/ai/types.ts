/**
 * AI provider abstraction. Business logic depends on this interface, not on
 * any specific SDK. Switch providers by changing one branch in `provider.ts`.
 */

export interface AiCompletion {
  /** Raw text returned by the model. */
  text: string;
  /** Token counts reported by the provider. */
  inputTokens: number;
  outputTokens: number;
  /** Provider-estimated USD cost (0 if on a free tier). */
  costUsd: number;
}

export interface AiGenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  /** Hint to provider that we expect strict JSON output. */
  responseFormat?: 'text' | 'json';
}

export interface AiProvider {
  /** Stable identifier for logging / `ai_usage_logs.type` context. */
  readonly name: 'anthropic' | 'gemini';
  readonly model: string;
  generate(opts: AiGenerateOptions): Promise<AiCompletion>;
}
