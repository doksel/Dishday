# Architecture

> **TL;DR.** Monorepo with three apps and one backend service. The API is layered so the database — or the whole data source — can be swapped without touching business logic. Frontend apps have the same kind of abstraction via the shared `api-client` package.

## Repository layout

```
dishday/
├── apps/
│   ├── web/          # Next.js 15 — user app          (:3000)
│   ├── mobile/       # Expo SDK 55 — React Native
│   └── admin/        # Next.js 15 — admin panel       (:3001)
├── packages/
│   ├── types/        # shared TypeScript interfaces (domain)
│   ├── ui/           # shared React components
│   ├── api-client/   # typed fetch wrappers (the only way frontends talk to API)
│   └── utils/        # date / nutrition / slug helpers
├── services/
│   └── api/          # Express 5 backend              (:4000)
│       └── prisma/schema.prisma
├── turbo.json
└── package.json (npm workspaces)
```

## Database schema

`services/api/prisma/schema.prisma` is the source of truth. Supabase Postgres underneath.

| Table | Notes |
| --- | --- |
| `users` | mirrors `auth.users.id`; stores `plan ∈ {free, pro, admin}` |
| `user_profiles` | dietary goals, allergies, diets, household, cuisines |
| `recipes` | `source ∈ {user, ai, official}`, tags, `meal_type[]`, moderation flags |
| `recipe_ingredients` | quantity, unit, order_index — cascades with recipe |
| `meal_plans` | weekly plans, `generated_by ∈ {manual, ai}`, lock flag |
| `meal_plan_entries` | `(day_of_week 0–6, meal_type)` × recipe × servings |
| `shopping_lists` | auto-generated per plan |
| `shopping_list_items` | consolidated ingredients, `is_checked` toggle |
| `subscriptions` | `provider ∈ {stripe, apple, google}`, status lifecycle |
| `ai_usage_logs` | tokens, cost, latency per `type ∈ {meal_plan, recipe, nutrition}` |

Supabase Auth manages identity. The `users` table mirrors `auth.users.id` (UUID) and stores app-level fields (plan, profile). The mirror row is lazily created on first authenticated request — see `services/api/src/routes/auth.ts`.

## Data access — swap-friendly architecture

Dependencies flow inward only:

```
HTTP routes  ─►  services (use cases)  ─►  repository interfaces
                                                    ▲
                                          ┌─────────┴──────────┐
                                          │                    │
                                   Prisma + Postgres     In-memory  (or REST,
                                   (current default)     Supabase JS, Mongo…)
```

### Layout under `services/api/src/`

```
repositories/
├── interfaces.ts                # contracts — the ONLY thing services depend on
├── prisma/
│   ├── mappers.ts               # Prisma → @dishday/types conversion
│   ├── recipe.repository.ts
│   ├── user.repository.ts
│   ├── meal-plan.repository.ts
│   ├── shopping-list.repository.ts
│   ├── subscription.repository.ts
│   ├── ai-usage.repository.ts
│   └── index.ts                 # createPrismaRepositories(prisma)
└── memory/
    └── recipe.repository.ts     # alternative impl — same interface

services/
├── recipe.service.ts            # business logic, depends on interfaces
├── meal-plan.service.ts
└── index.ts                     # createServices(repos)

container.ts                     # composition root — picks impls
routes/                          # HTTP, receive container by argument
```

### What this buys you

- **Swap the DB**: write `repositories/<driver>/*.repository.ts` against the same interfaces (Supabase JS, Drizzle, Mongo, REST). Change one line in `container.ts`. Routes and services don't know or care.
- **Mock for tests**: pass `createTestContainer({ recipes: new InMemoryRecipeRepository(), … })` into `createApp(container)` — no Postgres needed for unit tests. See `services/api/src/services/recipe.service.test.ts` for an example.
- **Type safety end-to-end**: repositories return domain types from `@dishday/types`, the same types the web/mobile clients consume via `@dishday/api-client`. Prisma's `Decimal` and `Date` are converted at the boundary in `mappers.ts`.

### Adding a new entity (e.g. "recipe of the day")

1. Add the model to `prisma/schema.prisma` → `npm run db:migrate`.
2. Define a `RecipeOfTheDayRepository` interface in `repositories/interfaces.ts`.
3. Implement it in `repositories/prisma/recipe-of-the-day.repository.ts`.
4. Wire it into `createPrismaRepositories()` and the `Repositories` aggregate.
5. (Optional) Write a service if there's non-trivial business logic.
6. Add a route that calls `container.services.recipeOfTheDay.*`.

## Frontend abstraction (api-client)

`packages/api-client` plays the same role for `web`, `admin`, and `mobile`: every screen calls `api.recipes.list()` / `api.mealPlans.aiGenerate()` etc., never `fetch` directly.

To point the apps at a different backend (or a mock), construct `createDishdayApi(client)` with a custom `ApiClient` or stub it in tests. The `getApi()` factory in each app (`apps/web/src/lib/api.ts`, `apps/mobile/src/lib/api.ts`) attaches the Supabase access token as a Bearer header on every request.

## Process topology

```
                              ┌─────────────┐
                              │   Mobile    │ (Expo Router, TanStack Query)
                              ├─────────────┤
                              │     Web     │ (Next.js 15, SSR)
                              ├─────────────┤
                              │    Admin    │ (Next.js 15)
                              └──────┬──────┘
                                     │ HTTPS + Supabase JWT (Bearer)
                                     ▼
                              ┌─────────────┐         ┌─────────┐
                              │  API (Exp)  │◄────────│  Redis  │
                              │  port 4000  │         └────┬────┘
                              └──────┬──────┘              │
                                     │                     │
                                     │ Prisma              │ Bull queue
                                     ▼                     ▼
                              ┌─────────────┐       ┌──────────────┐
                              │  Supabase   │       │ AI Worker    │ (separate process)
                              │  Postgres   │       │ Claude/Gemini│
                              └─────────────┘       └──────────────┘
```

## See also

- [docs/ai.md](./ai.md) — AI integration details (provider abstraction, worker, queue)
- `services/api/src/repositories/interfaces.ts` — domain repository contracts
- `services/api/src/container.ts` — composition root
- `packages/api-client/src/endpoints.ts` — frontend API surface
