'use client';

import { useState, useEffect } from 'react';
import { BASE_PRODUCTS, CATEGORIES, hasCOA, decorate, SEED_STOCK } from './catalog-data.mjs';

// =====================================================================
// Natural Glow (Direction 1) — single data layer.
// Same architecture as the Editorial build: localStorage + CustomEvents,
// SSR-safe hooks (seed constant → hydrate in effect). Keys `ng_ruo_gate`
// and `ng_account` are inherited from the original single-file app so
// returning visitors keep their gate pass + account.
//
// The live catalog now comes from the shared, dependency-free data module
// lib/catalog-data.mjs (the contract with the serverless seed workstream).
// COA is OPTIONAL: consumables carry purity:null / lot:null and every
// surface degrades gracefully (see hasCOA + decorate). Product-id-keyed
// localStorage was bumped to `-v2` so returning visitors' stale demo-id
// data can't resurrect the retired 10-product catalogue.
// =====================================================================

// ---------- catalogue (from lib/catalog-data.mjs) ----------
// Decorated at module scope for SSR seeds; live consumers use useProducts()
// / getMergedProducts() which re-decorate (base + admin extras + lot override).
export const PRODUCTS = BASE_PRODUCTS.map(decorate);
export { CATEGORIES, hasCOA, decorate };

// ---------- tiny store factory ----------
const isBrowser = () => typeof window !== 'undefined';
function makeStore(key, event, seed) {
  const read = () => {
    if (!isBrowser()) return seed();
    try {
      const v = JSON.parse(localStorage.getItem(key) || 'null');
      return v === null ? seed() : v;
    } catch { return seed(); }
  };
  const write = (v) => {
    if (!isBrowser()) return;
    try { localStorage.setItem(key, JSON.stringify(v)); window.dispatchEvent(new Event(event)); } catch {}
  };
  const useStore = () => {
    const [v, setV] = useState(seed);
    useEffect(() => {
      const sync = () => setV(read());
      sync();
      window.addEventListener(event, sync);
      window.addEventListener('storage', sync);
      return () => { window.removeEventListener(event, sync); window.removeEventListener('storage', sync); };
    }, []);
    return v;
  };
  return { read, write, useStore };
}

// ---------- RUO gate (key inherited from the original app) ----------
export function readGate() {
  if (!isBrowser()) return false;
  try { return localStorage.getItem('ng_ruo_gate') === 'entered'; } catch { return false; }
}
export function writeGate(entered) {
  if (!isBrowser()) return;
  try {
    if (entered) localStorage.setItem('ng_ruo_gate', 'entered');
    else localStorage.removeItem('ng_ruo_gate');
    window.dispatchEvent(new Event('ng-gate-updated'));
  } catch {}
}
export function useGate() {
  // null = not yet hydrated (render nothing gate-related), then true/false
  const [entered, setEntered] = useState(null);
  useEffect(() => {
    const sync = () => setEntered(readGate());
    sync();
    window.addEventListener('ng-gate-updated', sync);
    return () => window.removeEventListener('ng-gate-updated', sync);
  }, []);
  return entered;
}

