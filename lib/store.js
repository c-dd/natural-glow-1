'use client';

import { useState, useEffect } from 'react';
import { BASE_PRODUCTS, CATEGORIES, hasCOA, decorate } from './catalog-data.mjs';

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

// =====================================================================
// SHARED — API client (reused by WS2 auth/account, WS3 products, WS4 orders).
// Same-origin JSON fetch with cookie credentials and a typed ApiError that
// carries the server error `code` from the standard envelope produced by
// netlify/lib/http.mts: { error: { code, message, details? } }. Callers switch
// on err.code (e.g. 'EMAIL_EXISTS', 'LOCKED', 'BAD_CURRENT_PASSWORD').
// =====================================================================
export class ApiError extends Error {
  constructor(code, message, status, details) {
    super(message || code || 'Request failed');
    this.name = 'ApiError';
    this.code = code || 'error';
    this.status = status ?? 0;
    this.details = details;
  }
}

export async function apiFetch(path, opts = {}) {
  const { method = 'GET', body, headers, signal } = opts;
  const init = { method, credentials: 'same-origin', headers: { ...(headers || {}) } };
  if (signal) init.signal = signal;
  if (body !== undefined && body !== null) {
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      // Let the browser set multipart/form-data + boundary; do NOT force a
      // content-type. Used by the proof upload (POST /api/proofs).
      init.body = body;
    } else {
      init.headers['content-type'] = 'application/json';
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
  }
  let res;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiError('network_error', 'Network error — please check your connection and try again.', 0);
  }
  if (res.status === 204) return null;
  let data = null;
  try {
    const text = await res.text();
    if (text) data = JSON.parse(text);
  } catch { data = null; }
  if (!res.ok) {
    const env = (data && data.error) || {};
    throw new ApiError(env.code, env.message, res.status, env.details);
  }
  return data;
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

// =====================================================================
// AUTH / ACCOUNT — real sessions (WS2). Backed by the Netlify Functions auth
// API. A single module-level session singleton is CONFIRMED by GET /api/auth/me;
// an optimistic hint in localStorage ('ng2-auth-hint') drives first paint but is
// ALWAYS reconciled against the API. There is no client-trusted signed-in flag.
// The account IS the session user's profile (empty profile until hydrated).
// =====================================================================
const AUTH_HINT_KEY = 'ng2-auth-hint';
export const EMPTY_PROFILE = {
  name: '', email: '', org: '', address1: '', city: '', state: '', zip: '', country: '', role: 'user',
};

function readHint() {
  if (!isBrowser()) return null;
  try { return JSON.parse(localStorage.getItem(AUTH_HINT_KEY) || 'null'); } catch { return null; }
}
function writeHint(user) {
  if (!isBrowser()) return;
  try {
    if (user) localStorage.setItem(AUTH_HINT_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_HINT_KEY);
    window.dispatchEvent(new Event('ng-auth-updated'));
  } catch {}
}

// Session singleton + pub/sub. status: 'idle' | 'authed' | 'anon'.
let _session = { status: 'idle', user: null };
let _sessionPromise = null;
const _sessionSubs = new Set();
const _notifySession = () => { _sessionSubs.forEach((fn) => { try { fn(); } catch {} }); };
function _setSession(status, user) {
  _session = { status, user: user || null };
  writeHint(user || null);
  _notifySession();
}

async function _fetchSession() {
  try {
    const data = await apiFetch('/api/auth/me');
    const user = (data && data.user) || null;
    _setSession(user ? 'authed' : 'anon', user);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      _setSession('anon', null);
    } else {
      // Network/other error: don't force-sign-out an optimistic session, but
      // resolve to a definite state so guards can proceed.
      _session = { status: _session.user ? 'authed' : 'anon', user: _session.user };
      _notifySession();
    }
  }
  return _session.user;
}

// Force a fresh confirm against the API.
export function refreshSession() {
  _sessionPromise = _fetchSession().finally(() => { _sessionPromise = null; });
  return _sessionPromise;
}

