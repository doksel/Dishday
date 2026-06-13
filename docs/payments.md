# Payments

> **TL;DR.** Stripe Checkout in an external browser (Safari / Chrome) →
> webhook → we flip `user.plan` to `'pro'` and upsert a `subscriptions` row.
> The mobile app refetches `/auth/me` on every AppState → 'active' so the
> Pro state lights up when the user returns from the browser. Stripe is the
> source of truth; our DB is a cache that the webhook keeps in sync.

## Why an external browser (and not in-app or IAP)?

Three options, three different trade-offs. We've picked option **A** for the
MVP launch — it's the path of least resistance and the only one fully working
today. Options B and C are roadmap items.

### A. Stripe Checkout in external browser ✅ current

Tap "Upgrade" → mobile app calls `POST /v1/subscriptions/checkout` → backend
returns a Stripe-hosted URL → app calls `Linking.openURL(url)` which hands off
to Safari (iOS) / Chrome (Android).

**Pros:** zero new SDKs, full Stripe feature set (Apple Pay, Google Pay, SEPA,
saved cards, etc.), the same checkout flow already used by the web product, no
Apple/Google review surface around payments.

**Cons:** user leaves the app momentarily; we rely on AppState → 'active' to
notice the plan changed (see "Mobile refetch" below). Also, *Apple's
guidelines forbid this approach for IAP-eligible content once the app is in
the App Store* — see "App Store / Play Store" at the bottom.

### B. WebView inside the app ❌ not used

Same Stripe hosted page but wrapped in `react-native-webview`. Faster
feedback (we get a callback when checkout completes), but Apple has been
known to reject apps that use WebView to bypass IAP. Avoiding this risk.

### C. Apple StoreKit / Google Play Billing ⏳ before public store launch

The "right" way for sustainable mobile distribution. Each subscription must be
modelled as a Product in App Store Connect / Play Console with its own SKU,
priced separately per country. Webhook-style events become server-to-server
notifications. This is a separate workstream (~1-2 weeks) and intentionally
deferred — see "App Store / Play Store" at the bottom for what triggers it.

## End-to-end lifecycle

```
[Mobile / Web]                 [API]              [Stripe]           [DB]
      │                          │                   │                 │
   tap "Upgrade"                 │                   │                 │
      ├─► POST /subscriptions/checkout                                  │
      │                          ├─► stripe.checkout.sessions.create   │
      │                          │◄──── session.url ─────              │
      │  ◄── { url } ────────────┤                   │                 │
      │                                                                │
   Linking.openURL(url)                                                 │
      │                                                                │
      └──► (Safari/Chrome)                                              │
              user enters card details                                  │
              ├─► stripe.confirm(...) ──► [Stripe processes payment]    │
              │                                                        │
              │            ┌──── HTTPS POST /subscriptions/webhook ────┤
              │            │     event: checkout.session.completed     │
              │            ▼                                           │
              │   ┌──────────────┐                                     │
              │   │ API webhook  │                                     │
              │   │ verify sig   │                                     │
              │   │ map event    │──► subscriptions.upsertFromProvider │
              │   │ flip plan    │──► users.update(plan='pro')         │
              │   └──────────────┘                                     │
              │                                                        │
   Stripe redirects to returnUrl                                        │
   (or success page)                                                    │
   user hits "Back" / closes Safari                                     │
              │                                                        │
   AppState → 'active' on the app                                       │
      ├─► queryClient.invalidateQueries(['auth','me'])                  │
      ├─► GET /auth/me                                                  │
      │   ◄── { plan: 'pro', … } ───────────────────────────────────────│
      │                                                                │
   UI re-renders Pro state                                              │
```

## Where the data lives

| Concern | Source of truth | Where we cache it | TTL |
| --- | --- | --- | --- |
| Active card / payment method | Stripe | not cached | — |
| Current subscription state (active/cancelled/past_due) | Stripe | `subscriptions` table | until next webhook |
| Plan tier (`'free'`/`'pro'`/`'admin'`) | Derived from subscription state | `users.plan` column | until next webhook |
| Period end | Stripe | `users.plan_expires_at` + `subscriptions.current_period_end` | until next webhook |
| Pro feature gates (AI generate, recipe detail unlock, shopping list) | `users.plan` from `GET /auth/me` | TanStack Query cache, AppState-active refetch | until app foreground |

**The rule.** Stripe knows everything. Our DB caches the bits we need to gate
features fast. Webhooks keep the cache fresh. If you ever see a discrepancy
between Stripe dashboard and our DB, **Stripe wins** — we re-sync via the
webhook, never the other way.

