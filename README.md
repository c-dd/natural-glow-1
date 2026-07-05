# Natural Glow — Next.js

Deploy-ready Next.js 14 (App Router) wrapper around the Natural Glow storefront +
customer/admin dashboard. The full experience ships as one self-contained,
offline-capable document at `public/natural-glow.html` (fonts, images, and the
UI runtime are all inlined) and is mounted full-viewport by `app/page.js`.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build & start (production)

```bash
npm run build
npm run start
```

## Deploy

**Vercel (recommended)**
```bash
npm i -g vercel
vercel            # first run links/creates the project
vercel --prod     # ship to production
```
Or push this folder to a Git repo and "Import Project" at vercel.com — it
auto-detects Next.js, no settings needed.

**Netlify / Node host** — `npm run build` then `npm run start`, or use the
official `@netlify/plugin-nextjs`.

## Project structure

```
natural-glow-next/
├─ app/
│  ├─ layout.js      # <html>/<body> shell + metadata
│  └─ page.js        # mounts the storefront full-viewport
├─ public/
│  └─ natural-glow.html   # the entire site, self-contained (~2 MB)
├─ next.config.mjs
├─ jsconfig.json
└─ package.json
```

## Editing the site

The site markup/logic lives in the source design file
(`Natural Glow - Site v2.dc.html`), not in this folder. To update the deployed
app, re-export the standalone build and replace `public/natural-glow.html`.

For a full component-level port — real App Router routes (`/catalog`,
`/dashboard`, `/orders/[id]`), server components, and an API layer for orders
and inventory — start from the Claude Code handoff package instead of this
wrapper.
