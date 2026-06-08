import Anthropic from '@anthropic-ai/sdk';
import type { AiCompletion, AiGenerateOptions, AiProvider } from './types.js';

// Claude Sonnet 4 pricing (Dec 2024): $3 per 1M input, $15 per 1M output.
const INPUT_USD_PER_M = 3;
const OUTPUT_USD_PER_M = 15;

export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic' as const;
  private readonly client: Anthropic;

  constructor(apiKey: string, readonly model: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate({
    systemPrompt,
    userPrompt,
    maxTokens = 4096,
  }: AiGenerateOptions): Promise<AiCompletion> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    return {
      text,
      inputTokens,
      outputTokens,
      costUsd: (inputTokens / 1_000_000) * INPUT_USD_PER_M + (outputTokens / 1_000_000) * OUTPUT_USD_PER_M,
    };
  }
}
