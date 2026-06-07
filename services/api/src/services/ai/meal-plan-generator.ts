/**
 * Generate a weekly meal plan via Claude.
 *
 * Pipeline:
 *   1. Build a prompt from the user's profile (allergies, diets, goals…)
 *   2. Call Claude with a strict JSON schema in the system prompt
 *   3. Parse + validate
 *   4. Log token usage / cost
 *   5. Return the structured plan ready to be persisted as MealPlan + MealPlanEntries
 */

import { z } from 'zod';
import type { UserProfile } from '@dishday/types';
import { env } from '../../config/env.js';
import type { Repositories } from '../../repositories/interfaces.js';
import { estimateCostUsd, requireAnthropic } from './anthropic.js';

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

const SYSTEM_PROMPT = `You are a nutritionist generating personalised weekly meal plans.
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
- Vary cuisines and avoid repeating the same recipe twice in the week.`;

export interface GenerateInput {
  userId: string;
  profile: UserProfile | null;
  weekStart: string;
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
  const userPrompt = buildUserPrompt(input);

  const t0 = Date.now();
  const response = await requireAnthropic().messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const latencyMs = Date.now() - t0;

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Strip code fences if Claude added any
  const jsonText = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const parsed = planSchema.parse(JSON.parse(jsonText));

  const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
  const costUsd = estimateCostUsd(response.usage.input_tokens, response.usage.output_tokens);

  // fire-and-forget log; await for correctness in tests
  await repos.aiUsageLogs.log({
    userId: input.userId,
    type: 'meal_plan',
    tokensUsed,
    costUsd,
    latencyMs,
  });

  return {
    plan: parsed,
    promptSummary: userPrompt.slice(0, 500),
    tokensUsed,
    costUsd,
    latencyMs,
  };
}

import type Anthropic from '@anthropic-ai/sdk';

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
  if (profile.allergies.length) lines.push(`Allergies (NEVER include): ${profile.allergies.join(', ')}.`);
  if (profile.dislikedIngredients.length)
    lines.push(`Disliked (avoid): ${profile.dislikedIngredients.join(', ')}.`);
  if (profile.preferredCuisines.length)
    lines.push(`Preferred cuisines: ${profile.preferredCuisines.join(', ')}.`);
  lines.push(`Household size: ${profile.householdSize}.`);
  if (profile.cookingSkill) lines.push(`Cooking skill: ${profile.cookingSkill}.`);
  return lines.join('\n');
}
