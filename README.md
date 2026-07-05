# Natural Glow — Direction 1

Client demo: research-peptide storefront + laboratory portal, in the original
"Direction 1" design (Spectral serif · Space Mono · cream/ink/gold), rebuilt as
a Next.js 15 App Router app. Fully static export — no backend; all state is
simulated in `localStorage`.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
```

Build for production with `npm run build` (static export to `out/`).

## Deploy

```bash
npm run build && netlify deploy --prod --dir out
```

The folder is linked to the `natural-glow-1` Netlify site.

## Routes

- `/` — marketing home (hero, featured compounds) behind the RUO age gate
- `/catalog` — full catalog with category filters
- `/product?id=<id>` — product detail + spec table
- `/verify?lot=<lot>` — Certificate of Analysis lookup (printable)
- `/science`, `/contact` — methods + contact form (simulated)
- `/signin` — sign in / sign up (simulated; captures Name + Email)
- `/dashboard` — the portal: Customer (catalog, cart + 3-step bank-transfer
  checkout with proof of payment, my orders, order detail, account) and Admin
  (orders with one-click Mark shipped / cancel-with-reason, inventory with
  exact-stock + lot editing, new peptide)

## Order lifecycle

`Processing` (immediately on submit) → `Shipped` (one admin click), or
`Cancelled` with a reason + optional message shown to the customer
(cancel restocks inventory).

## Structure

- `lib/store.js` — single data layer: products, COA release dates, RUO gate,
  simulated account, cart, inventory, orders (localStorage + CustomEvents,
  SSR-safe hooks)
- `components/Gate.jsx` — the RUO age gate (persists via `ng_ruo_gate`)
- `components/portal/` — the dashboard (sidebar, views, modals, checkout)
- `reference/` — the original single-file design source this port was built
  from (not deployed)

## Sibling

"Direction 2" (Editorial / Deep Sage) lives in `natural-glow-next 2` /
[natural-glow-2](https://github.com/c-dd/natural-glow-2) — same features,
different design direction.
