// ===========================================================================
// netlify/functions/products.mts — catalog + inventory API (WS3)
//
// One function serves the whole product surface, same-origin at /api/*:
//
//   GET   /api/products              (PUBLIC)  catalog + live stock, one payload
//   POST  /api/admin/products        (admin)   add a product to the catalog
//   PATCH /api/admin/products/:id    (admin)   edit product fields (lot uniqueness)
//   PATCH /api/admin/inventory       (admin)   set stock for a product
//
// Persistence is Netlify Blobs via the WS1 helpers. Per the BINDING production
// spike verdict (docs/ARCHITECTURE.md), conditional writes are NOT usable, so
// every mutation of a shared blob goes through the single casUpdate() helper,
// which now degrades to read-validate-write (last-write-wins). Lot uniqueness
// and id minting are re-checked inside the RMW updateFn on the freshly-read
// value; the residual same-instant race is accepted at launch volume and the
// admin inventory screen is the reconciliation path.
// ===========================================================================

import { z } from 'zod';
import {
  json,
  methodGuard,
  parseJson,
  withErrors,
  notFound,
  HttpError,
} from '../lib/http.mts';
import { requireAdmin } from '../lib/auth.mts';
import { casUpdate } from '../lib/blobs.mts';
import { ensureSeeded, readCatalog, readInventory } from '../lib/seed.mts';
// Shared catalog helpers (owned by WS0; pure, dependency-free ESM).
import { decorate } from '../../lib/catalog-data.mjs';

