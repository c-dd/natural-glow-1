// ===========================================================================
// netlify/functions/admin-orders.mts — admin order management (WS4)
//
//   GET   /api/admin/orders             (admin)  all orders, newest first
//   POST  /api/admin/orders/:id/ship    (admin)  Processing → Shipped (else 409)
//   POST  /api/admin/orders/:id/cancel  (admin)  Processing → Cancelled + restock
//   PATCH /api/admin/orders/:id         (admin)  edit while Processing; server
//                                                recomputes total + adjusts stock
//
// :id resolves via a prefix-list match (ids are globally unique). All stock
// changes route through the single applyStockDeltas() helper. Existing lines
// keep their unitPrice snapshots; added lines are priced from the live catalog.
// See docs/ARCHITECTURE.md (PRODUCTION SPIKE VERDICT).
// ===========================================================================

import { z } from 'zod';
import {
  json,
  methodGuard,
  parseJson,
  withErrors,
  HttpError,
  notFound,
} from '../lib/http.mts';
import { requireAdmin } from '../lib/auth.mts';
import { ensureSeeded, readCatalog } from '../lib/seed.mts';
import {
  type OrderDoc,
  type OrderItem,
  applyStockDeltas,
  writeOrder,
  findOrderById,
  listOrders,
  deriveAddress,
  ALL_ORDERS_PREFIX,
} from '../lib/orders.mts';

interface RawProduct { id: string; name: string; mg: string; price: number; active?: boolean; [k: string]: unknown; }
interface Catalog { version: number; products: RawProduct[]; }

const num = z.coerce.number();
const cancelSchema = z.object({
  reason: z.string().trim().min(1).max(200),
  message: z.string().trim().max(1000).optional().default(''),
});
const patchSchema = z
  .object({
    items: z
      .array(z.object({ id: z.string().min(1), qty: num.int().min(1).max(99) }))
      .min(1)
      .max(50)
      .optional(),
    customer: z.string().trim().max(160).optional(),
    address: z.string().max(600).optional(),
    shipping: z
      .object({
        name: z.string().trim().max(160).optional(),
        addr1: z.string().trim().max(200).optional(),
        city: z.string().trim().max(120).optional(),
        state: z.string().trim().max(120).optional(),
        zip: z.string().trim().max(40).optional(),
      })
      .optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'No changes supplied' });

const notProcessing = () =>
  new HttpError(409, 'NOT_PROCESSING', 'Only orders that are still processing can be changed');

// ---------------------------------------------------------------------------
// GET /api/admin/orders
// ---------------------------------------------------------------------------
async function listAllOrders(req: Request): Promise<Response> {
  await requireAdmin(req);
  const orders = await listOrders(ALL_ORDERS_PREFIX);
  return json({ orders });
}

// ---------------------------------------------------------------------------
// GET /api/admin/orders/export.csv — shipping-label CSV for Pirate Ship's
// "Upload a Spreadsheet" bulk import.
//
// Pirate Ship column research (2026-07-22, sources below): only Name, Address
// (line 1), City, State, Zip are REQUIRED; all headers are user-mappable at
// import time ("field mapping"). Optional columns Pirate Ship recognises include
// Address Line 2/3, Company, Country, Email, Phone, Order ID, weight & package
// dimensions, and up to three "Rubber Stamp" corner fields. We emit the
// template's canonical address headers plus an Order ID column (an optional
// column Pirate Ship maps to the label / passthrough) so the warehouse can print
// labels directly from a placed order.
//   Sources:
//     https://www.pirateship.com/integrations/spreadsheets
//     https://support.pirateship.com/en/articles/1068428-how-do-i-upload-address-spreadsheets-into-pirate-ship
//
// Field map (STRUCTURED shipping fields ONLY — never the display `address`
// string, which embeds newlines):
//   shipping.name  -> Name            shipping.city  -> City
//   shipping.addr1 -> Address Line 1  shipping.state -> State
//   (no addr2 yet) -> Address Line 2  shipping.zip   -> Zip
//   order.id       -> Order ID
// US-only for now, so no Country column. RFC-4180 escaping (a cell containing a
// comma / double-quote / CR / LF is wrapped in double-quotes and embedded quotes
// are doubled); CRLF row terminators.
//
// ?status defaults to Processing (the fulfilment queue). ?status=all exports
// every non-cancelled order (Processing + Shipped); an explicit Shipped or
// Cancelled value filters to exactly that status.
// ---------------------------------------------------------------------------
const CSV_COLUMNS = ['Name', 'Address Line 1', 'Address Line 2', 'City', 'State', 'Zip', 'Order ID'];

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(',');
}

