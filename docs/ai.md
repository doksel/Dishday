# AI Integration

> **TL;DR.** Meal-plan generation is async: the HTTP endpoint pushes a job to a Redis-backed Bull queue and returns `202` immediately. A separate worker process picks the job up, calls an `AiProvider` (Claude or Gemini depending on which key is set in `.env`), persists the result as a `MealPlan` with recipes, and marks the job complete. The client polls `GET /v1/meal-plans/ai/jobs/:id` until `state === 'completed'`.

## Why a queue at all?

A single Claude / Gemini call for a weekly plan takes **10–30 seconds**. If we ran it inline in the HTTP handler:

- Browser / mobile client would hold the connection for that long
- Vercel / Railway / CloudFlare typically drop requests after ~30 s
- One slow user can't block another's request — Node is single-threaded for JS

Async with a queue solves all three: HTTP returns in milliseconds, work happens elsewhere, multiple workers can scale horizontally.

## End-to-end pipeline

```
                                                Process boundary
                                                    │
[Mobile / Web]                  [API process]       │   [Worker process]
                                                    │
POST /meal-plans/ai/generate                        │
       └──► validate Pro plan ──► aiQueue.add(...)  │
              ◄─── 202 jobId ───┘                   │
                                          ▲         │   ┌─ aiQueue.process(...)
                                          │  Redis  │   │
                                          ├──────── job│ ▼
                                          │         │   1. fetch UserProfile
                                          │         │   2. getAiProvider().generate(...)
                                          │         │   3. parse + Zod-validate JSON
                                          │         │   4. create Recipe rows (source='ai')
                                          │         │   5. create MealPlan + entries
                                          │         │   6. log token usage / cost
                                          │   completed
                                          └─────────┴── returnvalue: { ok: true, resultId: planId }

GET /meal-plans/ai/jobs/:id ─► aiQueue.getJob(id) ──► { state, result, failedReason }
       (client polls every ~2s)
```

## Repo layout

```
services/api/src/
├── queue/
│   ├── ai-queue.ts          # Bull queue + job payload typing (producer side)
│   ├── ai-worker.ts         # startAiWorker() — registers the consumer
│   └── worker.ts            # entry point: runs `tsx src/queue/worker.ts`
├── services/ai/
│   ├── types.ts             # AiProvider, AiCompletion, AiGenerateOptions
│   ├── anthropic.ts         # AnthropicProvider implements AiProvider
│   ├── gemini.ts            # GeminiProvider implements AiProvider
│   ├── provider.ts          # getAiProvider() factory — picks impl by env
│   └── meal-plan-generator.ts  # prompt, parse, persist; depends only on AiProvider
└── routes/meal-plans.ts     # HTTP endpoints (producer + status polling)
```

## Provider abstraction

`services/ai/types.ts` defines a tiny interface every provider implements:

```ts
interface AiProvider {
  readonly name: 'anthropic' | 'gemini';
  readonly model: string;
  generate(opts: AiGenerateOptions): Promise<AiCompletion>;
}

interface AiGenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

interface AiCompletion {
  text: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;  // each provider knows its own pricing
}
```

`meal-plan-generator.ts` only ever calls `getAiProvider().generate(...)`. Whether that returns an `AnthropicProvider` or a `GeminiProvider` is decided **once** by the factory:

```ts
// services/ai/provider.ts
export function getAiProvider(): AiProvider {
  if (env.ANTHROPIC_API_KEY) return new AnthropicProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL);
  if (env.GEMINI_API_KEY)   return new GeminiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL);
  throw new Error('No AI provider configured…');
}
```

### Switching providers

Just edit `.env`:

| Goal | `.env` |
| --- | --- |
| Use Claude (best quality, paid) | `ANTHROPIC_API_KEY=sk-ant-…` |
| Use Gemini (free tier, decent) | `GEMINI_API_KEY=AIzaSy…`, leave `ANTHROPIC_API_KEY` empty |
| Disable AI (API still starts) | leave both empty |

When both are set, **Anthropic wins** (priority order in `provider.ts`).

### Adding a third provider (e.g. OpenAI)

1. Add SDK to `services/api/package.json`.
2. Create `services/api/src/services/ai/openai.ts` implementing `AiProvider`.
3. Add an `OPENAI_API_KEY` field to `services/api/src/config/env.ts`.
4. Insert a new branch in `getAiProvider()` in priority order.

No changes anywhere else in the codebase — `meal-plan-generator.ts`, the worker, the route, the mobile client — none of them know which provider is active.

## Cost & rate limits

