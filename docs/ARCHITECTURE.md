# Natural Glow — Backend Architecture (WS1 foundation)

Netlify-native backend for the Natural Glow storefront + dashboard.

- **Frontend:** Next.js 15, `output: 'export'` — a fully static site published from `out/`.
  No SSR runtime. The interactive app is client-side (see `lib/store.js`).
- **Backend:** Netlify **Functions v2** (`.mts`) under `netlify/functions`, served
  **same-origin** at `/api/*`. State lives in **Netlify Blobs**.
- **Auth:** JWT in an HttpOnly cookie. Admin bootstrapped by `ADMIN_EMAILS`.

This document is the design record for later workstreams. **WS1 implements only
`GET /api/health`** (liveness + the Blobs conditional-write spike) plus the shared
libraries in `netlify/lib/`. Every other endpoint below is a **designed contract**,
not yet built.

---

## 1. Deploy model

| Setting        | Value                        | Where                     |
| -------------- | ---------------------------- | ------------------------- |
| Build command  | `npm run build` (`next build`) | root `netlify.toml`     |
| Publish dir    | `out/`                       | root `netlify.toml`       |
| Functions dir  | `netlify/functions`          | root `netlify.toml`       |
| Function bundler | `esbuild`                  | root `netlify.toml`       |
| Node version   | `22`                         | `[build.environment]`     |

**We do NOT declare `@netlify/plugin-nextjs`.** Netlify's framework detection still
*auto-injects* the Next.js Runtime (v5) — this is unavoidable via `netlify.toml`. It is
**inert for `output:'export'`**: a full local `netlify build` produced **zero** SSR /
edge functions (`.netlify/functions-internal` empty), left `out/` as the publish dir, and
bundled our own `health.mts`. So the static-export model holds and the SSR runtime is
never active. In the resolved-config cache the plugin appears with `origin = "default"`
(auto), not `"config"` (ours).

> **Landmine removed:** the old `.netlify/netlify.toml` published
> `/Users/c/Glow/natural-glow-1/.next` via the plugin (SSR model, wrong project). It was
> deleted; `.netlify/state.json` (the site link, id `a7699410-…`) was kept. That file is
> a build-time resolved-config cache — `netlify dev`/`netlify build` regenerate it, but it
> now derives from the root `netlify.toml` (publishes `out/`) and is gitignored, so its
> regeneration is harmless.

---

## 2. Data model — Netlify Blobs

All stores are opened with **`consistency: 'strong'`** (`netlify/lib/blobs.mts`), so a read
always reflects the latest write. JSON records are versioned (`version: 1`) for forward
migration.

### `catalog` store
| Key            | Shape |
| -------------- | ----- |
| `catalog.json` | `{ version, products: [ { id, name, sub, cat, mg, purity, cas, lot, price, blurb, featured, released, coa } ] }` |

Seeded from `lib/catalog-data.mjs` → `BASE_PRODUCTS.map(decorate)`.
Product fields mirror `lib/store.js` `PRODUCTS`; `decorate()` adds `released` (COA date) and
`coa` (boolean).

### `inventory` store
| Key              | Shape |
| ---------------- | ----- |
| `inventory.json` | `{ version, stock: { [productId]: number }, lots: { [productId]: lotCode } }` |

Seeded from `SEED_STOCK`. `stock` is the single source of truth for availability;
mutated only via `casUpdate` on order place / cancel / admin edit.

### `users` store
| Key               | Shape |
| ----------------- | ----- |
| `user/{email}`    | `{ id, email, passwordHash, name, org, address1, city, state, zip, country, role, createdAt }` |
| `uid/{userId}`    | `{ email }` — reverse index (id → email) |

- `email` is lowercased; it is the login identifier and primary key.
- `id` is a UUID used as the JWT `sub` and to namespace orders/proofs (survives email change).
- `passwordHash` is a scrypt string (`scrypt$N$r$p$saltB64$hashB64`).
- `role` is `'user' | 'admin'`; effective admin is `role==='admin' || email ∈ ADMIN_EMAILS`.

