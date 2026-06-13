# Auth

> **TL;DR.** Supabase Auth is the system of record for identity (email,
> password, OAuth, refresh tokens). Our backend doesn't store passwords or
> issue tokens — it only verifies Supabase-issued JWTs as a bearer token.
> A row in our `users` table is **lazily created** the first time a
> Supabase user calls `/auth/me`. Admin access is gated by
> `users.plan === 'admin'`.

## Identity vs application state

There are two parallel records of a user:

| | Supabase | Our DB |
| --- | --- | --- |
| Table | `auth.users` (managed) | `public.users` |
| Primary key | UUID (Supabase-generated) | Same UUID — we mirror it |
| Owns | email, password hash, OAuth providers, last login, MFA | plan, locale, dietary profile, app preferences |
| Mutable from | Supabase dashboard / Auth API / client SDK | Our REST API only |
| Source of truth for identity | ✅ | ❌ |
| Source of truth for "is this user a Pro" | ❌ | ✅ |

The same UUID identifies the same person on both sides. We never generate
our own user IDs — we always take Supabase's.

## Token flow

```
                         Mobile / Web / Admin
                                  │
                          supabase.auth.signIn(...)
                                  │
                                  ▼
                       ┌────────────────────┐
                       │ Supabase Auth      │
                       │ (managed service)  │
                       └─────────┬──────────┘
                                 │
                            access_token (JWT, ~1h)
                            refresh_token (long-lived)
                                 │
                                 ▼
                       client stores in:
                         mobile  → expo-secure-store (default Supabase setup)
                         web/admin → httpOnly cookies (Supabase SSR helpers)
                                 │
                                 ▼
                       every API call attaches header
                       Authorization: Bearer <access_token>
                                 │
                                 ▼
                       Our Express middleware (requireAuth) runs:
                       ┌──────────────────────────────────┐
                       │ supabaseAdmin.auth.getUser(token)│
                       │   uses service_role key          │
                       │   verifies signature             │
                       │   returns { user: { id, ... } } │
                       └──────────┬───────────────────────┘
                                  │
                                  ▼
                       req.userId = user.id
                       req.userJwt = token
                                  │
                                  ▼
                            handler runs
```

Refresh: when access_token nears expiry, the Supabase client SDK on the
device automatically calls Supabase's `/token` endpoint with the refresh
token and gets a fresh access_token. The backend doesn't participate — we
only see whichever access_token the client sends with each request.

## The lazy mirror — first /auth/me

On signup, Supabase creates the row in `auth.users`. **Nothing is written
to our `public.users` yet.** That happens on the first authenticated call
that needs an application-side user — `GET /auth/me`:

```ts
// services/api/src/routes/auth.ts
router.get('/me', requireAuth, async (req, res) => {
  let user = await users.findById(req.userId);

  if (!user) {
    // First time we've seen this Supabase user → mirror lazily.
    const { data } = await supabaseAdmin.auth.admin.getUserById(req.userId);
    user = await users.create({
      id: req.userId,
      email: data.user.email,
      name: data.user.user_metadata?.name ?? data.user.email.split('@')[0],
      avatarUrl: data.user.user_metadata?.avatar_url ?? null,
    });
  }

  res.json(user);
});
```

**Why lazy and not eager?**

- No coupling to Supabase webhooks (the only "eager" alternative is a
  Supabase database trigger or Edge Function that fires on `auth.users`
  insert — more moving parts).
- Self-healing — if `public.users` row is ever lost or out of sync, the
  next `/auth/me` recreates it.
- Defers the work to a moment when it's needed anyway (the client always
  calls `/auth/me` after signup).

**Edge case:** subsequent auth endpoints (`POST /meal-plans`, `POST /recipes`,
etc.) assume `public.users` row exists for `req.userId`. If the client makes
those before `/auth/me`, the row won't exist yet and the FK from
`meal_plans.user_id` will fail.

In practice the mobile app always calls `/auth/me` immediately after sign-in
via a TanStack Query at the root layout, so this rarely happens. If you
build a new client, follow the same pattern: gate the rest of the API
behind a successful `/auth/me` round-trip.

## How to make a user an admin

Admin access is gated in two places:

1. **`requireAdmin` middleware** on `/v1/admin/*` routes (backend) —
   reads `public.users.plan` directly.
2. **Next.js middleware** at `apps/admin/src/middleware.ts` —
   reads `user_metadata.plan` from the Supabase JWT.

These two **must agree**. The Supabase JWT is signed at login and won't
re-read the column for an hour; the backend reads the DB on every request.
The pragmatic rule: set the value in both places, and accept up to one
hour of staleness on the admin web UI after promoting someone.