## Webhook events we handle

Mounted at `POST /v1/subscriptions/webhook`, BEFORE the global JSON body
parser (raw body needed for signature verification — see `app.ts`).

| Event | Why | What we do |
| --- | --- | --- |
| `checkout.session.completed` | First payment finalised | Read `client_reference_id` (our userId) + `subscription` id → fetch the subscription → upsert `subscriptions` row → flip `user.plan = 'pro'` |
| `customer.subscription.updated` | Plan tier change, renewal, period extension, status flip (active ↔ past_due ↔ trialing) | Re-upsert `subscriptions`. Re-derive `user.plan` from the latest status (`active` / `trialing` keep Pro, everything else demotes to `'free'`) |
| `customer.subscription.deleted` | Cancellation processed | Same as updated — the status will be `'canceled'` so user.plan drops to `'free'` |

### Events we explicitly **don't** handle yet

- `invoice.payment_failed` — we lean on the subsequent `customer.subscription.updated` (status `past_due` / `unpaid`) to demote. Catching this event directly would give us a 1-day head start on dunning emails — moving it into scope when we add transactional email.
- `customer.subscription.trial_will_end` — we don't offer a trial yet.
- Anything related to refunds (`charge.refunded`, `invoice.payment_action_required`) — manual support workflow for now.

If you add a new event, register it in the Stripe dashboard → Webhooks →
Events list AND in the `switch (event.type)` block in
`services/api/src/routes/subscriptions.ts`. Missed events from the dashboard
side are silently ignored — Stripe just stops sending them.

## Mobile refetch on focus

Without an OS-level callback to "user came back from Safari", we use the next
best signal: `AppState` going from `background` → `active`. The handler lives
in `apps/mobile/app/_layout.tsx`:

```ts
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  }
});
```

So the loop is: payment finishes in browser → user manually returns to the
app (foreground) → app becomes 'active' → TanStack Query refetches /auth/me →
`me.plan === 'pro'` → all the gates (recipe detail paywall, shopping list,
AI generate lock icon) re-evaluate.

Worst case: user closes Safari but doesn't open the Dishday app for a while.
That's fine — Stripe webhook has already flipped `user.plan`. The next time
the user opens the app, refetch happens automatically.

## Test mode and Stripe CLI

All dev / staging environments should use Stripe **test** keys
(`sk_test_…`, `pk_test_…`) and the dedicated "Test data" view in the Stripe
dashboard. Production must use live keys (`sk_live_…`).

### Local webhook forwarding

For local development, Stripe events need to reach `localhost:4000`. The
official way is the Stripe CLI:

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:4000/v1/subscriptions/webhook
```

The CLI prints a webhook signing secret (`whsec_…`) on startup — copy it
into your local `.env` as `STRIPE_WEBHOOK_SECRET` (or restart the CLI to
generate a new one). Without this, signature verification fails and your
local webhook handler returns 400.

### Simulating events

```bash
# Trigger a real test payment flow end-to-end
stripe checkout sessions create \
  --mode subscription \
  --customer-email test@example.com \
  --line-items "price=$STRIPE_PRICE_PRO_MONTHLY,quantity=1" \
  --success-url http://localhost:3000/success \
  --cancel-url http://localhost:3000/cancel
```

Then open the returned URL in a browser. Use Stripe's test cards:

| Card | Behaviour |
| --- | --- |
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0025 0000 3155` | Requires 3D Secure |

For shorter loops you can fire individual webhook events directly:

