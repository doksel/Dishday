/**
 * Generate a weekly meal plan via an `AiProvider`.
 *
 * Pipeline:
 *   1. Build a prompt from the user's profile (allergies, diets, goals…)
 *   2. Call the provider with a strict JSON schema in the system prompt
 *   3. Parse + validate
 *   4. Log token usage / cost
 *   5. Return the structured plan ready to be persisted as MealPlan + MealPlanEntries
 *
 * Provider is selected once via `getAiProvider()` — see `provider.ts`.
 */

import { z } from 'zod';
import type { UserProfile } from '@dishday/types';
import type { Repositories } from '../../repositories/interfaces.js';
import { getAiProvider } from './provider.js';

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

const planSchema = z.object({
  days: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        meals: z.array(
          z.object({
            mealType: z.enum(mealTypes),
            title: z.string(),
            description: z.string(),
            calories: z.number(),
            proteinG: z.number(),
            carbsG: z.number(),
            fatG: z.number(),
            prepTimeMin: z.number().int().nonnegative().optional(),
            cookTimeMin: z.number().int().nonnegative().optional(),
            tags: z.array(z.string()).optional(),
            cuisine: z.string().optional(),
            ingredients: z.array(
              z.object({
                name: z.string(),
                quantity: z.number(),
                unit: z.string(),
              }),
            ),
          }),
        ),
      }),
    )
    .length(7),
});

export type GeneratedPlan = z.infer<typeof planSchema>;

/**
 * Map BCP-47 language code → human-readable name for the prompt.
 * Kept in-file because (a) the list is tiny, (b) we don't want to pull the
 * full `@dishday/i18n` resource bundle into the worker just for a label.
 */
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ru: 'Russian',
  uk: 'Ukrainian',
  de: 'German',
  it: 'Italian',
  es: 'Spanish',
  fr: 'French',
};

/** Default locale used when the user hasn't pinned one. Matches DEFAULT_LOCALE in @dishday/i18n. */
const DEFAULT_AI_LOCALE = 'en';

/**
 * Build the system prompt for the given output language.
 * Recipe titles/descriptions are user-facing content, so we ask the model to
 * write them in `language`; the JSON keys / enum values stay English (those
 * are wire-format and parsed by Zod).
 */
function buildSystemPrompt(language: string): string {
  return `You are a nutritionist generating personalised weekly meal plans.
Output STRICT JSON matching this schema (no prose, no markdown):

{
  "days": [
    {
      "dayOfWeek": 0,  // 0=Mon ... 6=Sun
      "meals": [
        {
          "mealType": "breakfast"|"lunch"|"dinner"|"snack",
          "title": "string",
          "description": "string",
          "calories": number,
          "proteinG": number, "carbsG": number, "fatG": number,
          "prepTimeMin": number,   // minutes of prep
          "cookTimeMin": number,   // minutes of cooking
          "cuisine": "italian|asian|american|mediterranean|...",
          "tags": ["vegan"|"vegetarian"|"gluten-free"|"high-protein"|"quick"|"easy"|"spicy"|"comfort"],
          "ingredients": [{"name": "string", "quantity": number, "unit": "g|ml|cup|tbsp|piece"}]
        }
      ]
    }
  ]
}

Rules:
- Exactly 7 day objects, dayOfWeek 0..6.
- Each day must contain breakfast, lunch, dinner. Snack is optional.
- Respect all dietary constraints strictly.
- Vary cuisines and avoid repeating the same recipe twice in the week.

Language:
- Write all human-readable text — recipe \`title\`, \`description\`, ingredient
  \`name\` — in ${language}.
- Keep JSON keys, the \`mealType\` enum (breakfast/lunch/dinner/snack), the
  \`cuisine\` slug, the \`tags\` slugs, and the \`unit\` string ("g", "ml",
  "cup", "tbsp", "piece") in English exactly as listed above.`;
}

export interface GenerateInput {
  userId: string;
  profile: UserProfile | null;
  weekStart: string;
  /**
   * BCP-47 language code (en, ru, uk, de, it, es, fr). Controls the language of
   * generated recipe `title` / `description` / ingredient names. `null` or
   * unknown codes fall back to English. JSON keys, enum slugs and units stay
   * English regardless — those are wire-format.
   */
  locale?: string | null;
}

export interface GenerateResult {
  plan: GeneratedPlan;
  promptSummary: string;
  tokensUsed: number;
  costUsd: number;
  latencyMs: number;
}

export async function generateWeeklyPlan(
  repos: Repositories,
  input: GenerateInput,
): Promise<GenerateResult> {
  const provider = getAiProvider();
  const userPrompt = buildUserPrompt(input);

  // Resolve language label for the system prompt. Unknown / null locale → English.
  const langCode = input.locale ?? DEFAULT_AI_LOCALE;
  const language = LANGUAGE_NAMES[langCode] ?? LANGUAGE_NAMES[DEFAULT_AI_LOCALE]!;

  const t0 = Date.now();
  const completion = await provider.generate({
    systemPrompt: buildSystemPrompt(language),
    userPrompt,
    maxTokens: 4096,
    responseFormat: 'json',
  });
  const latencyMs = Date.now() - t0;

  // Anthropic may wrap output in code fences; Gemini returns raw JSON when responseMimeType set.
  const jsonText = completion.text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const parsed = planSchema.parse(JSON.parse(jsonText));

  const tokensUsed = completion.inputTokens + completion.outputTokens;

  await repos.aiUsageLogs.log({
    userId: input.userId,
    type: 'meal_plan',
    tokensUsed,
    costUsd: completion.costUsd,
    latencyMs,
  });

  return {
    plan: parsed,
    promptSummary: userPrompt.slice(0, 500),
    tokensUsed,
    costUsd: completion.costUsd,
    latencyMs,
  };
}

function buildUserPrompt({ profile, weekStart }: GenerateInput): string {
  const lines: string[] = [`Generate a 7-day meal plan starting Monday ${weekStart}.`];
  if (!profile) {
    lines.push('No dietary profile available. Use a balanced default (≈ 2000 kcal/day).');
    return lines.join('\n');
  }
  if (profile.dietaryGoals) {
    const g = profile.dietaryGoals;
    lines.push(
      `Target macros per day: ${g.calories ?? '~2000'} kcal, ${g.proteinG ?? 'flex'} g protein, ` +
        `${g.carbsG ?? 'flex'} g carbs, ${g.fatG ?? 'flex'} g fat.`,
    );
  }
  if (profile.diets.length) lines.push(`Diets: ${profile.diets.join(', ')}.`);
  if (profile.allergies.length)
    lines.push(`Allergies (NEVER include): ${profile.allergies.join(', ')}.`);
  if (profile.dislikedIngredients.length)
    lines.push(`Disliked (avoid): ${profile.dislikedIngredients.join(', ')}.`);
  if (profile.preferredCuisines.length)
    lines.push(`Preferred cuisines: ${profile.preferredCuisines.join(', ')}.`);
  lines.push(`Household size: ${profile.householdSize}.`);
  if (profile.cookingSkill) lines.push(`Cooking skill: ${profile.cookingSkill}.`);
  return lines.join('\n');
}
