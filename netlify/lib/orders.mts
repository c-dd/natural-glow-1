// ===========================================================================
// netlify/lib/orders.mts — order records + the SINGLE inventory-mutation path.
//
// Per the BINDING production spike verdict (docs/ARCHITECTURE.md) conditional
// writes are NOT usable, so this file follows the mandated fallbacks:
//   • Order ids: counter RMW (casUpdate on seq/order, now plain last-write-wins)
//     PLUS a pre-write existence check on the order key; re-mint on a duplicate.
//   • Stock decrement / restock / edit-delta: read-validate-write, ALL routed
//     through the one helper applyStockDeltas() so there is a single code path
//     to upgrade later. Concurrent-order decrement race is accepted at launch
//     volume; the admin inventory screen is the reconciliation path.
//
// Order docs live at distinct keys order/{userId}/{orderId} (write-once per
// order, so no CAS needed for the doc itself). Proof bytes live in the `proofs`
// store at proof/{userId}/{uuid}, written once at a distinct key.
// ===========================================================================

import { randomUUID } from 'node:crypto';
import { store, casUpdate } from './blobs.mts';
import { readInventory } from './seed.mts';

const ORDERS_STORE = 'orders' as const;
const INVENTORY_STORE = 'inventory' as const;
const INVENTORY_KEY = 'inventory.json';
const SEQ_KEY = 'seq/order';
const SEQ_START = 24818; // first real order id → NG-24818 (demo seed ended 24817)
const SCHEMA_VERSION = 1;

export interface OrderItem {
  id: string;
  qty: number;
  name: string;
  mg: string;
  unitPrice: number;
}

export interface Shipping {
  name: string;
  addr1: string;
  city: string;
  state: string;
  zip: string;
}

export type OrderStatus = 'Processing' | 'Shipped' | 'Cancelled';

export interface OrderDoc {
  version: number;
  id: string;
  userId: string;
  customer: string;
  shipping: Shipping;
  address: string; // display string derived from shipping (view compat)
  items: OrderItem[];
  placed: string; // YYYY-MM-DD
  status: OrderStatus;
  total: number;
  proofKey?: string;
  proof?: string; // sanitized filename for display (view compat)
  cancelReason?: string;
  cancelMsg?: string;
  createdAt: string; // ISO
}

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------
export const orderKey = (userId: string, id: string) => `order/${userId}/${id}`;
export const orderPrefix = (userId: string) => `order/${userId}/`;
export const ALL_ORDERS_PREFIX = 'order/';

// ---------------------------------------------------------------------------
// Address display string (mirrors the client's previous checkout formatting).
// ---------------------------------------------------------------------------
export function deriveAddress(s: Shipping): string {
  const cityLine = [s.city, [s.state, s.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return [s.addr1, cityLine].filter(Boolean).join('\n') || '—';
}

// ---------------------------------------------------------------------------
// Order-id minting — counter RMW + pre-write existence check + re-mint.
// ---------------------------------------------------------------------------
export async function mintOrderId(userId: string): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const seq = await casUpdate<number>(ORDERS_STORE, SEQ_KEY, (cur) =>
      typeof cur === 'number' && Number.isFinite(cur) ? cur + 1 : SEQ_START,
    );
    const id = `NG-${seq}`;
    // Pre-write existence check on the order key (per the spike verdict). A hit
    // means this seq was already consumed (a lost counter RMW) → re-mint.
    const existing = await store(ORDERS_STORE).getMetadata(orderKey(userId, id));
    if (!existing) return id;
  }
  throw new Error('mintOrderId: could not mint a unique order id');
}

// ---------------------------------------------------------------------------
// applyStockDeltas — the ONE inventory-mutation path. `deltas` maps productId →
// signed change to apply to on-hand stock (negative = decrement / reserve,
// positive = restock). Clamped at 0. Read-validate-write via casUpdate (which
// degrades to last-write-wins per the spike verdict).
// ---------------------------------------------------------------------------
interface Inventory {
  version: number;
  stock: Record<string, number>;
  lots: Record<string, string>;
}
export async function applyStockDeltas(deltas: Record<string, number>): Promise<void> {
  const entries = Object.entries(deltas).filter(([, d]) => d !== 0);
  if (entries.length === 0) return;
  await casUpdate<Inventory>(INVENTORY_STORE, INVENTORY_KEY, (cur) => {
    const inv: Inventory = cur ?? { version: SCHEMA_VERSION, stock: {}, lots: {} };
    const stock = { ...(inv.stock ?? {}) };
    for (const [id, d] of entries) {
      stock[id] = Math.max(0, (stock[id] || 0) + d);
    }
    return { ...inv, stock };
  });
}

// Convenience readers.
export async function currentStock(): Promise<Record<string, number>> {
  const inv = (await readInventory()) as Inventory | null;
  return inv?.stock ?? {};
}

// ---------------------------------------------------------------------------
// Order doc read / write / list
// ---------------------------------------------------------------------------
export async function writeOrder(doc: OrderDoc): Promise<void> {
  // Distinct per-order key → plain write is correct even under last-write-wins.
  await store(ORDERS_STORE).setJSON(orderKey(doc.userId, doc.id), doc);
}

export async function readOrder(userId: string, id: string): Promise<OrderDoc | null> {
  const doc = await store(ORDERS_STORE).get(orderKey(userId, id), { type: 'json' });
  return (doc ?? null) as OrderDoc | null;
}

// Resolve an order by its (globally unique) id via a prefix-list match. Returns
// the doc together with its storage key.
export async function findOrderById(id: string): Promise<OrderDoc | null> {
  const s = store(ORDERS_STORE);
  const { blobs } = await s.list({ prefix: ALL_ORDERS_PREFIX });
  const match = blobs.find((b) => b.key.endsWith(`/${id}`));
  if (!match) return null;
  const doc = await s.get(match.key, { type: 'json' });
  return (doc ?? null) as OrderDoc | null;
}

export async function listOrders(prefix: string): Promise<OrderDoc[]> {
  const s = store(ORDERS_STORE);
  const { blobs } = await s.list({ prefix });
  const docs = await Promise.all(blobs.map((b) => s.get(b.key, { type: 'json' })));
  return (docs.filter(Boolean) as OrderDoc[]).sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
  );
}

// ---------------------------------------------------------------------------
// Proof metadata — stamp the placed order's id onto the stored proof.
// ---------------------------------------------------------------------------
export async function stampProofOrderId(proofKey: string, orderId: string): Promise<void> {
  try {
    const s = store('proofs');
    const res = await s.getWithMetadata(proofKey, { type: 'arrayBuffer' });
    if (!res || !res.data) return;
    const meta = { ...(res.metadata || {}), orderId };
    await s.set(proofKey, res.data, { metadata: meta });
  } catch {
    // Best-effort: a missing orderId stamp never blocks placement; the order
    // already records proofKey and download resolves via the order, not this.
  }
}
