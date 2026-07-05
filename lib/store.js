'use client';

import { useState, useEffect } from 'react';

// =====================================================================
// Natural Glow (Direction 1) — single data layer.
// Same architecture as the Editorial build: localStorage + CustomEvents,
// SSR-safe hooks (seed constant → hydrate in effect). Keys `ng_ruo_gate`
// and `ng_account` are inherited from the original single-file app so
// returning visitors keep their gate pass + account.
// =====================================================================

// ---------- catalogue (from the original design source) ----------
export const PRODUCTS = [
  { id: 'nad',        name: 'NAD+',                     sub: 'Nicotinamide adenine dinucleotide', cat: 'Metabolic',       mg: '500 mg', purity: '99.0%', cas: '53-84-9',      lot: 'NG-0512', price: 120, blurb: 'Metabolic cofactor reference material, lyophilized.', featured: true },
  { id: 'carnitine',  name: 'L-Carnitine',              sub: 'Levocarnitine',                     cat: 'Metabolic',       mg: '10 mg',  purity: '99.0%', cas: '541-15-1',     lot: 'NG-0509', price: 44,  blurb: 'Amino-acid derivative reference material, lyophilized.', featured: true },
  { id: 'amino-1mq',  name: '5-Amino-1MQ',              sub: '5-Amino-1-methylquinolinium',       cat: 'Metabolic',       mg: '5 mg',   purity: '99.0%', cas: '103201-78-3',  lot: 'NG-0505', price: 98,  blurb: 'Small-molecule reference material, lyophilized.', featured: true },
  { id: 'mots-c',     name: 'MOTS-c',                   sub: 'Mitochondrial-derived peptide',     cat: 'Metabolic',       mg: '10 mg',  purity: '99.0%', cas: '1627580-64-6', lot: 'NG-0501', price: 110, blurb: 'Mitochondrial-derived peptide reference material.', featured: true },
  { id: 'ghk-cu',     name: 'GHK-Cu',                   sub: 'Copper Tripeptide-1 · Cu-GHK',      cat: 'Copper peptides', mg: '50 mg',  purity: '99.4%', cas: '89030-95-5',   lot: 'NG-0421', price: 68,  blurb: 'Copper-bound tripeptide (Gly-His-Lys) reference material.' },
  { id: 'ghk',        name: 'GHK',                      sub: 'Tripeptide-1 · Gly-His-Lys',        cat: 'Signal peptides', mg: '50 mg',  purity: '99.1%', cas: '72957-37-0',   lot: 'NG-0388', price: 54,  blurb: 'The base tripeptide Gly-His-Lys, lyophilized reference material.' },
  { id: 'matrixyl',   name: 'Palmitoyl Tripeptide-1',   sub: 'Pal-GHK · "Matrixyl"',              cat: 'Signal peptides', mg: '100 mg', purity: '98.7%', cas: '147732-56-7',  lot: 'NG-0412', price: 92,  blurb: 'Palmitoylated signal-peptide reference material.' },
  { id: 'argireline', name: 'Acetyl Hexapeptide-8',     sub: '"Argireline" · Ac-EEMQRR',          cat: 'Signal peptides', mg: '100 mg', purity: '99.0%', cas: '616204-22-9',  lot: 'NG-0405', price: 88,  blurb: 'Acetylated hexapeptide reference material.' },
  { id: 'pal-pent',   name: 'Palmitoyl Pentapeptide-4', sub: 'Pal-KTTKS · "Matrixyl 3000"',       cat: 'Signal peptides', mg: '100 mg', purity: '98.9%', cas: '214047-00-4',  lot: 'NG-0399', price: 96,  blurb: 'Palmitoylated pentapeptide reference material.' },
  { id: 'copper-tri', name: 'Tripeptide-1 (AHK-Cu)',    sub: 'Copper-complexed AHK',              cat: 'Copper peptides', mg: '50 mg',  purity: '99.2%', cas: '49557-75-7',   lot: 'NG-0370', price: 72,  blurb: 'Copper-complexed tripeptide reference material.' },
];

export const CATEGORIES = ['Metabolic', 'Copper peptides', 'Signal peptides'];

