// ===========================================================================
// netlify/lib/seed.mts — idempotent first-run seeding of the Blobs stores.
//
// ensureSeeded() writes the initial catalog + inventory ONLY IF they are
// absent (create-only, via writeIfNew -> onlyIfNew). Safe to call on every
// cold start / request; concurrent callers race harmlessly because the write
// is atomic and create-only — at most one wins, the rest no-op.
//
// Seeded shapes (versioned for forward migration):
//   catalog   / catalog.json    { version:1, products:[...decorated] }
//   inventory / inventory.json   { version:1, stock:{id:n}, lots:{} }
// ===========================================================================

import { writeIfNew, readJson } from './blobs.mts';

// Authoritative catalog data, owned by WS0 (pure, dependency-free ESM).
// Exports: { BASE_PRODUCTS, CATEGORIES, hasCOA, decorate, SEED_STOCK }.
import { BASE_PRODUCTS, SEED_STOCK, decorate } from '../../lib/catalog-data.mjs';

const CATALOG_KEY = 'catalog.json';
const INVENTORY_KEY = 'inventory.json';
const SCHEMA_VERSION = 1;

export interface SeedResult {
  catalogSeeded: boolean; // true iff THIS call created the catalog
  inventorySeeded: boolean; // true iff THIS call created the inventory
  usingPlaceholder: boolean; // loud flag: still on the fake catalog data
}

export async function ensureSeeded(): Promise<SeedResult> {
  const products = BASE_PRODUCTS.map(decorate);

  const catalogSeeded = await writeIfNew('catalog', CATALOG_KEY, {
    version: SCHEMA_VERSION,
    products,
  });

  const inventorySeeded = await writeIfNew('inventory', INVENTORY_KEY, {
    version: SCHEMA_VERSION,
    stock: { ...SEED_STOCK },
    lots: {},
  });

  return {
    catalogSeeded,
    inventorySeeded,
    // Detect the placeholder by its sentinel product id.
    usingPlaceholder: BASE_PRODUCTS.some((p) => p.id === 'placeholder-a'),
  };
}

// Convenience readers for downstream functions.
export function readCatalog() {
  return readJson<{ version: number; products: unknown[] }>('catalog', CATALOG_KEY);
}

export function readInventory() {
  return readJson<{ version: number; stock: Record<string, number>; lots: Record<string, string> }>(
    'inventory',
    INVENTORY_KEY,
  );
}