// me(): resolve the confirmed session user (or null). Cached after first confirm;
// { force:true } always re-fetches.
export function me({ force = false } = {}) {
  if (!isBrowser()) return Promise.resolve(null);
  if (force) return refreshSession();
  if (_session.status === 'authed') return Promise.resolve(_session.user);
  if (_session.status === 'anon') return Promise.resolve(null);
  if (!_sessionPromise) _sessionPromise = _fetchSession().finally(() => { _sessionPromise = null; });
  return _sessionPromise;
}

// Synchronous best-effort read (session cache, else the optimistic hint). For
// seeding local UI state; the hooks / me() always reconcile with the API.
export function readSessionUser() {
  if (_session.user) return _session.user;
  return readHint();
}

export function useSession() {
  const [snap, setSnap] = useState({ status: 'loading', user: null });
  useEffect(() => {
    const sync = () => setSnap({ status: _session.status, user: _session.user });
    _sessionSubs.add(sync);
    if (_session.status === 'authed' || _session.status === 'anon') {
      sync(); // already confirmed
    } else {
      const hint = readHint();
      if (hint) setSnap({ status: 'loading', user: hint }); // optimistic paint
      me(); // confirm against the API
    }
    window.addEventListener('ng-auth-updated', sync);
    return () => { _sessionSubs.delete(sync); window.removeEventListener('ng-auth-updated', sync); };
  }, []);
  return snap;
}

// Back-compat: useAuth() -> boolean signed-in signal (optimistic until confirmed).
export function useAuth() {
  const { user } = useSession();
  return !!user;
}

// account = the session user's profile (empty profile until hydrated).
export function useAccount() {
  const { user } = useSession();
  return { ...EMPTY_PROFILE, ...(user || {}) };
}
export function readAccount() {
  return { ...EMPTY_PROFILE, ...(readSessionUser() || {}) };
}

// signup / login set the session cookie server-side and cache the returned user.
export async function signup({ name, email, password }) {
  const data = await apiFetch('/api/auth/signup', { method: 'POST', body: { name, email, password } });
  _setSession('authed', (data && data.user) || null);
  return _session.user;
}
export async function login({ email, password }) {
  const data = await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
  _setSession('authed', (data && data.user) || null);
  return _session.user;
}
export async function logout() {
  try { await apiFetch('/api/auth/logout', { method: 'POST' }); }
  finally { _setSession('anon', null); }
}

// writeAccount(patch) -> PATCH /api/account; caches the updated user on success.
export async function writeAccount(patch) {
  const data = await apiFetch('/api/account', { method: 'PATCH', body: patch });
  const user = (data && data.user) || null;
  if (user) _setSession('authed', user);
  return user;
}

export function initials(name) {
  const clean = String(name || '').replace(/^(Dr|Prof|Mr|Mrs|Ms)\.?\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'R';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

// ---------- shared products + stock resource (GET /api/products) ----------
// One fetch feeds the storefront, portal, and verify page. Replaces the old
// localStorage inventory + `ng1-products-extra-v2` stores — extras now live in
// catalog.json server-side. Seed = a local decorate of the shared BASE_PRODUCTS
// for instant paint (identical on server + first client render, so no hydration
// mismatch); stock hydrates from the server (empty until the fetch resolves,
// which every view tolerates via `?? 0`). Admin mutations go through the API
// and update this cache from the response.
const PRODUCTS_EVENT = 'ng-products-updated';
let _resource = {
  products: BASE_PRODUCTS.map(decorate), // instant-paint seed
  stock: {},                             // hydrate-later
  loaded: false,
  error: null,
};
let _resourcePromise = null;

const emitResource = () => { if (isBrowser()) window.dispatchEvent(new Event(PRODUCTS_EVENT)); };

function applyProductsPayload(data) {
  const products = Array.isArray(data?.products) && data.products.length
    ? data.products.map(decorate)
    : _resource.products;
  const stock = (data && data.stock && typeof data.stock === 'object') ? data.stock : {};
  _resource = { products, stock, loaded: true, error: null };
  emitResource();
}

async function fetchProductsResource() {
  const data = await apiFetch('/api/products'); // SHARED apiFetch (WS2) -> parsed JSON
  applyProductsPayload(data);
  return _resource;
}

// Single shared fetch (deduped). Safe to call from every mounting consumer.
function ensureProductsLoaded() {
  if (!isBrowser()) return null;
  if (_resourcePromise) return _resourcePromise;
  _resourcePromise = fetchProductsResource().catch((e) => {
    _resource = { ..._resource, loaded: true, error: e };
    emitResource();
  });
  return _resourcePromise;
}

// Force a fresh products/stock fetch (used after order place/cancel/edit which
// change server-owned stock, so the catalog + inventory tables reflect truth).
export function refreshProducts() {
  if (!isBrowser()) return null;
  _resourcePromise = fetchProductsResource()
    .catch((e) => { _resource = { ..._resource, loaded: true, error: e }; emitResource(); })
    .finally(() => { _resourcePromise = null; });
  return _resourcePromise;
}

// Subscribe to the resource; kicks the shared fetch on first mount.
function useProductsResource() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const sync = () => setTick((n) => n + 1);
    window.addEventListener(PRODUCTS_EVENT, sync);
    ensureProductsLoaded();
    return () => window.removeEventListener(PRODUCTS_EVENT, sync);
  }, []);
  return _resource;
}