### `orders` store
| Key                          | Shape |
| ---------------------------- | ----- |
| `order/{userId}/{orderId}`   | `{ id, userId, customer, address, items:[{id,qty}], placed, status, total, proofKey?, cancelReason?, cancelMsg?, createdAt }` |
| `seq/order`                  | `number` — monotonic order counter (starts `24818`; id format `NG-{seq}`) |

- `status`: `'Processing' | 'Shipped' | 'Cancelled'`.
- `total` is **server-computed** (`Σ price×qty` from `catalog`), never client-supplied.
- A user's orders enumerate by **prefix `order/{userId}/`**; all orders (admin) by
  prefix `order/`. No separate index blob is required (Blobs `list({ prefix })`), keeping
  writes contention-free at distinct keys.

### `proofs` store
| Key                        | Content |
| -------------------------- | ------- |
| `proof/{userId}/{orderId}` | Raw payment-proof file (PDF/PNG/JPG), stored as bytes with metadata `{ contentType, filename, size }` |

- **5 MB hard cap** per proof, enforced server-side before write (reject `413` otherwise).
- Write-once at a distinct key → no concurrency concerns.
- Download gated to the owning user or an admin.

---

## 3. API surface (designed contract)

Same-origin, JSON, error envelope `{ error: { code, message, details? } }`
(`netlify/lib/http.mts`). **Only `/api/health` is implemented in WS1.**

| Method | Path                          | Auth        | Purpose |
| ------ | ----------------------------- | ----------- | ------- |
| GET    | `/api/health`                 | public      | Liveness + Blobs spike. **(WS1, shipped)** |
| POST   | `/api/auth/signup`            | public      | Create account, set session cookie |
| POST   | `/api/auth/signin`            | public      | Verify password, set session cookie |
| POST   | `/api/auth/signout`           | user        | Clear session cookie |
| GET    | `/api/auth/me`                | user        | Current session claims + account |
| GET    | `/api/account`                | user        | Read profile |
| PATCH  | `/api/account`                | user        | Update profile fields |
| GET    | `/api/products`               | public      | Catalog + live stock |
| GET    | `/api/products/{id}`          | public      | Single product |
| GET    | `/api/orders`                 | user        | List own orders (`order/{userId}/`) |
| POST   | `/api/orders`                 | user        | Place order (server total + stock decrement) |
| GET    | `/api/orders/{id}`            | user (owner)| Single order |
| POST   | `/api/orders/{id}/cancel`     | user (owner)| Cancel + restock |
| POST   | `/api/orders/{id}/proof`      | user (owner)| Upload payment proof (≤5 MB) |
| GET    | `/api/orders/{id}/proof`      | owner/admin | Download proof |
| GET    | `/api/admin/orders`           | admin       | All orders (`order/`) |
| POST   | `/api/admin/orders/{id}/ship` | admin       | Mark shipped |
| POST   | `/api/admin/orders/{id}/cancel` | admin     | Cancel + restock |
| PATCH  | `/api/admin/inventory`        | admin       | Set stock / lots |
| POST   | `/api/admin/products`         | admin       | Add product to catalog |

---

## 4. Security posture

- **Same-origin, no CORS.** Functions serve at `/api/*` on the site's own origin; no
  `Access-Control-*` headers, no cross-origin access. Cookies are first-party.
- **Session:** JWT (jose, **HS256**), claims `{ sub, role, email }`, **7-day** TTL, secret
  `AUTH_JWT_SECRET`. Carried in cookie **`ng_session`** — `HttpOnly; Secure; SameSite=Lax;
  Path=/` — so JS can't read it and it isn't sent cross-site.
- **Passwords:** scrypt (`node:crypto`), `N=16384, r=8, p=1`, per-hash random salt, format
  `scrypt$N$r$p$saltB64$hashB64`, constant-time (`timingSafeEqual`) verify.
- **Server-owned math:** order totals and stock deltas are computed on the server from the
  `catalog`/`inventory` blobs. The client supplies only `{ productId, qty }`; it can never
  set price, total, or stock.
