# Natural Glow — Direction 1

Research-peptide storefront + laboratory portal in the "Direction 1" design
(Spectral serif · Space Mono · pink/sage/ink). Built as a Next.js 15 App Router
app that ships as a **static export** (`output: 'export'` → `out/`) with a
**real backend** provided by Netlify Functions and Netlify Blobs.

The store is real: accounts, sessions, orders, payment proofs, inventory, and
the admin dashboard are all server-side. Orders and payment proofs are stored
and processed for real.

## Architecture

- **Frontend** — Next.js 15, static export. All interactivity is client-side
  (`lib/store.js` is a thin client over the API). No SSR runtime.
- **Backend** — Netlify **Functions v2** (`.mts`) under `netlify/functions`,
  served same-origin at `/api/*`. State lives in **Netlify Blobs**.
- **Auth** — JWT in an HttpOnly cookie (`ng_session`). Admin is granted by the
  `ADMIN_EMAILS` allowlist.

Full design record: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Local development

Use `netlify dev` (not `next dev`) so the Functions + Blobs sandbox runs
alongside the static pages and `/api/*` resolves:

```bash
npm install
cp .env.example .env      # then fill in the values (see below)
netlify dev              # http://localhost:8888
```

Build the static site on its own with `npm run build` (emits `out/`).

## Deploy

```bash
npm run build && netlify deploy --prod --dir out
```

`netlify.toml` publishes `out/` and bundles the Functions with esbuild. Do
**not** add `@netlify/plugin-nextjs` — it is for the SSR runtime and would break
the static-export model (see `docs/ARCHITECTURE.md` §1).

## Environment variables

Copy `.env.example` → `.env` for local dev, and set the same in the Netlify UI /
CLI for deploys:

- `AUTH_JWT_SECRET` — **required, secret.** HS256 signing key for the session
  JWT. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
- `ADMIN_EMAILS` — **required.** Comma-separated, case-insensitive allowlist.
  Any signed-in user whose email is on it is treated as admin.

`NETLIFY_AUTH_TOKEN` / `NETLIFY_SITE_ID` are only needed by the standalone
`scripts/seed.mjs` tool when run outside `netlify dev`.

## Admin bootstrap

There is no admin sign-up. Put an address in `ADMIN_EMAILS`, then sign up /
sign in with that email — the session is treated as admin with no data
migration. The catalog + inventory self-seed on first request
(`ensureSeeded()`); use `scripts/seed.mjs` to reseed / `--reset` / `--dump`.

## Client placeholders (must be replaced before launch)

These are clearly-marked stand-ins the client swaps once:

- `lib/bankDetails.js` — bank-transfer details shown at checkout.
- `lib/siteContact.js` — public contact email.
- Product catalog + prices — `lib/catalog-data.mjs` (`BASE_PRODUCTS`, `SEED_STOCK`).
- Legal summaries — the Terms/Privacy modal in `components/Footer.jsx` is
  placeholder copy pending the operator's legal review.

## Routes

- `/` — marketing home (hero, featured compounds) behind the RUO age gate
- `/catalog` — full catalog with category filters
- `/product?id=<id>` — product detail + spec table
- `/verify?lot=<lot>` — Certificate of Analysis lookup (printable)
- `/science` — methods; `/contact` — direct-email contact
- `/signin` — sign in / sign up (real accounts)
- `/dashboard` — the portal:
  - **Customer** — catalog, cart + 3-step bank-transfer checkout with proof-of-
    payment upload, my orders, order detail, account
  - **Admin** — all orders (mark shipped / cancel-with-reason), inventory
    (exact-stock + lot editing), add product

## Order lifecycle

`Processing` (on submit) → `Shipped` (admin) — or `Cancelled` with a reason +
optional customer message (cancel restocks inventory). Totals and stock deltas
are computed server-side from the catalog/inventory blobs.

## Structure

- `lib/store.js` — client data layer: shared `apiFetch`, session/account,
  products/stock, cart, orders, RUO gate
- `lib/catalog-data.mjs` — authoritative catalog seed (shared with the backend)
- `netlify/functions/` + `netlify/lib/` — the API and shared server libraries
- `components/Gate.jsx` — the RUO age gate (persists via `ng_ruo_gate`)
- `components/portal/` — the dashboard (sidebar, views, modals, checkout)
- `reference/` — the original single-file design source this port was built
  from (not deployed)