// Lightweight status for a loading/error strip (used by the portal).
export function useProductsStatus() {
  const r = useProductsResource();
  return { loaded: r.loaded, error: r.error };
}

// ---------- products (decorated, from the shared resource) ----------
export function useProducts() {
  return useProductsResource().products;
}
export function getMergedProducts() {
  return _resource.products;
}
export const productById = (id) => _resource.products.find((p) => p.id === id);

// ---------- inventory (stock from the shared resource) ----------
// Returns the { stock, lots } shape the portal expects. Lots are authoritative
// on each product (product.lot from catalog.json), so the lots map stays empty.
export function useInventory() {
  const r = useProductsResource();
  return { stock: r.stock, lots: {} };
}

// ---------- admin inventory / catalog mutations (async, API-backed) ----------
// setStock / setLot / addExtraProduct call the admin API through the SHARED
// apiFetch (WS2), update the shared resource cache from the response, then emit
// so every subscriber re-renders. They return promises and throw ApiError
// (with .status / .code) so the portal can surface busy state + server errors
// (e.g. 409 lot_exists).
export async function setStock(id, n) {
  const stock = Math.max(0, Math.floor(Number(n)) || 0);
  const body = await apiFetch('/api/admin/inventory', { method: 'PATCH', body: { id, stock } });
  const next = typeof body?.stock === 'number' ? body.stock : stock;
  _resource = { ..._resource, stock: { ..._resource.stock, [id]: next } };
  emitResource();
  return next;
}

export async function setLot(id, lot) {
  const body = await apiFetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'PATCH', body: { lot } });
  const updated = decorate(body.product);
  _resource = { ..._resource, products: _resource.products.map((p) => (p.id === id ? updated : p)) };
  emitResource();
  return updated;
}

// addExtraProduct(payload): POST a new product. Payload:
//   { name, sub?, cat, mg, price, lot?, purity?, stock }
// The server mints the id, seeds stock, and (for COA-bearing items) stamps
// today's released date. Returns the created (decorated) product.
export async function addExtraProduct(payload) {
  const body = await apiFetch('/api/admin/products', { method: 'POST', body: payload });
  const created = decorate(body.product);
  const stock = { ..._resource.stock };
  if (payload && payload.stock != null) {
    stock[created.id] = Math.max(0, Math.floor(Number(payload.stock)) || 0);
  }
  _resource = { ..._resource, products: [..._resource.products, created], stock };
  emitResource();
  return created;
}

// ---------- orders (API-backed, WS4) ----------
// The legacy localStorage order + inventory + sequence stores are GONE. Orders
// are server truth: the customer sees GET /api/orders (own orders) and the
// admin sees GET /api/admin/orders (all orders) — two resources keyed
// separately because the endpoints + payloads differ. Mutations POST/PATCH to
// the API and pessimistically replace the cached order from the server response.
//
// Order shape (server, see netlify/lib/orders.mts):
//   { id, userId, customer, shipping, address, items:[{id,qty,name,mg,unitPrice}],
//     placed, status, total, proofKey?, proof?, cancelReason?, cancelMsg?, createdAt }

