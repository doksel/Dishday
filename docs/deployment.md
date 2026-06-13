# Deployment

> **TL;DR.** Production runs on three providers:
>
> - **Railway** — `api` (Express) + `worker` (Bull) + Redis add-on
> - **Vercel** — `web` and `admin` (two separate projects pointing at this monorepo)
> - **EAS** — mobile builds (iOS + Android), submitted to App Store / Play Store
>
> Supabase is the system of record for Postgres + Auth + Storage; it is configured
> once and shared by all environments via env vars.

## Topology

```
                    ┌──────────────────┐
                    │     Supabase     │ ── Postgres · Auth · Storage
                    └──────────────────┘
                             ▲
                             │ DATABASE_URL / SUPABASE_*
            ┌────────────────┼────────────────┐
            │                │                │
   ┌────────┴───────┐ ┌──────┴───────┐ ┌─────┴────────┐
   │   Railway      │ │   Vercel     │ │   Vercel     │
   │ api · worker · │ │     web      │ │    admin     │
   │     redis      │ │ (next.js)    │ │  (next.js)   │
   └────────────────┘ └──────────────┘ └──────────────┘
            ▲                                  ▲
            │ EXPO_PUBLIC_API_URL              │ NEXT_PUBLIC_API_URL
            │                                  │
        ┌───┴─────────────┐                    │
        │   iOS / Android │                    │
        │   (EAS build)   │                    │
        └─────────────────┘                    │
                                               │
                                       ┌───────┴─────────┐
                                       │     Stripe      │
                                       │ Checkout · Hook │
                                       └─────────────────┘
```

## 0. Prerequisites

Before first deploy, have these accounts ready:

- **Supabase** project (prod). Keep `service_role` key secret — server-only.
- **Railway** account with a project linked to this repo. Enable the Redis plugin.
- **Vercel** account. Will host two projects: `dishday-web` and `dishday-admin`.
- **Stripe** account with one Product → one Price (Pro monthly $9.99). Note the `price_…` id.
- **Anthropic** API key (the worker uses Claude).
- **Apple Developer** + **Google Play Console** accounts (for store submission).

## 1. Supabase

1. Create the project. Note `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. Postgres connection strings:
   - `DATABASE_URL` → use the **transaction pooler** (port 6543) for runtime.
   - `DIRECT_URL`  → use the **direct connection** (port 5432) for Prisma migrate.
3. Enable Email auth, configure redirect URLs to include your Vercel domains.

## 2. Railway (api + worker + redis)

### 2.1 Create two services pointing at this repo

In the Railway dashboard:

1. **Service `dishday-api`** — picks up `railway.toml` and `services/api/Dockerfile` automatically. Default start command (from `railway.toml`):
   ```
   cd services/api && pnpm db:deploy && node dist/index.js
   ```

2. **Service `dishday-worker`** — same repo, same Dockerfile. **Override** the start command in the service settings:
   ```
   cd services/api && node dist/queue/worker.js
   ```
   (Do NOT run `db:deploy` here — the API already does it once on its own boot.)

3. **Redis plugin** — Railway dashboard → "Add" → Redis. The connection URL is auto-injected as `REDIS_URL` on services in the same project.

### 2.2 Environment variables (both services)

| Key | Value | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | |
| `DATABASE_URL` | Supabase pooler (port 6543) | runtime queries |
| `DIRECT_URL` | Supabase direct (port 5432) | only used by `db:deploy` migrations |
| `SUPABASE_URL` | `https://xxx.supabase.co` | |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase dashboard | **secret** |
| `REDIS_URL` | auto-injected by Redis plugin | |
| `ANTHROPIC_API_KEY` | `sk-ant-…` | worker only, harmless on api |
| `STRIPE_SECRET_KEY` | `sk_live_…` | api only |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | api only — see §2.3 |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_…` | api only |
| `CORS_ORIGINS` | `https://dishday.app,https://admin.dishday.app` | comma-separated |

### 2.3 Stripe webhook

1. After the api service is up, copy its public URL (e.g. `https://dishday-api-production.up.railway.app`).
2. In Stripe dashboard → Developers → Webhooks → Add endpoint:
   - URL: `https://dishday-api-production.up.railway.app/v1/subscriptions/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Copy the signing secret (`whsec_…`) into the `STRIPE_WEBHOOK_SECRET` env var on the api service.

### 2.4 Verify

```
curl https://dishday-api-production.up.railway.app/health
# → { "ok": true }
```

Worker logs (in Railway dashboard) should show:

```
AI worker registered for "meal_plan"
```

## 3. Vercel (web + admin)

Create **two separate Vercel projects** from the same GitHub repo. For each, configure:

| Project | Root Directory | Notes |
| --- | --- | --- |
| `dishday-web` | `apps/web` | uses `apps/web/vercel.json` |
| `dishday-admin` | `apps/admin` | uses `apps/admin/vercel.json` |

### Environment variables (both projects)

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase dashboard |
| `NEXT_PUBLIC_API_URL` | `https://dishday-api-production.up.railway.app/v1` |

