# ChromaMimic — Monetization Setup (Clerk + Stripe + Vercel)

The app ships **working today** with a built-in **mock** entitlements layer (no backend): the full
guest → free → pro flow runs against `localStorage`. To go live, add the keys below and the same code
switches to **Clerk (auth) + Stripe (billing) + Vercel (serverless API)** automatically.

## How it works

- **Privacy preserved.** Grading and LUT generation stay 100% in the browser. The server only stores
  account + billing metadata. "Nothing uploaded" remains true.
- **Tiers**
  - **Guest** — full preview + grading; cannot download (prompted to sign in).
  - **Free** (account) — 3 downloads per calendar month; 17³/33³; sliders grade.
  - **Pro** ($5/mo or $39/yr, 7-day trial) — unlimited downloads, all formats, Wheel mode, 65³.
- **Source of truth:** the Stripe webhook writes `tier` to the Clerk user's `publicMetadata`. The
  client never sets tier. The monthly download counter is enforced server-side in
  `api/consume-download.ts`.

## Files

- Frontend: `src/lib/entitlements/*` (mock + Clerk providers, same interface), `src/components/paywall/*`,
  `src/components/Pricing.tsx`, `src/components/AccountMenu.tsx`. Gating lives in `src/components/tool/Tool.tsx`.
- Backend (Vercel): `api/consume-download.ts`, `api/create-checkout.ts`, `api/create-portal.ts`, `api/stripe-webhook.ts`, `api/_lib.ts`.
- Config: `vercel.json`, `.env.example`.

## Setup steps

### 1. Clerk (auth)
1. Create an app at clerk.com. Enable Email + Google.
2. Copy the **Publishable key** → `VITE_CLERK_PUBLISHABLE_KEY`, and the **Secret key** → `CLERK_SECRET_KEY`.

### 2. Stripe (billing)
1. Create a **Product** "ChromaMimic Pro" with two recurring **Prices**: $5/month and $39/year.
   Copy their IDs → `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`.
2. Copy the **Secret key** → `STRIPE_SECRET_KEY`.
3. In **Billing → Customer portal**, enable it (lets users cancel/update card themselves).
4. The 7-day trial is set in code (`subscription_data.trial_period_days: 7`).

### 3. Stripe webhook
1. Deploy to Vercel first (so you have a URL).
2. Stripe → **Developers → Webhooks → Add endpoint**: `https://YOUR_DOMAIN/api/stripe-webhook`.
3. Subscribe to: `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
4. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`.

### 4. Vercel
1. Import the repo. Framework: **Vite**. It auto-detects `api/` as serverless functions.
2. Add every variable from `.env.example` under **Settings → Environment Variables**.
   `VITE_*` is exposed to the browser; the rest are server-only secrets.
3. Set `APP_URL` to your production domain. Redeploy.

### 5. Verify
- Locally without keys → mock mode (test the whole flow instantly).
- With keys → sign in (Clerk), download 3× (counter), 4th → paywall, upgrade (Stripe test card
  `4242 4242 4242 4242`), webhook flips you to Pro, downloads unlimited, "Manage billing" opens the
  Stripe portal.

## Hardening notes / future
- The monthly counter in Clerk metadata is "good enough" for a $5 tool. For hard atomicity under heavy
  concurrency, move the counter to Postgres (Neon/Vercel Postgres) with a row-locked `UPDATE`.
- Because grading is client-side, the gate is friction, not DRM — the durable value (Wheel mode, 65³,
  and the planned cloud LUT library + batch) is what Pro is really for.
- Add `current_period_end` handling if you want canceled users to keep Pro until the period ends
  (Stripe sends `customer.subscription.updated` with `cancel_at_period_end`).