```bash
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

These don't go through real payment processing — they just synthesize the
event payload and POST it to your forwarder.

## Failure modes and recovery

### Webhook never arrives

Possible causes: API was down at delivery, webhook secret rotated and old
endpoints still receiving, network partition.

**User-facing symptom.** Customer paid in Stripe, our `users.plan` still
shows `'free'`. The mobile app keeps showing the paywall.

**Recovery.**
1. Stripe dashboard → Webhooks → click your endpoint → "Recent events" tab. Failed deliveries show with a red dot. Click → "Resend" — same payload, gets re-verified against the current secret.
2. If many events failed (e.g. API was down for an hour), use Stripe CLI: `stripe events resend evt_xxx` per event, or use the dashboard's bulk-resend UI.
3. As a manual fallback: in Supabase Studio, update `users.plan = 'pro'` and `users.plan_expires_at` to the period end shown in Stripe dashboard. The next legitimate webhook will overwrite both with the canonical value.

### Webhook signature verification fails (400 "Invalid signature")

Cause: `STRIPE_WEBHOOK_SECRET` env var doesn't match what Stripe is signing
with. Most often happens after redeploying when the secret rotated, or when
copying a secret across environments.

**Fix.** Stripe dashboard → Webhooks → your endpoint → "Signing secret" →
click "Reveal". Compare with the env var on the API service. Update if
different. **Do not** disable signature verification "temporarily" — it's
the only thing preventing a malicious actor from POSTing fake events.

### User upgraded but mobile still shows Free

Likely the mobile app hasn't refetched yet — AppState handler covers most
cases, but if the app was killed during checkout the listener never fires
on re-launch. Pull-to-refresh on Profile, or force-close + reopen the app.

Edge case: TanStack Query cache showed stale data and `invalidateQueries`
didn't trigger a refetch because no component was subscribed at the time.
The next mount of Profile / Planner will refetch automatically.

### Race: user opens app before webhook arrives

Stripe webhooks are usually delivered within 1-2 seconds of payment, but a
multi-second delay is possible. If the user races back to the app fast
enough, AppState's `active` transition fires `/auth/me` while the DB still
says `'free'`. They'll see paywall for a moment.

**Mitigation.** None today — accepted as a rare visual blip. If we observe
it in real usage, we can either (a) add a 2-second debounced re-refetch
after AppState-active, or (b) call `/v1/subscriptions/status` (which can
optionally fall back to direct Stripe API lookup) when `/auth/me` returns
`'free'` shortly after a known checkout intent.

### Subscription downgraded but app still shows Pro

Stripe sends `customer.subscription.updated` (status `canceled` or `unpaid`)
when payments fail or user cancels. We process it and demote `users.plan`.
If the mobile app is in the background, it'll pick up the change on next
AppState-active. If it's currently open, TanStack Query's default
`staleTime: 0` should refetch on focus, but the user may briefly see Pro
features until that happens.

## App Store / Play Store launch

External-browser Stripe is fine for:

- ✅ Web (`web.dishday.app`)
- ✅ Internal builds distributed via TestFlight / EAS preview
- ✅ Personal use

It is **not acceptable** for:

- ❌ Public App Store release where the app sells digital subscriptions
- ❌ Public Google Play release of the same

Apple's [App Store Review Guidelines §3.1.1](https://developer.apple.com/app-store/review/guidelines/#payments)
requires in-app purchase for "digital goods and services used within the app".
A weekly AI-generated meal plan qualifies. Google has the equivalent rule.

### Migration path (when we're ready to ship to stores)

1. Create matching SKUs in App Store Connect (auto-renewable subscription) and Google Play Console (subscription product). Pricing must be in the same tier per country.
2. Mobile: integrate `expo-in-app-purchases` or `react-native-iap`. Add a build-time flag (`EXPO_PUBLIC_PAYMENTS_PROVIDER=ios|android|stripe`) — mobile picks the right path; web stays Stripe-only.
3. Backend: add two new webhook-like endpoints to receive Apple App Store Server Notifications V2 and Google Real-Time Developer Notifications. Map them through the same `subscriptions.upsertFromProvider` we already use for Stripe — that's why the table has `provider enum: stripe | apple | google`.
4. Pricing: Apple takes 15–30% commission (vs Stripe's ~2.9% + 30¢). The Pro price in stores might need to be higher than the web $9.99 to net the same — or accept the lower margin from store traffic.
5. Validate receipts server-side. Never trust the client's "purchase succeeded" callback alone — use the App Store / Play Store server-to-server notification as the source of truth, same pattern as Stripe webhooks.

Until step 1–5 are done, distribute the app via TestFlight / EAS internal
distribution only. Don't submit to the public store.

## Files that touch payments

```
services/api/
├── src/
│   ├── routes/subscriptions.ts              # all four endpoints + webhook
│   ├── services/stripe.ts                    # SDK init (requireStripe())
│   ├── middlewares/auth.ts                   # requireAuth for /checkout & /portal
│   └── repositories/prisma/subscription.repository.ts

apps/mobile/
├── src/
│   ├── components/PaywallModal.tsx           # the upgrade UI
│   └── lib/api.ts                            # api.subscriptions.* wired here
├── app/
│   ├── _layout.tsx                           # AppState → invalidate auth.me
│   ├── (tabs)/planner.tsx                    # 402 PLAN_REQUIRED → paywall
│   ├── (tabs)/profile.tsx                    # "Upgrade" / "Manage"
│   └── recipe/[id].tsx                       # locked-state paywall overlay

packages/
└── api-client/src/endpoints.ts               # subscriptions namespace
```