// lot → COA release date (retest = +24 months; analyst 'M. Reyes, QC')
export const RELEASED = {
  'NG-0512': '2026-05-20', 'NG-0509': '2026-05-14', 'NG-0505': '2026-05-06',
  'NG-0501': '2026-04-29', 'NG-0421': '2026-04-18', 'NG-0388': '2026-03-02',
  'NG-0412': '2026-04-09', 'NG-0405': '2026-03-27', 'NG-0399': '2026-02-14',
  'NG-0370': '2026-01-22',
};

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
const cartStore = makeStore('ng1-cart', 'ng-cart-updated', () => ({}));
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
const invSeed = () => ({
  stock: Object.fromEntries([['nad',60],['carnitine',80],['amino-1mq',48],['mots-c',52],['ghk-cu',120],['ghk',86],['matrixyl',64],['argireline',52],['pal-pent',40],['copper-tri',18]]),
  lots: {},
});
const invStore = makeStore('ng1-inventory', 'ng-inventory-updated', invSeed);
export const readInventory = invStore.read;
export const writeInventory = invStore.write;
export const useInventory = invStore.useStore;
export function setStock(id, n) { const v = readInventory(); v.stock[id] = Math.max(0, Math.floor(n) || 0); writeInventory(v); }
export function bumpStock(id, d) { const v = readInventory(); v.stock[id] = Math.max(0, (v.stock[id] || 0) + d); writeInventory(v); }
export function setLot(id, lot) { const v = readInventory(); v.lots[id] = lot; writeInventory(v); }

// ---------- extra products (admin "+ New peptide") ----------
const extraStore = makeStore('ng1-products-extra', 'ng-products-updated', () => []);
export const readExtraProducts = extraStore.read;
export const addExtraProduct = (p) => extraStore.write([...extraStore.read(), p]);
export const useExtraProducts = extraStore.useStore;
export function getMergedProducts() {
  const lots = readInventory().lots || {};
  return [...PRODUCTS, ...readExtraProducts()].map((p) => (lots[p.id] ? { ...p, lot: lots[p.id] } : p));
}
export function useProducts() {
  const extras = useExtraProducts();
  const inv = useInventory();
  const lots = inv.lots || {};
  return [...PRODUCTS, ...extras].map((p) => (lots[p.id] ? { ...p, lot: lots[p.id] } : p));
}
export const productById = (id) => getMergedProducts().find((p) => p.id === id);

// ---------- orders ----------
// { id, mine, customer, address, items:[{id,qty}], placed:'YYYY-MM-DD', status:'Processing'|'Shipped'|'Cancelled',
//   total, proof, cancelReason?, cancelMsg? }
const ordersSeed = () => ([
  { id: 'NG-24817', mine: true,  customer: DEFAULT_ACCOUNT.name, address: `${DEFAULT_ACCOUNT.org}\n${DEFAULT_ACCOUNT.address1}\n${DEFAULT_ACCOUNT.city}, ${DEFAULT_ACCOUNT.state} ${DEFAULT_ACCOUNT.zip}`, items: [{ id: 'ghk-cu', qty: 2 }, { id: 'nad', qty: 1 }], placed: '2026-06-24', status: 'Processing', total: 256, proof: 'whitfield-receipt.pdf' },
  { id: 'NG-24816', mine: false, customer: 'Dr. M. Alvarez', address: 'Northgate Bioscience\n1200 Research Blvd\nAustin, TX 78759', items: [{ id: 'ghk-cu', qty: 1 }], placed: '2026-06-23', status: 'Processing', total: 68, proof: 'alvarez-transfer.png' },
  { id: 'NG-24815', mine: true,  customer: DEFAULT_ACCOUNT.name, address: `${DEFAULT_ACCOUNT.org}\n${DEFAULT_ACCOUNT.address1}\n${DEFAULT_ACCOUNT.city}, ${DEFAULT_ACCOUNT.state} ${DEFAULT_ACCOUNT.zip}`, items: [{ id: 'mots-c', qty: 2 }], placed: '2026-06-22', status: 'Shipped', total: 220, proof: 'okafor-wire-confirmation.png' },
]);
const orderStore = makeStore('ng1-orders', 'ng-orders-updated', ordersSeed);
export const readOrders = orderStore.read;
export const writeOrders = orderStore.write;
export const useOrders = orderStore.useStore;

const seqStore = makeStore('ng1-order-seq', 'ng-orders-updated', () => 24818);
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
