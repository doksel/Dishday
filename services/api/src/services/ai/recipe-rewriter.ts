/**
 * AI recipe rewriter — Pro-tier feature.
 *
 *   Takes an existing recipe + a transformation prompt ("make it vegan",
 *   "double the portions", "no peanuts") and returns a NEW recipe shape
 *   reflecting the edit. Persistence is the caller's job; this module is
 *   purely Claude in / structured JSON out.
 *
 *   Cost: ~1-2k tokens per call, ~$0.02-0.05. Always synchronous (single
 *   HTTP request waits) — meal plans need the queue because they're 30s+;
 *   a single recipe rewrite is 5-10s and a queue would add latency without
 *   helping throughput at our current scale.
 */

import { z } from 'zod';
import type { Recipe } from '@dishday/types';
import type { Repositories } from '../../repositories/interfaces.js';
import { getAiProvider } from './provider.js';

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

/**
 * Output schema — matches the shape `meal-plan-generator` writes, so the
 * persistence path for AI recipes stays uniform regardless of source.
 */
const rewriteSchema = z.object({
  title: z.string(),
  description: z.string(),
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  servings: z.number().int().positive().optional(),
  prepTimeMin: z.number().int().nonnegative().optional(),
  cookTimeMin: z.number().int().nonnegative().optional(),
  cuisine: z.string().optional(),
  tags: z.array(z.string()).optional(),
  mealType: z.array(z.enum(mealTypes)).optional(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
    }),
  ),
});

export type GeneratedRewrite = z.infer<typeof rewriteSchema>;

/** Mirrors meal-plan-generator's locale handling. */
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ru: 'Russian',
  uk: 'Ukrainian',
  de: 'German',
  it: 'Italian',
  es: 'Spanish',
  fr: 'French',
};
const DEFAULT_AI_LOCALE = 'en';

export interface RewriteInput {
  /** Recipe being transformed — the AI sees its full content. */
  source: Recipe;
  /** Free-form transformation request, e.g. "make it vegan", "without nuts". */
  prompt: string;
  /** Output language for title / description / ingredient names. */
  locale?: string | null;
  /** Who triggered this — written to `ai_usage_logs` for cost attribution. */
  userId: string;
}

export interface RewriteResult {
  rewrite: GeneratedRewrite;
  tokensUsed: number;
  costUsd: number;
  latencyMs: number;
}

export async function rewriteRecipe(
  repos: Repositories,
  input: RewriteInput,
): Promise<RewriteResult> {
  const provider = getAiProvider();
  const langCode = input.locale ?? DEFAULT_AI_LOCALE;
  const language = LANGUAGE_NAMES[langCode] ?? LANGUAGE_NAMES[DEFAULT_AI_LOCALE]!;

  const t0 = Date.now();
  const completion = await provider.generate({
    systemPrompt: buildSystemPrompt(language),
    userPrompt: buildUserPrompt(input),
    maxTokens: 2048,
    responseFormat: 'json',
  });
  const latencyMs = Date.now() - t0;

  // Strip optional code fences (Anthropic wraps in ```json sometimes).
  const jsonText = completion.text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const parsed = rewriteSchema.parse(JSON.parse(jsonText));
  const tokensUsed = completion.inputTokens + completion.outputTokens;

  await repos.aiUsageLogs.log({
    userId: input.userId,
    type: 'recipe',
    tokensUsed,
    costUsd: completion.costUsd,
    latencyMs,
  });

  return {
    rewrite: parsed,
    tokensUsed,
    costUsd: completion.costUsd,
    latencyMs,
  };
}

function buildSystemPrompt(language: string): string {
  return `You are a chef-AI that transforms existing recipes per a user's
request. Output STRICT JSON matching this schema (no prose, no markdown):

{
  "title": "string",
  "description": "string",
  "calories": number, "proteinG": number, "carbsG": number, "fatG": number,
  "servings": number,
  "prepTimeMin": number,
  "cookTimeMin": number,
  "cuisine": "italian|asian|american|mediterranean|...",
  "tags": ["vegan"|"vegetarian"|"gluten-free"|"high-protein"|"quick"|"easy"|"spicy"|"comfort"],
  "mealType": ["breakfast"|"lunch"|"dinner"|"snack"],
  "ingredients": [{"name": "string", "quantity": number, "unit": "g|ml|cup|tbsp|piece"}]
}

Rules:
- Keep the spirit of the original dish; the transformation should be the
  smallest reasonable change that satisfies the user's request.
- Recompute macros AND quantities consistently when the change implies them
  (e.g. doubling portions, removing a high-fat ingredient).
- If the request is incompatible with the original (e.g. "make this beef
  curry vegan"), substitute appropriately and update the title to reflect
  it (e.g. "Vegan Tofu Curry").
- Preserve units the original used where it makes sense.

Language:
- Write \`title\`, \`description\`, and ingredient \`name\` in ${language}.
- Keep JSON keys, the \`mealType\` and \`tags\` slugs, \`cuisine\` slug,
  and \`unit\` ("g", "ml", "cup", "tbsp", "piece") in English exactly as listed.`;
}

function buildUserPrompt({ source, prompt }: RewriteInput): string {
  const lines: string[] = [
    `Transform the recipe below per this request: "${prompt.trim()}"`,
    '',
    'Original recipe:',
    `Title: ${source.title}`,
  ];
  if (source.description) lines.push(`Description: ${source.description}`);
  if (source.cuisine) lines.push(`Cuisine: ${source.cuisine}`);
  if (source.mealType.length > 0) lines.push(`Meal type: ${source.mealType.join(', ')}`);
  lines.push(`Servings: ${source.servings}`);
  if (source.prepTimeMin !== null) lines.push(`Prep time: ${source.prepTimeMin} min`);
  if (source.cookTimeMin !== null) lines.push(`Cook time: ${source.cookTimeMin} min`);
  lines.push(
    `Macros (per serving): ${source.caloriesPerServing ?? 0} kcal · ` +
      `P ${source.proteinG ?? 0}g · C ${source.carbsG ?? 0}g · F ${source.fatG ?? 0}g`,
  );
  if (source.ingredients && source.ingredients.length > 0) {
    lines.push('Ingredients:');
    for (const ing of source.ingredients) {
      lines.push(`  - ${ing.quantity} ${ing.unit} ${ing.name}`);
    }
  }
  return lines.join('\n');
}