```sql
-- 1. Supabase side (used by admin web middleware)
update auth.users
  set raw_user_meta_data = raw_user_meta_data || jsonb_build_object('plan', 'admin')
  where email = 'andrii@example.com';

-- 2. Our DB side (used by /v1/admin/* server gate)
update public.users
  set plan = 'admin'
  where email = 'andrii@example.com';
```

After running both, the user must **sign out and back in** on the admin web
app — that's what forces Supabase to issue a fresh JWT with the updated
`user_metadata.plan` claim.

Same dual-write pattern applies to demoting an admin or making someone Pro
without going through Stripe (e.g. comping a Pro account for a friend).

## Why we don't use Row Level Security on `public.users`

Supabase strongly recommends RLS — policies that the database enforces, so
even a leaked anon key can't escalate. We've **deliberately turned it off**
on our `public.*` tables (recipes, meal_plans, shopping_lists, …) and rely
on the API layer for authorization.

**Reasons:**

1. We use the `service_role` key on the backend. Service role bypasses
   RLS by design — RLS policies do nothing for us.
2. The mobile / web clients **never talk to Postgres directly**. They go
   through our Express API, which checks the JWT and then queries with
   service-role privileges. RLS would only help if clients had direct
   Postgres access (which Supabase offers via PostgREST + anon key — we
   don't use that surface).
3. Centralised auth logic is easier to audit and version than RLS
   policies. A single `requireAuth` + `requireAdmin` chain in one
   middleware is more legible than dozens of CREATE POLICY statements.

**When this would change:** if we ever expose Supabase's auto-generated
PostgREST API to clients (e.g. for an offline-first feature using
`@supabase/supabase-js` direct queries), we'd need RLS on every public
table to prevent the anon key from reading anything it shouldn't. Until
then, the API is our only data gate.

## Files that touch auth

```
services/api/
├── src/
│   ├── middlewares/auth.ts                   # requireAuth — verifies JWT
│   ├── middlewares/admin.ts                  # requireAdmin — checks users.plan === 'admin'
│   ├── routes/auth.ts                        # /auth/me (lazy mirror), /auth/logout
│   ├── config/supabase.ts                    # supabaseAdmin client (service_role)
│   └── repositories/prisma/user.repository.ts

apps/mobile/
├── src/lib/supabase.ts                       # mobile Supabase client
└── src/lib/api.ts                            # attaches Bearer on every call

apps/web/
└── src/lib/supabase/                         # web Supabase SSR helpers
    ├── client.ts                             # browser
    ├── server.ts                             # server components
    └── middleware.ts                         # cookie refresh

apps/admin/
├── src/middleware.ts                         # admin-only gate (user_metadata.plan)
└── src/lib/supabase/                         # same shape as web
```

## Troubleshooting

**Mobile: "Auth session missing!" after restart**

The Supabase client tries to read tokens from `expo-secure-store` but
finds none. Either the user really is logged out, or storage was cleared
by a re-install / cache purge. App should route to the login screen.

**API: 401 "Invalid token"**

The access_token expired and the client didn't refresh. Supabase JS SDK
should auto-refresh — verify the client was initialized with
`autoRefreshToken: true` (default). If you see this intermittently after
long backgrounding, the client may have missed the refresh window;
prompt the user to sign in again.

**`/auth/me` returns 404 "Supabase user not found"**

The JWT was valid (signed correctly) but the user no longer exists in
`auth.users` — happens if you delete users from the Supabase dashboard
while their tokens are still cached on a device. They need to sign in
again, which clears stale tokens and re-creates Supabase state.

**Admin web app redirects me to `/login?error=forbidden`**

The middleware sees a logged-in user but with `user_metadata.plan !==
'admin'`. Either you forgot the Supabase side of the admin-promotion
(see "How to make a user an admin"), or you've promoted but haven't
signed back in since. Sign out → sign in → retry.

**FK violation: `meal_plans.user_id` references missing user**

A request hit a write endpoint before `/auth/me` mirrored the user. Open
Supabase Studio and run:

```sql
insert into public.users (id, email, name, plan, locale)
values ('<uuid from auth.users>', '<email>', '<name>', 'free', null);
```

…then have the client retry. The mobile app should call `/auth/me` first
on sign-in to avoid this race.

**JWT claims look out of date (e.g. plan badge wrong after upgrade)**

JWTs are signed at login and cached for ~1 hour. `user_metadata` reads
from the JWT inherit that TTL. `users.plan` reads from the DB always
return the fresh value. The mobile app uses `users.plan` via `/auth/me`
on AppState-active, so it self-heals within seconds; the admin web app
inherits from JWT and requires re-login to refresh.
