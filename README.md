# Dishday

AI-powered meal planning platform — **web · mobile · admin** in one Turborepo monorepo, backed by Supabase and a swappable AI provider (Claude or Gemini).

> 📚 **Detailed docs live in [`docs/`](./docs/README.md)** — architecture, AI integration, deployment, and more.

## Stack

| Layer    | Tech                                                       |
| -------- | ---------------------------------------------------------- |
| Monorepo | Turborepo + pnpm workspaces                                |
| Web      | Next.js 15 (App Router) · Supabase SSR · TanStack Query    |
| Mobile   | Expo SDK 55 · Expo Router · Supabase JS · TanStack Query   |
| Admin    | Next.js 15 · Supabase SSR · TanStack Table · Recharts      |
| API      | Node.js 20 · Express 5 · TypeScript · Zod                  |
| Database | **Supabase** (PostgreSQL + Auth + Storage + Realtime)      |
| ORM      | Prisma 6 (direct Postgres connection to Supabase)          |
| Queue    | Bull + Redis (Docker locally, Upstash in prod)             |
| Payments | Stripe                                                     |
| AI       | Anthropic Claude **or** Google Gemini — see [docs/ai.md](./docs/ai.md) |
| Deploy   | Vercel (web + admin) · EAS (mobile) · Railway (api + redis)|

## Repository layout

```
dishday/
├── apps/
│   ├── web/          # Next.js 15 — user app          (:3000)
│   ├── mobile/       # Expo SDK 55 — React Native
│   └── admin/        # Next.js 15 — admin panel       (:3001)
├── packages/
│   ├── types/        # shared TypeScript interfaces
│   ├── ui/           # shared React components
│   ├── api-client/   # typed fetch wrappers
│   └── utils/        # date / nutrition / slug helpers
├── services/
│   └── api/          # Express 5 backend              (:4000)
│       └── prisma/schema.prisma
├── turbo.json
└── package.json
```

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 — `npm i -g pnpm`
- **Docker** — only required to run Redis locally (`docker run -p 6379:6379 redis:7`)
- A **Supabase** project (free tier is enough)

## Set up Supabase

1. Create a new project at https://supabase.com/dashboard (region close to you).
2. In **Project settings → API**, copy:
   - `Project URL` → `SUPABASE_URL` (also `NEXT_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_URL`)
   - `anon public` key → `SUPABASE_ANON_KEY` (also the `*_PUBLIC_*` variants)
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose)
3. In **Project settings → Database**, copy the **Connection string (URI, Session mode)** → `DATABASE_URL`.
4. Make sure **Auth → Email** is enabled (or any OAuth providers you want).
5. (Optional) Create a Storage bucket `recipe-images` if you plan to use Supabase Storage for uploads.

## Getting started

```bash
# 1. Install workspaces
pnpm install

# 2. Configure environment
cp .env.example .env
# → fill in SUPABASE_*, DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY, STRIPE_*, REDIS_URL

# 3. Start Redis locally (skip if you already have one running)
docker run -d --name dishday-redis -p 6379:6379 redis:7

# 4. Initialise the database via Prisma (against Supabase Postgres)
pnpm db:generate    # generate Prisma client
pnpm db:migrate     # create + apply dev migration
pnpm db:seed        # load sample recipes

# 5. Start everything in parallel
pnpm dev

# 6. (in a separate terminal) start the AI worker
npm run worker -w @dishday/api
```

After `pnpm dev` you'll have:

| App    | URL                          |
| ------ | ---------------------------- |
| Web    | http://localhost:3000        |
| Admin  | http://localhost:3001        |
| API    | http://localhost:4000        |
| Health | http://localhost:4000/health |

For mobile, in a separate terminal:

```bash
pnpm --filter @dishday/mobile dev
# then press i / a / w in the Expo CLI
```

## Useful scripts

```bash
pnpm build            # build everything
pnpm lint             # lint everything
pnpm type-check       # tsc --noEmit across the repo
pnpm test             # vitest
pnpm db:studio        # Prisma Studio (view/edit DB rows)
pnpm format           # prettier write
```

## Database schema

`services/api/prisma/schema.prisma` is the source of truth (Supabase Postgres underneath):

- `users` — auth & subscription tier (`free` / `pro` / `admin`)
- `user_profiles` — dietary goals, allergies, diets, household, cuisines
- `recipes` — `source ∈ {user, ai, official}`, tags, `meal_type[]`, moderation flags
- `recipe_ingredients` — quantity, unit, order_index, cascade with recipe
- `meal_plans` — weekly plans, `generated_by ∈ {manual, ai}`, lock flag
- `meal_plan_entries` — `(day_of_week 0–6, meal_type)` × recipe × servings
- `shopping_lists` — auto-generated per plan
- `shopping_list_items` — consolidated ingredients, `is_checked` toggle
- `subscriptions` — `provider ∈ {stripe, apple, google}` · status lifecycle
- `ai_usage_logs` — tokens, cost, latency per `type ∈ {meal_plan, recipe, nutrition}`

> Supabase Auth manages identity. The `users` table mirrors `auth.users.id` (UUID) and stores app-level fields (plan, profile).

## Architecture & AI

Detailed documentation lives under [`docs/`](./docs/README.md):

- **[docs/architecture.md](./docs/architecture.md)** — monorepo layout, repository pattern, how to swap the DB
- **[docs/ai.md](./docs/ai.md)** — meal-plan generation pipeline, Claude vs Gemini, worker process, queue, costs

Short version: HTTP routes depend on service interfaces, services depend on repository interfaces, concrete Prisma + Postgres bindings live behind a composition root in `services/api/src/container.ts`. AI lives behind a provider abstraction in `services/api/src/services/ai/` — works with Claude or Gemini depending on which API key is in `.env`.

## Deployment

| App      | Target                       |
| -------- | ---------------------------- |
| web      | Vercel                       |
| admin    | Vercel (separate project)    |
| mobile   | EAS Build + Expo Updates     |
| api      | Railway (Docker)             |
| redis    | Railway add-on / Upstash     |
| Postgres | **Supabase** (managed)       |
| Storage  | Supabase Storage             |

## License

UNLICENSED — internal pet project.
