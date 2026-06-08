# Local Development Workflow

> **TL;DR.** Four terminals: Redis · API · AI Worker · Mobile. Run them once at the start of each session, leave them running, edit code — everything hot-reloads.

## Prerequisites (one-time)

- **Node.js** ≥ 20
- **npm** (workspaces enabled by default in 7+)
- **Redis** — install via Homebrew: `brew install redis`
- **Xcode** — for iOS simulator (optional but recommended)
- **Supabase project** — for DB & Auth (see [`README.md`](../README.md))

## First-time setup

```bash
cd ~/Documents/Claude/Projects/Dishday

# 1. Install all workspaces
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.example .env
# fill in: SUPABASE_*, DATABASE_URL, DIRECT_URL, JWT_SECRET, REDIS_URL
# (ANTHROPIC_API_KEY / GEMINI_API_KEY optional — without them MockProvider kicks in)

# 3. Symlink .env into services/api/ so Prisma CLI finds it
ln -sf ~/Documents/Claude/Projects/Dishday/.env services/api/.env

# 4. Generate Prisma client + push schema to Supabase
npm run db:generate
npm run db:migrate
npm run db:seed       # loads 18 demo recipes with food images
```

## Daily development — 4 terminals

You'll want each service in its own terminal so you can see logs separately. Open these in order:

### Terminal 1 — Redis

```bash
brew services start redis   # one-time; auto-starts on subsequent logins
redis-cli ping              # sanity check → PONG
```

Once started, Redis runs in the background until you `brew services stop redis`. You can skip this terminal on subsequent days.

### Terminal 2 — API (Express)

```bash
cd ~/Documents/Claude/Projects/Dishday
npm run dev -w @dishday/api
```

Expected:
```
🍽 Dishday API listening on :4000
```

Health check from another terminal: `curl http://localhost:4000/health`. Auto-reloads on file changes via `tsx watch`.

### Terminal 3 — AI Worker

```bash
cd ~/Documents/Claude/Projects/Dishday
npm run worker -w @dishday/api
```

Expected:
```
🤖 Dishday AI worker started — waiting for jobs
```

This consumes the Bull queue and runs Claude / Gemini / Mock for AI meal-plan generation. Without it, `POST /v1/meal-plans/ai/generate` queues jobs that no one processes.

### Terminal 4 — Mobile (Expo)

```bash
cd ~/Documents/Claude/Projects/Dishday/apps/mobile
npx expo start
```

When the QR code appears:
- press **`i`** → iOS simulator
- press **`a`** → Android emulator
- press **`w`** → web browser (fastest sanity check)

**Do NOT use `--clear`** unless you've changed `babel.config.js`, `metro.config.js`, or env-resolved values. A fresh `--clear` cold-bundle can take 2–5 minutes; the warm bundle is seconds.

### Optional terminals

For web + admin:

```bash
npm run dev -w @dishday/web      # http://localhost:3000
npm run dev -w @dishday/admin    # http://localhost:3001
```

Or run **all** Next.js apps + API in parallel via Turborepo:

```bash
npm run dev   # root — turbo pipeline; works alongside worker + mobile
```

## Common scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Turbo: web + admin + api in parallel |
| `npm run dev -w @dishday/api` | API only (Express on :4000) |
| `npm run worker -w @dishday/api` | AI worker process |
| `npm run db:generate` | Regenerate Prisma client (after schema change) |
| `npm run db:migrate` | Apply new migration to Supabase |
| `npm run db:seed` | Load / update demo recipes |
| `npm run db:studio` | Open Prisma Studio (browser-based DB editor) |
| `npm run build` | Build all apps |
| `npm run lint` | Lint all workspaces |
| `npm run type-check` | TypeScript check across the repo |
| `npm test` | Run all tests (Vitest) |

## Stopping cleanly

`Ctrl+C` in each terminal. Redis keeps running in the background — stop it explicitly if needed:

```bash
brew services stop redis
```

## Troubleshooting

### Metro hangs on "Bundler cache is empty, rebuilding"

This is normal for the first run after `--clear` (1–3 min). If it's stuck >5 min, nuke caches and retry:

```bash
cd ~/Documents/Claude/Projects/Dishday/apps/mobile
pkill -9 -f "expo start" 2>/dev/null
pkill -9 -f "metro" 2>/dev/null
watchman watch-del-all 2>/dev/null
watchman shutdown-server 2>/dev/null
rm -rf .expo node_modules/.cache $TMPDIR/metro-* $TMPDIR/haste-map-* 2>/dev/null
ulimit -n 65536
npx expo start            # NOT --clear; caches already wiped manually
```

### API: `Invalid environment` on start

env.ts found `.env` but a field failed Zod validation. The error printout shows which keys are wrong AND which `.env` paths were checked. Common fixes:

- `DATABASE_URL` starts with `wpostgresql://` → typo, must be `postgresql://`
- `DATABASE_URL` password contains `#` → URL-encode as `%23`
- `JWT_SECRET` shorter than 32 chars → `openssl rand -hex 32`

### Prisma: `Environment variable not found: DATABASE_URL`

Prisma CLI runs from `services/api/` and only checks the local `.env`. Symlink it once:

```bash
ln -sf ~/Documents/Claude/Projects/Dishday/.env services/api/.env
```

### Supabase: `tenant/user postgres.xxx not found`

Your project is paused (free tier auto-pauses after 7 days of inactivity). Click **Resume project** in the Supabase dashboard → wait 30–60 sec → retry.

### `prepared statement "s0" already exists` during migration

`DATABASE_URL` points to Transaction pooler (port 6543). Migrations need **Direct/Session** connection (port 5432). Add a `DIRECT_URL` for migrations:

```env
DATABASE_URL=...pooler.supabase.com:6543/postgres?pgbouncer=true   # runtime
DIRECT_URL=...pooler.supabase.com:5432/postgres                    # migrations
```

Schema is already configured to use both.

### AI: `402 Pro plan required` on `/meal-plans/ai/generate`

Default plan is `free`; AI generation is Pro-only. Upgrade your dev user in Supabase **SQL Editor**:

```sql
UPDATE users SET plan = 'pro' WHERE email = 'you@email.com';
```

Sign out and back in to refresh `/auth/me`.

### AI: `429 Too Many Requests` from Gemini

Your Google Cloud project doesn't have free-tier quotas activated. Two options:

1. Add `USE_MOCK_AI=1` to `.env` — deterministic offline mock works for dev
2. Pay-as-you-go on Anthropic ($5 ≈ 125 generations) — set `ANTHROPIC_API_KEY`

See [`docs/ai.md`](./ai.md) for full provider details.

### Mobile: `Unable to resolve module expo-router/entry`

Make sure `apps/mobile/index.js` exists and contains just:
```js
import 'expo-router/entry';
```
And `apps/mobile/package.json` has `"main": "./index.js"`. This wraps the entry in a file local to the app, fixing npm-workspace path resolution.

### Mobile: `Project is incompatible with this version of Expo Go`

Your Expo Go app is older than SDK 55. Either:
- Update Expo Go from the App Store
- Run a dev build: `npx expo run:ios` (needs Xcode + CocoaPods)
- Use web for quick checks: press `w` in Expo CLI

### Tests fail with database errors

Vitest tests should use the **in-memory repositories**, not real Postgres. If a test imports `prisma` directly, replace it with `createTestContainer(memoryRepos)`. See [`docs/architecture.md`](./architecture.md#testing).