function makeOrdersResource(event, endpoint) {
  let state = { orders: [], loaded: false, error: null };
  let promise = null;
  const emit = () => { if (isBrowser()) window.dispatchEvent(new Event(event)); };

  async function run() {
    try {
      const data = await apiFetch(endpoint);
      state = { orders: Array.isArray(data && data.orders) ? data.orders : [], loaded: true, error: null };
    } catch (e) {
      state = { ...state, loaded: true, error: e };
    }
    emit();
    return state;
  }
  function ensure() {
    if (!isBrowser()) return null;
    if (promise) return promise;
    promise = run().finally(() => { promise = null; });
    return promise;
  }
  function refresh() {
    if (!isBrowser()) return null;
    promise = run().finally(() => { promise = null; });
    return promise;
  }
  function replace(order) {
    if (!order || !order.id) return;
    const i = state.orders.findIndex((o) => o.id === order.id);
    const next = state.orders.slice();
    if (i === -1) next.unshift(order); else next[i] = order;
    state = { ...state, orders: next };
    emit();
  }
  function prepend(order) {
    if (!order || !order.id) return;
    if (state.orders.some((o) => o.id === order.id)) return replace(order);
    state = { ...state, orders: [order, ...state.orders] };
    emit();
  }
  // `enabled` gates the fetch — the admin resource stays dormant (and never
  // 403s) for non-admin users, who still call the hook to satisfy hook rules.
  function useList(enabled = true) {
    const [, setTick] = useState(0);
    useEffect(() => {
      const sync = () => setTick((n) => n + 1);
      window.addEventListener(event, sync);
      if (enabled) ensure();
      return () => window.removeEventListener(event, sync);
    }, [enabled]);
    return enabled ? state.orders : [];
  }
  function useStatus(enabled = true) {
    const [, setTick] = useState(0);
    useEffect(() => {
      const sync = () => setTick((n) => n + 1);
      window.addEventListener(event, sync);
      if (enabled) ensure();
      return () => window.removeEventListener(event, sync);
    }, [enabled]);
    return { loaded: enabled ? state.loaded : true, error: enabled ? state.error : null };
  }
  return { ensure, refresh, replace, prepend, useList, useStatus };
}

const customerOrders = makeOrdersResource('ng-orders-updated', '/api/orders');
const adminOrders = makeOrdersResource('ng-admin-orders-updated', '/api/admin/orders');

// Customer: own orders.
export const useOrders = customerOrders.useList;
export const useOrdersStatus = customerOrders.useStatus;
export const refreshOrders = customerOrders.refresh;
// Admin: all orders.
export const useAdminOrders = adminOrders.useList;
export const useAdminOrdersStatus = adminOrders.useStatus;
export const refreshAdminOrders = adminOrders.refresh;

// Same-origin authenticated proof URL (cookie rides along). Used by the proof
// modal iframe/link → GET /api/proofs/{orderId}.
export const proofUrl = (orderId) => `/api/proofs/${encodeURIComponent(orderId)}`;

// uploadProof(file) -> POST /api/proofs (multipart). Returns { proofKey, filename, size }.
export async function uploadProof(file) {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetch('/api/proofs', { method: 'POST', body: fd });
}

// placeOrder({ items, shipping, proofKey }) -> POST /api/orders. Server computes
// total + decrements stock; returns the created order, prepended to the cache.
export async function placeOrder({ items, shipping, proofKey }) {
  const data = await apiFetch('/api/orders', { method: 'POST', body: { items, shipping, proofKey } });
  const order = (data && data.order) || null;
  if (order) customerOrders.prepend(order);
  return order;
}

// Admin actions — pessimistic: the server response replaces the cached order.
export async function shipOrder(id) {
  const data = await apiFetch(`/api/admin/orders/${encodeURIComponent(id)}/ship`, { method: 'POST' });
  const order = (data && data.order) || null;
  if (order) adminOrders.replace(order);
  return order;
}
export async function cancelOrder(id, reason, message) {
  const data = await apiFetch(`/api/admin/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: { reason, message } });
  const order = (data && data.order) || null;
  if (order) adminOrders.replace(order);
  return order;
}
export async function updateOrder(id, patch) {
  const data = await apiFetch(`/api/admin/orders/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch });
  const order = (data && data.order) || null;
  if (order) adminOrders.replace(order);
  return order;
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
