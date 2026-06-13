# Dishday — Documentation

Navigation hub. Each topic lives in its own file under `docs/` so it stays focused and easy to update.

## Getting started

For first-time setup, start with the [root README](../README.md). Then bookmark **[development.md](./development.md)** — it's what you'll open every morning.

## Topics

| Doc | Covers |
| --- | --- |
| [**Development**](./development.md) | Daily workflow · which terminal runs what · troubleshooting cheatsheet |
| [**Architecture**](./architecture.md) | Monorepo layout · service boundaries · repository pattern · how to swap the database |
| [**AI integration**](./ai.md) | Provider abstraction · Claude vs Gemini vs Mock · meal-plan generation pipeline · Bull queue + worker · cost and rate limits · debugging |
| [**Auth**](./auth.md) | Supabase Auth · `/auth/me` lazy-mirror · admin promotion · why no RLS |
| [**Payments**](./payments.md) | Stripe Checkout · webhook lifecycle · failure modes · App Store / Play Store roadmap |
| [**Deployment**](./deployment.md) | Railway (api+worker+redis) · Vercel (web/admin) · EAS (mobile) · first-release checklist |

## Coming next (TODO)

These docs are not written yet — placeholders for upcoming work:

- `database.md` — Prisma + Supabase Postgres, migration workflow, pooler vs direct connection
- `mobile.md` — Expo SDK 55 quirks, theming, Screen component, scanner

## Conventions

- **Diagrams in ASCII** — render in any terminal/markdown viewer, no external tools needed.
- **Code references** use `path/to/file.ts:lineNumber` so they're greppable.
- **Each doc has a TL;DR at the top** so you can skim before diving in.
