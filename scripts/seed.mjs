#!/usr/bin/env node
// ===========================================================================
// scripts/seed.mjs — standalone Blobs reseed / reset / dump tool.
//
// Runs OUTSIDE the Netlify runtime (plain `node`), so it must authenticate to
// Blobs explicitly with a site id + a personal access token.
//
// REQUIRES (env):
//   NETLIFY_AUTH_TOKEN   Netlify personal access token (User settings ->
//                        Applications -> Personal access tokens).
//   NETLIFY_SITE_ID      Target site id. Optional — falls back to
//                        .netlify/state.json, else the known alt-site id.
//
// USAGE:
//   node scripts/seed.mjs            # idempotent: write catalog/inventory only if absent
//   node scripts/seed.mjs --force    # overwrite catalog + inventory unconditionally
//   node scripts/seed.mjs --reset    # DELETE catalog + inventory, then reseed fresh
//   node scripts/seed.mjs --dump     # print current catalog + inventory, no writes
//
// EXAMPLES:
//   NETLIFY_AUTH_TOKEN=nfp_xxx node scripts/seed.mjs --force
//   NETLIFY_AUTH_TOKEN=nfp_xxx NETLIFY_SITE_ID=a7699410-... node scripts/seed.mjs --reset
// ===========================================================================

import { getStore } from '@netlify/blobs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Authoritative catalog data, owned by WS0 (pure, dependency-free ESM).
import { BASE_PRODUCTS, SEED_STOCK, decorate } from '../lib/catalog-data.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWN_SITE_ID = 'a7699410-50b6-447e-9aa6-491dff371df6'; // natural-glow-alt (team CCD)

const CATALOG_KEY = 'catalog.json';
const INVENTORY_KEY = 'inventory.json';
const SCHEMA_VERSION = 1;

function resolveSiteId() {
  if (process.env.NETLIFY_SITE_ID) return process.env.NETLIFY_SITE_ID;
  try {
    const statePath = resolve(__dirname, '..', '.netlify', 'state.json');
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    if (state.siteId) return state.siteId;
  } catch {
    /* ignore */
  }
  return KNOWN_SITE_ID;
}

function requireToken() {
  const token = process.env.NETLIFY_AUTH_TOKEN;
  if (!token) {
    console.error('ERROR: NETLIFY_AUTH_TOKEN is required (Netlify personal access token).');
    console.error('       See the header of scripts/seed.mjs for usage.');
    process.exit(1);
  }
  return token;
}

function stores() {
  const siteID = resolveSiteId();
  const token = requireToken();
  const opts = { siteID, token, consistency: 'strong' };
  return {
    siteID,
    catalog: getStore({ name: 'catalog', ...opts }),
    inventory: getStore({ name: 'inventory', ...opts }),
  };
}

function catalogPayload() {
  return { version: SCHEMA_VERSION, products: BASE_PRODUCTS.map(decorate) };
}

function inventoryPayload() {
  return { version: SCHEMA_VERSION, stock: { ...SEED_STOCK }, lots: {} };
}

async function seed({ force }) {
  const { catalog, inventory, siteID } = stores();
  console.log(`Seeding site ${siteID} (force=${Boolean(force)})…`);

  const cOpts = force ? {} : { onlyIfNew: true };
  const iOpts = force ? {} : { onlyIfNew: true };

  const c = await catalog.setJSON(CATALOG_KEY, catalogPayload(), cOpts);
  const i = await inventory.setJSON(INVENTORY_KEY, inventoryPayload(), iOpts);

  console.log(`  catalog/${CATALOG_KEY}   -> ${describe(c, force)}`);
  console.log(`  inventory/${INVENTORY_KEY} -> ${describe(i, force)}`);
}

function describe(res, force) {
  if (force) return 'overwritten';
  return res.modified ? 'created' : 'already present (kept)';
}

async function reset() {
  const { catalog, inventory, siteID } = stores();
  console.log(`Resetting site ${siteID} — deleting catalog + inventory…`);
  await Promise.allSettled([catalog.delete(CATALOG_KEY), inventory.delete(INVENTORY_KEY)]);
  console.log('  deleted. Reseeding fresh…');
  await seed({ force: true });
}

async function dump() {
  const { catalog, inventory, siteID } = stores();
  console.log(`Current Blobs contents for site ${siteID}:`);
  const c = await catalog.get(CATALOG_KEY, { type: 'json' });
  const i = await inventory.get(INVENTORY_KEY, { type: 'json' });
  console.log(`\ncatalog/${CATALOG_KEY}:`);
  console.log(JSON.stringify(c, null, 2));
  console.log(`\ninventory/${INVENTORY_KEY}:`);
  console.log(JSON.stringify(i, null, 2));
}

async function main() {
  const args = new Set(process.argv.slice(2));
  try {
    if (args.has('--dump')) await dump();
    else if (args.has('--reset')) await reset();
    else await seed({ force: args.has('--force') });
    console.log('\nDone.');
  } catch (err) {
    console.error('\nFAILED:', err?.message || err);
    process.exit(1);
  }
}

main();