async function exportOrdersCsv(req: Request): Promise<Response> {
  await requireAdmin(req);
  const status = new URL(req.url).searchParams.get('status') || 'Processing';
  const all = await listOrders(ALL_ORDERS_PREFIX);
  const rows = all.filter((o) => {
    if (status === 'all') return o.status !== 'Cancelled';
    if (status === 'Shipped' || status === 'Cancelled') return o.status === status;
    return o.status === 'Processing';
  });

  const lines = [csvRow(CSV_COLUMNS)];
  for (const o of rows) {
    const s = (o.shipping || {}) as Partial<OrderDoc['shipping']>;
    lines.push(
      csvRow([s.name || o.customer || '', s.addr1 || '', '', s.city || '', s.state || '', s.zip || '', o.id]),
    );
  }
  // RFC-4180 uses CRLF; the trailing newline keeps the final record well-formed.
  const body = lines.join('\r\n') + '\r\n';

  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="natural-glow-orders-${date}.csv"`,
      'cache-control': 'no-store',
    },
  });
}

// ---------------------------------------------------------------------------
// POST /api/admin/orders/:id/ship
// ---------------------------------------------------------------------------
async function shipOrder(req: Request, id: string): Promise<Response> {
  await requireAdmin(req);
  const order = await findOrderById(id);
  if (!order) throw notFound('Order not found');
  if (order.status !== 'Processing') throw notProcessing();

  const next: OrderDoc = { ...order, status: 'Shipped' };
  await writeOrder(next);
  return json({ order: next });
}

// ---------------------------------------------------------------------------
// POST /api/admin/orders/:id/cancel — restock via the single helper.
// ---------------------------------------------------------------------------
async function cancelOrder(req: Request, id: string): Promise<Response> {
  await requireAdmin(req);
  const input = await parseJson(req, cancelSchema);
  const order = await findOrderById(id);
  if (!order) throw notFound('Order not found');
  if (order.status !== 'Processing') throw notProcessing();

  const next: OrderDoc = {
    ...order,
    status: 'Cancelled',
    cancelReason: input.reason,
    cancelMsg: input.message || '',
  };
  await writeOrder(next);
  // Release the reserved units back into inventory (positive deltas).
  await applyStockDeltas(Object.fromEntries(order.items.map((it) => [it.id, it.qty])));
  return json({ order: next });
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/orders/:id — edit while Processing.
// ---------------------------------------------------------------------------
async function patchOrder(req: Request, id: string): Promise<Response> {
  await requireAdmin(req);
  await ensureSeeded();
  const input = await parseJson(req, patchSchema);
  const order = await findOrderById(id);
  if (!order) throw notFound('Order not found');
  if (order.status !== 'Processing') throw notProcessing();

  const next: OrderDoc = { ...order };
  const deltas: Record<string, number> = {};

  if (input.items) {
    const catalog = (await readCatalog()) as Catalog | null;
    const products = new Map<string, RawProduct>((catalog?.products ?? []).map((p) => [p.id, p]));
    const oldById = new Map<string, OrderItem>(order.items.map((it) => [it.id, it]));

    const newItems: OrderItem[] = [];
    for (const it of input.items) {
      const prev = oldById.get(it.id);
      if (prev) {
        // Existing line keeps its price/name/mg snapshot; only qty changes.
        newItems.push({ ...prev, qty: it.qty });
      } else {
        // Added line prices from the live catalog.
        const p = products.get(it.id);
        if (!p || p.active === false) throw new HttpError(400, 'bad_request', `Unknown product ${it.id}`);
        newItems.push({ id: p.id, qty: it.qty, name: p.name, mg: p.mg, unitPrice: p.price });
      }
    }

    // Stock delta = old reserved − new reserved (positive = release, negative = take).
    const ids = new Set<string>([...oldById.keys(), ...newItems.map((n) => n.id)]);
    const newQty = new Map<string, number>(newItems.map((n) => [n.id, n.qty]));
    for (const pid of ids) {
      const before = oldById.get(pid)?.qty || 0;
      const after = newQty.get(pid) || 0;
      const d = before - after;
      if (d !== 0) deltas[pid] = d;
    }

    next.items = newItems;
    next.total = newItems.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  }

  if (input.customer !== undefined) next.customer = input.customer;
  if (input.shipping) {
    next.shipping = { ...next.shipping, ...input.shipping } as OrderDoc['shipping'];
    next.address = deriveAddress(next.shipping);
    if (input.customer === undefined && input.shipping.name) next.customer = input.shipping.name;
  }
  // Freeform address override (the current admin edit UI sends a single field).
  if (input.address !== undefined) next.address = input.address || '—';

  await writeOrder(next);
  await applyStockDeltas(deltas);
  return json({ order: next });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
export default withErrors(async (req: Request) => {
  const { pathname } = new URL(req.url);
  const path = pathname
    .replace(/\/index\.html?$/i, '')
    .replace(/\.html?$/i, '')
    .replace(/\/+$/, '');

  if (path === '/api/admin/orders') {
    methodGuard(req, ['GET']);
    return listAllOrders(req);
  }

  // Must precede the generic /:id match below (export.csv would otherwise be
  // read as an order id and rejected 405 by the PATCH-only item route).
  if (path === '/api/admin/orders/export.csv') {
    methodGuard(req, ['GET']);
    return exportOrdersCsv(req);
  }

  const shipMatch = path.match(/^\/api\/admin\/orders\/([^/]+)\/ship$/);
  if (shipMatch) {
    methodGuard(req, ['POST']);
    return shipOrder(req, decodeURIComponent(shipMatch[1]));
  }

  const cancelMatch = path.match(/^\/api\/admin\/orders\/([^/]+)\/cancel$/);
  if (cancelMatch) {
    methodGuard(req, ['POST']);
    return cancelOrder(req, decodeURIComponent(cancelMatch[1]));
  }

  const itemMatch = path.match(/^\/api\/admin\/orders\/([^/]+)$/);
  if (itemMatch) {
    methodGuard(req, ['PATCH']);
    return patchOrder(req, decodeURIComponent(itemMatch[1]));
  }

  throw notFound('Unknown admin-orders route');
});

export const config = {
  path: [
    '/api/admin/orders',
    '/api/admin/orders/export.csv',
    '/api/admin/orders/:id',
    '/api/admin/orders/:id/ship',
    '/api/admin/orders/:id/cancel',
  ],
};
