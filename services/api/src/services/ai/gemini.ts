import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AiCompletion, AiGenerateOptions, AiProvider } from './types.js';

// Gemini 2.0 Flash paid pricing (Dec 2024): $0.075 per 1M input, $0.30 per 1M output.
// Free tier: 15 req/min, 1500 req/day — costUsd is still reported for parity.
const INPUT_USD_PER_M = 0.075;
const OUTPUT_USD_PER_M = 0.3;

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini' as const;
  private readonly client: GoogleGenerativeAI;

  constructor(apiKey: string, readonly model: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generate({
    systemPrompt,
    userPrompt,
    maxTokens = 4096,
    responseFormat = 'text',
  }: AiGenerateOptions): Promise<AiCompletion> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: maxTokens,
        // Gemini supports strict JSON-only output natively — avoids prose/code-fence stripping.
        ...(responseFormat === 'json' && { responseMimeType: 'application/json' }),
      },
    });

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    const usage = result.response.usageMetadata;
    const inputTokens = usage?.promptTokenCount ?? 0;
    const outputTokens = usage?.candidatesTokenCount ?? 0;

    return {
      text,
      inputTokens,
      outputTokens,
      costUsd: (inputTokens / 1_000_000) * INPUT_USD_PER_M + (outputTokens / 1_000_000) * OUTPUT_USD_PER_M,
    };
  }
}
