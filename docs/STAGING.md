# Staging environment

Staging uses a **separate Firebase project** (`stitches-africa-dev`). You do not need production database access for day-to-day work — use the seed script. Use the clone script when you need one real prod user copied in for testing.

---

## Quick start

```powershell
copy .env.staging.example .env.staging   # fill Firebase + test payment keys
npm run staging:deploy-firebase
npm run staging:seed
npm run dev:staging
```

Open http://localhost:3000. Default seed password: `StagingTest123!`

### `npm run dev` vs `npm run dev:staging`

| Command | Env file | `APP_ENV` | Use when |
|---------|----------|-----------|----------|
| `npm run dev` | `.env.local` (Next.js default) | `local` | Your normal local setup — prod or staging Firebase, no staging guards |
| `npm run dev:staging` | `.env.staging` | usually `local` | Team staging Firebase (`stitches-africa-dev`) + seed/clone workflow |

Staging safety guards (prod Firebase block, live payment keys) apply only when `APP_ENV=staging` (e.g. Vercel staging deploy), not during local `npm run dev`.

Example logins: `vendor-a@staging.stitchesafrica.test` → `/vendor`, `customer@staging.stitchesafrica.test` → `/shops/auth`

---

## Env files

| File | Purpose |
|------|---------|
| `.env.staging.example` | Template (committed) |
| `.env.staging` | Your secrets (gitignored) |
| `.env.local` | Optional override for local dev |

### Key variables

**App**

| Variable | Local staging value |
|----------|---------------------|
| `APP_ENV` | `staging` (set `NEXT_PUBLIC_APP_ENV=staging` too — powers the header badge) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `DISABLE_REAL_PAYOUTS` | `true` |

**Staging Firebase** (read + write — used by app and scripts)

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_FIREBASE_*` | Web client config from Firebase Console |
| `FIREBASE_PROJECT_ID` | `stitches-africa-dev` |
| `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` | Admin SDK key (base64) |

**Prod read-only** (clone script only)

| Variable | Notes |
|----------|-------|
| `PROD_FIREBASE_PROJECT_ID` | `stitches-africa` |
| `PROD_FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` | Read-only prod service account |

**Scripts**

| Variable | Default |
|----------|---------|
| `STAGING_SEED_PASSWORD` | `StagingTest123!` |
| `STAGING_CLONE_PASSWORD` | Same as seed password |

**Payment keys** — use test/sandbox keys only (`pk_test_`, `sk_test_`, etc.).

---

## NPM scripts

| Command | What it does |
|---------|--------------|
| `npm run dev:staging` | Next.js dev server against staging Firebase |
| `npm run staging:seed` | Create/update seed users, products, orders (idempotent) |
| `npm run staging:clone-user` | Copy one prod user into staging (on demand) |
| `npm run staging:deploy-firebase` | Deploy rules, indexes, storage, functions to staging |
| `npm run staging:sanitize` | Strip sensitive fields after a prod import (optional) |

---

## Seed script (`staging:seed`)

Creates a full test dataset without touching production:

- Auth users for vendor, customer, marketing, admin, backoffice, atlas roles
- 3 vendors, 18 products (`tailor_works`), collections, promo events
- Sample orders, wallets, transactions, VVIP orders, addresses, cart items

Re-run anytime — it updates existing seed docs rather than duplicating them.

---

## Clone script (`staging:clone-user`)

Copies **one prod user** into staging when you have read-only prod credentials.

### What it copies

| Role | Data |
|------|------|
| **Vendor** | `tailors`, `tailors_local`, `users`, `tailor_works` (+ sizes), `tailors/{uid}/orders`, `tailors/{uid}/transactions` |
| **Vendor orders (dashboard)** | `users_orders/{customerUid}/user_orders` lines where `tailor_id` = vendor — this powers order list, products sold, and total orders |
| **Vendor VVIP** | Top-level `orders` docs with items for that vendor |
| **Customer** | `users`, addresses, `users_orders`, `all_orders` mirrors, measurements, referral |
| **Both** | All of the above |

### What it changes

- **UID preserved** — same as prod so data paths stay aligned
- **Auth email** → `clone+{uid-prefix}@staging.stitchesafrica.test` (never the real prod email)
- **Bank / payout fields stripped** — Stripe, Paystack, Flutterwave, bank details removed
- **Wallet balances and transactions kept**

### Usage

```powershell
# PowerShell — use --confirm (env VAR=value does not work in PowerShell)
npm run staging:clone-user -- --confirm --uid=PROD_FIREBASE_UID

# By prod email
npm run staging:clone-user -- --confirm --email=vendor@example.com

# Vendor only, no Auth user
npm run staging:clone-user -- --confirm --uid=... --role=vendor --no-auth
```

| Flag | Default | Meaning |
|------|---------|---------|
| `--confirm` | required | Safety gate — script refuses to run without it |
| `--role` | `auto` | `vendor`, `customer`, or `both` |
| `--include` | `orders,wallet,addresses,all-orders,vvip` | Subsets to copy |
| `--no-auth` | off | Skip staging Auth user creation |

**Login after clone:** `clone+{uid-prefix}@staging.stitchesafrica.test` + `STAGING_CLONE_PASSWORD`

---

## Shop landing page (Trending tab)

On production, Trending shows products from six named vendors only. On staging (non-prod Firebase project), if none of those vendors exist, the tab **falls back to the full catalog** so seeded/cloned products still appear.

---

## Safety

- `APP_ENV=staging` (deployed staging) blocks prod Firebase and live payment keys
- `APP_ENV=local` + `npm run dev` + `.env.local` — no guards; use whatever Firebase/keys you need
- Clone script only **reads** prod and **writes** staging
- Seed/sanitize scripts always refuse to run against the prod project
- Use test payment keys in `.env.staging`

---

## Firebase projects

| Alias | Project ID | Use |
|-------|------------|-----|
| `prod` | `stitches-africa` | Production |
| `staging` | `stitches-africa-dev` | Local dev + future Vercel staging |

For more detail (seed accounts table, Vercel deploy, optional prod import), see [STAGING_SETUP.md](./STAGING_SETUP.md).