Admin-only additional check: the middleware (`apps/admin/src/middleware.ts`) refuses anyone without `user_metadata.plan === 'admin'`. Make sure your admin users have that set in Supabase.

After deploy, point custom domains in Vercel:

- `dishday.app` → `dishday-web`
- `admin.dishday.app` → `dishday-admin`

Add both to Supabase Auth → Redirect URLs.

## 4. EAS (mobile)

### 4.1 Initial setup (once)

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest project:init    # links app.json to an EAS project id
```

### 4.2 Configure secrets

EAS reads `env` from `apps/mobile/eas.json` but **does not** read your local `.env`. Either:

- Inline values in `eas.json` (fine for `EXPO_PUBLIC_*` since they're shipped to clients anyway)
- Or push as EAS secrets:
  ```bash
  npx eas-cli secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."
  ```

Edit `apps/mobile/eas.json` and replace the placeholders:

- `YOUR-PROD-PROJECT.supabase.co` → real Supabase URL
- `PUT_PROD_ANON_KEY_HERE` → real Supabase anon key
- `https://dishday-api.up.railway.app/v1` → your actual Railway API URL
- The `submit.production.ios.*` and `submit.production.android.serviceAccountKeyPath` blocks — fill with Apple/Google credentials.

### 4.3 Build

```bash
# Internal preview (TestFlight / Internal Track)
npx eas-cli build --platform all --profile preview

# Production (store-ready)
npx eas-cli build --platform all --profile production
```

### 4.4 Submit

```bash
npx eas-cli submit --platform ios --latest
npx eas-cli submit --platform android --latest
```

### 4.5 OTA updates

For minor JS-only fixes between binary releases:

```bash
npx eas-cli update --branch production --message "Fix shopping list crash"
```

App Store and Play Store binaries don't have to be rebuilt for pure-JS changes.

## 5. First-release checklist

- [ ] Supabase project created, both URLs in hand (pooler + direct)
- [ ] Stripe Product + Price created, `price_…` noted
- [ ] Railway services up (api responds 200 on `/health`, worker logs "registered")
- [ ] Stripe webhook configured against Railway URL; test event delivered OK
- [ ] First Vercel deploy of `web` and `admin` green
- [ ] Admin user has `user_metadata.plan = 'admin'` in Supabase
- [ ] EAS project initialized, `eas.json` placeholders replaced
- [ ] First mobile build green (preview profile)
- [ ] End-to-end smoke (in production):
  - [ ] sign up via mobile → user row mirrored on backend
  - [ ] AI generate (Free) → menu preview appears in ~3-5s
  - [ ] tap a slot → paywall opens, Stripe checkout completes, plan flips to Pro
  - [ ] AI generate (Pro) → full plan with shopping list
  - [ ] submit a user recipe → appears in admin moderation queue → approve → public

## 6. Troubleshooting

**`PrismaClientInitializationError: Can't reach database server`**
→ Check `DATABASE_URL` uses the pooler (port 6543). Direct connections to Supabase from Railway sometimes hit IPv6 issues; pooler avoids this.

**Migrations don't run on Railway boot**
→ Ensure the start command is the one in `railway.toml`. If you overrode it in the UI, restore the `pnpm db:deploy && node dist/index.js` chain.

**Stripe webhook returns 400 "Invalid signature"**
→ The webhook secret env var must match what Stripe shows for that specific endpoint. If you re-created the endpoint, copy the new secret.

**Mobile build fails on `expo-secure-store` or `expo-camera`**
→ Make sure plugins listed in `app.json` are also installed at the same Expo SDK major version as the rest of mobile deps.

**Vercel build fails with "module not found @dishday/types"**
→ Workspace packages need a fresh install. Vercel should run the `installCommand` in `vercel.json` which does `pnpm install --frozen-lockfile` at the monorepo root.

**AI worker doesn't pick up jobs**
→ Both api and worker must share the same `REDIS_URL`. Confirm Redis is wired to both services in the Railway dashboard.

**Free user generates "names only" but Pro user gets the same shape**
→ Confirm the Pro user's `users.plan` row in Supabase is `'pro'` (not just `user_metadata`). The worker reads the canonical `users.plan` column.