- **`ADMIN_EMAILS` bootstrap:** comma-separated, case-insensitive allowlist. Any signed-in
  user whose email is on it is treated as admin (`requireAdmin`), independent of stored
  role — grants admin with no data migration. Seeded with the site owner
  (`support@caredigitalcareers.com`); the client is added later.
- **Validation:** every mutating endpoint validates its body with **zod**; failures return
  `400 validation_failed` with flattened field errors.
- **Proof cap:** payment proofs are capped at **5 MB**; larger uploads are rejected `413`.

---

## 5. Concurrency — single-writer discipline

Every mutation of a **shared** blob (`inventory.json`, `seq/order`, an order's status) MUST
go through **`casUpdate(store, key, updateFn, { retries: 5 })`** — never a bare
read-then-write. `casUpdate`:

1. `getWithMetadata` → `{ data, etag }`
2. `next = updateFn(data)`
3. write with **`{ onlyIfMatch: etag }`** (existing key) or **`{ onlyIfNew: true }`**
   (absent key); on a no-op (`modified:false`) → jittered backoff and retry from a fresh
   read.

Write-once records at distinct keys (order records, proofs) need no CAS.

### Spike findings (empirical — `GET /api/health`, @netlify/blobs 10.7.9)

The real conditional-write API and what actually honors it:

| Capability | API | Production Blobs | Local `netlify dev` sandbox |
| ---------- | --- | ---------------- | --------------------------- |
| Create-only | `setJSON(k, v, { onlyIfNew: true })` | ✅ atomic | ❌ ignored (last-write-wins) |
| Compare-and-swap | `setJSON(k, v, { onlyIfMatch: etag })` | ✅ atomic | ❌ ignored |
| Read ETag | `getWithMetadata(k).etag` | ✅ returns etag | ❌ returns **no** etag |
| Strong read-after-write | `getStore({ consistency:'strong' })` | ✅ | ✅ holds |

- Both conditions return **`{ etag?, modified }`**; a failed precondition maps HTTP **412 →
  `{ modified: false }`** (it does **not** throw). `onlyIfNew`/`onlyIfMatch` are mutually
  exclusive.
- **The local sandbox does not implement conditional writes or ETags** — it is
  last-write-wins. Strong-consistency read-after-write *does* hold locally.

### Fallback / graceful degradation

Because the local sandbox returns no etag, the helpers in `netlify/lib/blobs.mts` are
written to **use real CAS in production and degrade to last-write-wins locally**, never to
throw or spin:

- `casUpdate`: etag present → `onlyIfMatch` CAS; key absent → `onlyIfNew` create; **key
  present but no etag** (sandbox) → single unconditional write and return.
- `writeIfNew`: pre-reads and short-circuits if the key exists (idempotent even on the
  sandbox), while `onlyIfNew` still guards the concurrent-create race in production.

Net effect: full single-writer safety in the cloud; correct, non-throwing behavior in local
single-user dev.

---

## 6. Seeding & environment

- **`ensureSeeded()`** (`netlify/lib/seed.mts`) writes `catalog.json` and `inventory.json`
  only if absent (`writeIfNew`). Safe to call on every request/cold start; idempotent.
  Imports the authoritative catalog from **`lib/catalog-data.mjs`** (owned by WS0; pure
  dependency-free ESM exporting `{ BASE_PRODUCTS, CATEGORIES, hasCOA, decorate, SEED_STOCK }`)
  and seeds `catalog.json = { version, products: BASE_PRODUCTS.map(decorate) }` +
  `inventory.json = { version, stock: SEED_STOCK, lots: {} }`. (The temporary
  `catalog-data-placeholder.mjs` used before WS0 shipped has been removed.)
- **`scripts/seed.mjs`** — standalone reseed / `--force` / `--reset` / `--dump` tool
  (needs `NETLIFY_AUTH_TOKEN` + site id).
- **Env vars** (see `.env.example`):
  - `AUTH_JWT_SECRET` — HS256 signing secret (32-byte random; set as a Netlify **secret**).
  - `ADMIN_EMAILS` — admin allowlist (`support@caredigitalcareers.com`).