| Provider | Per generation | Free tier |
| --- | --- | --- |
| **Claude Sonnet 4** | ~$0.04 (3 k in / 2 k out, $3/$15 per 1M) | $5 startup credit on new accounts |
| **Gemini 2.0 Flash** | ~$0.0008 (paid), $0 (free) | **15 req/min, 1 500/day, 1M tokens/min** — generous |

Token usage and USD cost of every call are written to `ai_usage_logs` (`AiUsageLogRepository.log`). The Admin panel charts these (`apps/admin/src/app/ai-cost/page.tsx`).

Both providers' rate limits are higher than what one dev or even early production will hit. If you start running into them, BullMQ supports concurrency throttling — set `aiQueue.process('meal_plan', 2, handler)` to limit to 2 concurrent jobs.

## Output format

The system prompt asks for **strict JSON** matching this schema (see `meal-plan-generator.ts` line ~17):

```json
{
  "days": [
    {
      "dayOfWeek": 0,
      "meals": [
        { "mealType": "breakfast", "title": "...", "description": "...",
          "calories": 450, "proteinG": 22, "carbsG": 55, "fatG": 12,
          "ingredients": [{ "name": "...", "quantity": 100, "unit": "g" }] }
      ]
    }
  ]
}
```

Then it's validated with Zod (`planSchema`). If the model returns malformed JSON the whole job fails — Bull will retry once with exponential backoff (`attempts: 2, backoff: 1500ms`).

For Gemini we explicitly set `responseMimeType: 'application/json'` in the generation config — the model is forced to emit pure JSON, no preamble or code fences. Claude isn't quite as strict, so the parser strips any ```json …  ``` fencing defensively.

## Personalisation

When a user has a `UserProfile`, the user prompt includes their:

- Dietary goals (calories / macros)
- Diets (`vegan`, `keto`, …)
- Allergies (hard exclusions)
- Disliked ingredients (soft avoids)
- Preferred cuisines
- Household size, cooking skill

Empty profile → falls back to a balanced 2000 kcal/day default. The exact prompt-building lives in `meal-plan-generator.ts:buildUserPrompt`.

## Running the worker

The worker is a **separate Node process** from the API. Two terminals during dev:

```bash
# terminal 1 — HTTP API
npm run dev -w @dishday/api

# terminal 2 — AI worker (consumes Redis queue)
npm run worker -w @dishday/api
```

Both must point at the same `REDIS_URL` and `DATABASE_URL`.

In production deploy them as two services (e.g. Railway `api` and Railway `worker`). The worker is stateless — scale horizontally by spinning more instances.

To stop a worker cleanly: send `SIGINT` / `SIGTERM`. The entry point closes the queue and exits.

## Status polling from the client

The mobile / web client does:

```ts
const job = await api.mealPlans.aiGenerate({ weekStart });   // returns { jobId, status: 'queued' }

// poll every ~2 seconds until completed or failed
for (;;) {
  const status = await fetch(`/v1/meal-plans/ai/jobs/${job.jobId}`).then(r => r.json());
  if (status.state === 'completed') return status.result;
  if (status.state === 'failed')    throw new Error(status.failedReason);
  await sleep(2000);
}
```

Bull's `getState()` returns one of: `'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused'`.

## Debugging

| Symptom | Likely cause | Where to look |
| --- | --- | --- |
| Job stays `waiting` forever | Worker not running | start `npm run worker -w @dishday/api` |
| Job `failed`, `failedReason: 'No AI provider configured'` | `.env` missing both keys | add `GEMINI_API_KEY` |
| Job `failed`, Zod error | Model returned malformed JSON | check logs in worker terminal; for Claude, try Gemini |
| `429 Too Many Requests` from Gemini | Free-tier RPM exceeded | wait 1 min, or upgrade |
| Generation OK but mobile shows no plan | Polling broken on client | check `getJob(id)` returns `state: 'completed'` and `returnvalue` |

Useful endpoints:

- `GET /v1/meal-plans/ai/jobs/:id` — single job status
- (Bull Board not mounted yet; if you want a UI add `@bull-board/api` + `@bull-board/express`)

## Related code

- Producer:     `services/api/src/routes/meal-plans.ts:91` (`POST /ai/generate`)
- Consumer:     `services/api/src/queue/ai-worker.ts:11` (`aiQueue.process('meal_plan', …)`)
- Generator:    `services/api/src/services/ai/meal-plan-generator.ts:82` (`generateWeeklyPlan`)
- Provider:     `services/api/src/services/ai/provider.ts:18` (`getAiProvider`)
- Anthropic:    `services/api/src/services/ai/anthropic.ts`
- Gemini:       `services/api/src/services/ai/gemini.ts`
- Usage log:    `services/api/src/repositories/prisma/ai-usage.repository.ts`
