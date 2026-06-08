# Dishday — Documentation

Navigation hub. Each topic lives in its own file under `docs/` so it stays focused and easy to update.

## Getting started

Start with the [root README](../README.md) for prerequisites, install steps, and the `pnpm dev` flow.

## Topics

| Doc | Covers |
| --- | --- |
| [**Architecture**](./architecture.md) | Monorepo layout · service boundaries · repository pattern · how to swap the database |
| [**AI integration**](./ai.md) | Provider abstraction · Claude vs Gemini · meal-plan generation pipeline · Bull queue + worker · cost and rate limits · debugging |

## Coming next (TODO)

These docs are not written yet — placeholders for upcoming work:

- `auth.md` — Supabase Auth, `/auth/me` lazy-mirror, RLS strategy
- `payments.md` — Stripe checkout / portal / webhook lifecycle
- `database.md` — Prisma + Supabase Postgres, migration workflow, pooler vs direct connection
- `deployment.md` — Vercel (web/admin), Railway (api + redis), EAS (mobile)
- `mobile.md` — Expo SDK 55 quirks, theming, Screen component, scanner

## Conventions

- **Diagrams in ASCII** — render in any terminal/markdown viewer, no external tools needed.
- **Code references** use `path/to/file.ts:lineNumber` so they're greppable.
- **Each doc has a TL;DR at the top** so you can skim before diving in.