// ---------- account (simulated; key inherited from the original app) ----------
export const DEFAULT_ACCOUNT = {
  name: 'Dr. Jane Okafor',
  email: 'jane@lab.edu',
  org: 'Okafor Lab',
  address1: '4180 Calle Real, Suite 210',
  city: 'Santa Barbara', state: 'CA', zip: '93110', country: 'United States',
};
const accountStore = makeStore('ng_account', 'ng-account-updated', () => DEFAULT_ACCOUNT);
export const readAccount = () => ({ ...DEFAULT_ACCOUNT, ...accountStore.read() });
export const writeAccount = (patch) => accountStore.write({ ...readAccount(), ...patch });
export const useAccountRaw = accountStore.useStore;
export function useAccount() {
  const raw = useAccountRaw();
  return { ...DEFAULT_ACCOUNT, ...raw };
}
export function initials(name) {
  const clean = String(name || '').replace(/^(Dr|Prof|Mr|Mrs|Ms)\.?\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'R';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ---------- auth (simulated; signed-in flag rides on the account) ----------
const authStore = makeStore('ng1-auth', 'ng-auth-updated', () => false);
export const readAuth = authStore.read;
export const writeAuth = authStore.write; // write(true) on sign-in, write(false) on sign-out
export const useAuth = authStore.useStore;

// ---------- cart (dashboard cart — { id: qty }) ----------
// v2: v1 carts held retired demo product ids.
const cartStore = makeStore('ng1-cart-v2', 'ng-cart-updated', () => ({}));
export const readCart = cartStore.read;
export const writeCart = cartStore.write;
export const useCart = cartStore.useStore;
export function bumpCart(id, delta) {
  const c = { ...readCart() };
  c[id] = (c[id] || 0) + delta;
  if (c[id] <= 0) delete c[id];
  writeCart(c);
}
export const clearCart = () => writeCart({});

// ---------- inventory ({ stock: {id: n}, lots: {id: lot} }) ----------
// Stock seeded from the shared catalog data. v2: v1 stock was keyed to the
// retired demo catalogue.
const invSeed = () => ({ stock: { ...SEED_STOCK }, lots: {} });
const invStore = makeStore('ng1-inventory-v2', 'ng-inventory-updated', invSeed);
export const readInventory = invStore.read;
export const writeInventory = invStore.write;
export const useInventory = invStore.useStore;
export function setStock(id, n) { const v = readInventory(); v.stock[id] = Math.max(0, Math.floor(n) || 0); writeInventory(v); }
export function bumpStock(id, d) { const v = readInventory(); v.stock[id] = Math.max(0, (v.stock[id] || 0) + d); writeInventory(v); }
export function setLot(id, lot) { const v = readInventory(); v.lots[id] = lot; writeInventory(v); }

// ---------- extra products (admin "+ New peptide") ----------
// v2: v1 extras could reference retired demo ids/lots.
const extraStore = makeStore('ng1-products-extra-v2', 'ng-products-updated', () => []);
export const readExtraProducts = extraStore.read;
export const addExtraProduct = (p) => extraStore.write([...extraStore.read(), p]);
export const useExtraProducts = extraStore.useStore;
// Merge base + admin extras, apply any lot override, then decorate so every
// consumer sees coa/format/cartName/cartMeta (and a null lot never prints).
export function getMergedProducts() {
  const lots = readInventory().lots || {};
  return [...BASE_PRODUCTS, ...readExtraProducts()].map((p) => decorate(lots[p.id] ? { ...p, lot: lots[p.id] } : p));
}
export function useProducts() {
  const extras = useExtraProducts();
  const inv = useInventory();
  const lots = inv.lots || {};
  return [...BASE_PRODUCTS, ...extras].map((p) => decorate(lots[p.id] ? { ...p, lot: lots[p.id] } : p));
}
export const productById = (id) => getMergedProducts().find((p) => p.id === id);

// ---------- orders ----------
// { id, mine, customer, address, items:[{id,qty}], placed:'YYYY-MM-DD', status:'Processing'|'Shipped'|'Cancelled',
//   total, proof, cancelReason?, cancelMsg? }
// Seeded orders reference REAL catalog ids; each `total` is the sum of the
// current catalog prices × qty, so every header total equals its line sums.
// (tirzepatide-10 $95 · ghk-cu-50 $65 · nad-500 $90)
const ordersSeed = () => ([
  { id: 'NG-24817', mine: true,  customer: DEFAULT_ACCOUNT.name, address: `${DEFAULT_ACCOUNT.org}\n${DEFAULT_ACCOUNT.address1}\n${DEFAULT_ACCOUNT.city}, ${DEFAULT_ACCOUNT.state} ${DEFAULT_ACCOUNT.zip}`, items: [{ id: 'tirzepatide-10', qty: 1 }, { id: 'ghk-cu-50', qty: 1 }, { id: 'nad-500', qty: 1 }], placed: '2026-06-24', status: 'Processing', total: 250, proof: 'whitfield-receipt.pdf' },
  { id: 'NG-24816', mine: false, customer: 'Dr. M. Alvarez', address: 'Northgate Bioscience\n1200 Research Blvd\nAustin, TX 78759', items: [{ id: 'ghk-cu-50', qty: 1 }], placed: '2026-06-23', status: 'Processing', total: 65, proof: 'alvarez-transfer.png' },
  { id: 'NG-24815', mine: true,  customer: DEFAULT_ACCOUNT.name, address: `${DEFAULT_ACCOUNT.org}\n${DEFAULT_ACCOUNT.address1}\n${DEFAULT_ACCOUNT.city}, ${DEFAULT_ACCOUNT.state} ${DEFAULT_ACCOUNT.zip}`, items: [{ id: 'nad-500', qty: 2 }], placed: '2026-06-22', status: 'Shipped', total: 180, proof: 'okafor-wire-confirmation.png' },
]);
// v2: v1 orders referenced retired demo ids and are NOT migrated.
const orderStore = makeStore('ng1-orders-v2', 'ng-orders-updated', ordersSeed);
export const readOrders = orderStore.read;
export const writeOrders = orderStore.write;
export const useOrders = orderStore.useStore;

const seqStore = makeStore('ng1-order-seq-v2', 'ng-orders-updated', () => 24818);
export function placeOrder({ items, name, address, proof, placed }) {
  const seq = seqStore.read();
  const id = `NG-${seq}`;
  seqStore.write(seq + 1);
  const total = items.reduce((a, it) => a + (productById(it.id)?.price || 0) * it.qty, 0);
  // decrement stock
  const inv = readInventory();
  items.forEach((it) => { inv.stock[it.id] = Math.max(0, (inv.stock[it.id] || 0) - it.qty); });
  writeInventory(inv);
  writeOrders([{ id, mine: true, customer: name, address, items, placed: placed || 'today', status: 'Processing', total, proof }, ...readOrders()]);
  return id;
}
export function shipOrder(id) {
  writeOrders(readOrders().map((o) => (o.id === id ? { ...o, status: 'Shipped' } : o)));
}
export function cancelOrder(id, reason, message) {
  const orders = readOrders();
  const o = orders.find((x) => x.id === id);
  if (!o || o.status === 'Cancelled') return;
  // restock
  const inv = readInventory();
  o.items.forEach((it) => { inv.stock[it.id] = (inv.stock[it.id] || 0) + it.qty; });
  writeInventory(inv);
  writeOrders(orders.map((x) => (x.id === id ? { ...x, status: 'Cancelled', cancelReason: reason, cancelMsg: message || '' } : x)));
}
export function updateOrder(id, patch) {
  writeOrders(readOrders().map((o) => (o.id === id ? { ...o, ...patch } : o)));
}

// ---------- responsive breakpoint (matches the original's 760px) ----------
export function useMobile(bp = 760) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= bp);
    check();
    window.addEventListener('resize', check);
    const iv = setInterval(check, 500);
    return () => { window.removeEventListener('resize', check); clearInterval(iv); };
  }, [bp]);
  return mobile;
}