const CATALOG_KEY = 'catalog.json';
const INVENTORY_KEY = 'inventory.json';
const SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Shapes stored in Blobs (mirror seed.mts / ARCHITECTURE.md §2).
// ---------------------------------------------------------------------------
interface RawProduct {
  id: string;
  name: string;
  sub?: string;
  cat: string;
  mg: string;
  purity: string | null;
  lot: string | null;
  price: number;
  released: string | null;
  featured?: boolean;
  active?: boolean;
  [k: string]: unknown; // decorate() adds coa/format/cartName/cartMeta
}
interface Catalog {
  version: number;
  products: RawProduct[];
}
interface Inventory {
  version: number;
  stock: Record<string, number>;
  lots: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Validation schemas (zod 4).
// ---------------------------------------------------------------------------
const num = z.coerce.number();

const createSchema = z.object({
  name: z.string().min(1),
  sub: z.string().optional(),
  cat: z.string().min(1),
  mg: z.string().min(1),
  price: num.int().nonnegative(),
  lot: z.string().nullable().optional(),
  purity: z.string().nullable().optional(),
  stock: num.int().nonnegative(),
});

const patchSchema = z
  .object({
    name: z.string().min(1).optional(),
    sub: z.string().optional(),
    cat: z.string().min(1).optional(),
    mg: z.string().min(1).optional(),
    price: num.int().nonnegative().optional(),
    purity: z.string().nullable().optional(),
    lot: z.string().nullable().optional(),
    released: z.string().nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'No fields to update' });

const inventorySchema = z.object({
  id: z.string().min(1),
  stock: num.int().nonnegative(),
});

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
// Lot comparison ignores case + separators, matching app/verify/page.jsx.
const normLot = (s: unknown): string =>
  String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// kebab slug for id minting from "name + mg".
const slug = (s: string): string =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const todayHuman = (): string => {
  const d = new Date();
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const lotExists = (msg: string) => new HttpError(409, 'lot_exists', msg);

// ---------------------------------------------------------------------------
// GET /api/products  (PUBLIC) — seed on first read, return catalog + stock.
// ---------------------------------------------------------------------------
async function getProducts(): Promise<Response> {
  await ensureSeeded();
  const catalog = (await readCatalog()) as Catalog | null;
  const inventory = (await readInventory()) as Inventory | null;
  return json({
    products: catalog?.products ?? [],
    stock: inventory?.stock ?? {},
  });
}

// ---------------------------------------------------------------------------
// POST /api/admin/products (admin) — create a product.
// COA-bearing when a lot is supplied (purity defaults to 99.0%, released=today);
// COA-less otherwise (purity/lot/released all null).
// ---------------------------------------------------------------------------
async function createProduct(req: Request): Promise<Response> {
  await requireAdmin(req);
  await ensureSeeded();

  const input = await parseJson(req, createSchema);

  const name = input.name.trim();
  const rawLot = input.lot != null ? String(input.lot).trim() : '';
  const coaBearing = rawLot.length > 0;
  const lot = coaBearing ? rawLot : null;
  const purity = coaBearing ? (String(input.purity ?? '').trim() || '99.0%') : null;
  const released = coaBearing ? todayHuman() : null;

  const base: RawProduct = {
    id: '', // minted inside the RMW to stay unique
    name,
    sub: input.sub != null ? String(input.sub).trim() : '',
    cat: input.cat.trim(),
    mg: input.mg.trim(),
    purity,
    lot,
    price: input.price,
    released,
  };
  const wantId = slug(`${name}-${base.mg}`) || slug(name) || `product-${Date.now()}`;

  // Pre-read lot uniqueness (fast 409 before the RMW). The authoritative check
  // is repeated inside the updateFn on the fresh read.
  if (lot) {
    const pre = (await readCatalog()) as Catalog | null;
    if (pre?.products?.some((p) => normLot(p.lot) === normLot(lot))) {
      throw lotExists(`Lot ${lot} already exists`);
    }
  }

  let created: RawProduct | null = null;
  await casUpdate<Catalog>('catalog', CATALOG_KEY, (cur) => {
    const cat: Catalog = cur ?? { version: SCHEMA_VERSION, products: [] };
    const products = cat.products ?? [];

    if (lot && products.some((p) => normLot(p.lot) === normLot(lot))) {
      throw lotExists(`Lot ${lot} already exists`);
    }

    // Mint a unique id from the fresh product set.
    const ids = new Set(products.map((p) => p.id));
    let id = wantId;
    let n = 2;
    while (ids.has(id)) id = `${wantId}-${n++}`;

    created = decorate({ ...base, id }) as RawProduct;
    return { ...cat, version: cat.version ?? SCHEMA_VERSION, products: [...products, created] };
  });

  const newId = created!.id;

  // Seed stock for the new product (separate shared blob → its own RMW).
  await casUpdate<Inventory>('inventory', INVENTORY_KEY, (cur) => {
    const inv: Inventory = cur ?? { version: SCHEMA_VERSION, stock: {}, lots: {} };
    return { ...inv, stock: { ...(inv.stock ?? {}), [newId]: input.stock } };
  });

  return json({ product: created }, 201);
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/products/:id (admin) — edit product fields.
// ---------------------------------------------------------------------------
async function patchProduct(req: Request, id: string): Promise<Response> {
  await requireAdmin(req);
  await ensureSeeded();

  const input = await parseJson(req, patchSchema);

  // Normalize the incoming patch (trim strings; leave nulls intact).
  const patch: Partial<RawProduct> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.sub !== undefined) patch.sub = input.sub.trim();
  if (input.cat !== undefined) patch.cat = input.cat.trim();
  if (input.mg !== undefined) patch.mg = input.mg.trim();
  if (input.price !== undefined) patch.price = input.price;
  if (input.purity !== undefined) patch.purity = input.purity == null ? null : String(input.purity).trim();
  if (input.lot !== undefined) patch.lot = input.lot == null ? null : String(input.lot).trim();
  if (input.released !== undefined) patch.released = input.released == null ? null : String(input.released).trim();
  if (input.active !== undefined) patch.active = input.active;

  // Pre-read: 404 if absent, fast 409 on lot collision.
  const pre = (await readCatalog()) as Catalog | null;
  const preProducts = pre?.products ?? [];
  if (!preProducts.some((p) => p.id === id)) throw notFound('Product not found');
  if (patch.lot) {
    const clash = preProducts.some((p) => p.id !== id && normLot(p.lot) === normLot(patch.lot));
    if (clash) throw lotExists(`Lot ${patch.lot} already exists`);
  }

  let updated: RawProduct | null = null;
  await casUpdate<Catalog>('catalog', CATALOG_KEY, (cur) => {
    const cat: Catalog = cur ?? { version: SCHEMA_VERSION, products: [] };
    const products = cat.products ?? [];
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) throw notFound('Product not found');

    if (patch.lot && products.some((p) => p.id !== id && normLot(p.lot) === normLot(patch.lot))) {
      throw lotExists(`Lot ${patch.lot} already exists`);
    }

    updated = decorate({ ...products[idx], ...patch }) as RawProduct;
    const next = products.slice();
    next[idx] = updated;
    return { ...cat, products: next };
  });

  return json({ product: updated });
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/inventory (admin) — set stock for a product.
// ---------------------------------------------------------------------------
async function patchInventory(req: Request): Promise<Response> {
  await requireAdmin(req);
  await ensureSeeded();

  const input = await parseJson(req, inventorySchema);

  await casUpdate<Inventory>('inventory', INVENTORY_KEY, (cur) => {
    const inv: Inventory = cur ?? { version: SCHEMA_VERSION, stock: {}, lots: {} };
    return { ...inv, stock: { ...(inv.stock ?? {}), [input.id]: input.stock } };
  });

  return json({ stock: input.stock });
}

// ---------------------------------------------------------------------------
// Router — one function, four routes. Match on method + pathname.
// ---------------------------------------------------------------------------
export default withErrors(async (req: Request) => {
  const { pathname } = new URL(req.url);
  // Normalize static-export path artifacts. With next.config `trailingSlash:true`
  // + `output:'export'`, the dev proxy (and any generated redirect) can rewrite
  // /api/x -> /api/x/ -> /api/x/index.html and probe .html/.htm variants. Those
  // must resolve to the same route, otherwise e.g. /api/admin/products/index.html
  // would match the :id item route. Product ids are dotless kebab slugs, so
  // stripping these suffixes is unambiguous.
  const path = pathname
    .replace(/\/index\.html?$/i, '')
    .replace(/\.html?$/i, '')
    .replace(/\/+$/, ''); // tolerate a trailing slash

  if (path === '/api/products') {
    methodGuard(req, ['GET']);
    return getProducts();
  }

  if (path === '/api/admin/products') {
    methodGuard(req, ['POST']);
    return createProduct(req);
  }

  const productMatch = path.match(/^\/api\/admin\/products\/([^/]+)$/);
  if (productMatch) {
    methodGuard(req, ['PATCH']);
    return patchProduct(req, decodeURIComponent(productMatch[1]));
  }

  if (path === '/api/admin/inventory') {
    methodGuard(req, ['PATCH']);
    return patchInventory(req);
  }

  throw notFound('Unknown products route');
});

export const config = {
  path: [
    '/api/products',
    '/api/admin/products',
    '/api/admin/products/:id',
    '/api/admin/inventory',
  ],
};
