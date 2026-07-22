// ===========================================================================
// netlify/functions/orders.mts — customer order + proof API (WS4)
//
//   POST /api/proofs             (user)   upload payment proof (≤5MB, magic-byte
//                                         sniffed) → 201 {proofKey, filename, size}
//   GET  /api/proofs/:orderId    (owner/admin) stream stored proof bytes inline
//   POST /api/orders             (user)   place an order (server total + stock
//                                         decrement, proofKey verified)
//   GET  /api/orders             (user)   list own orders, newest first
//
// Server-owned math: totals + per-line unitPrice are snapshotted from the live
// catalog; the client supplies only { id, qty }. Stock decrement goes through
// the single applyStockDeltas() helper. Order ids are minted per the spike
// verdict (counter RMW + existence check + re-mint). See docs/ARCHITECTURE.md.
// ===========================================================================

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  json,
  methodGuard,
  parseJson,
  withErrors,
  HttpError,
  notFound,
  forbidden,
  badRequest,
  payloadTooLarge,
} from '../lib/http.mts';
import { requireUser, effectiveRole } from '../lib/auth.mts';
import { store } from '../lib/blobs.mts';
import { ensureSeeded, readCatalog, readInventory } from '../lib/seed.mts';
import {
  type OrderDoc,
  type OrderItem,
  mintOrderId,
  applyStockDeltas,
  writeOrder,
  listOrders,
  findOrderById,
  deriveAddress,
  orderPrefix,
  stampProofOrderId,
} from '../lib/orders.mts';

const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5 MB hard cap
const SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Catalog / inventory shapes (mirror seed.mts / products.mts).
// ---------------------------------------------------------------------------
interface RawProduct {
  id: string;
  name: string;
  mg: string;
  price: number;
  active?: boolean;
  [k: string]: unknown;
}
interface Catalog { version: number; products: RawProduct[]; }
interface Inventory { version: number; stock: Record<string, number>; lots: Record<string, string>; }

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const num = z.coerce.number();
const orderSchema = z.object({
  items: z
    .array(z.object({ id: z.string().min(1), qty: num.int().min(1).max(99) }))
    .min(1)
    .max(50),
  shipping: z.object({
    name: z.string().trim().max(160).optional().default(''),
    addr1: z.string().trim().max(200).optional().default(''),
    city: z.string().trim().max(120).optional().default(''),
    state: z.string().trim().max(120).optional().default(''),
    zip: z.string().trim().max(40).optional().default(''),
  }),
  proofKey: z.string().min(1).max(300),
});

// ---------------------------------------------------------------------------
// Magic-byte sniffing — never trust the client-declared content-type.
// pdf | png | jpeg | webp → canonical content-type, else null (415).
// ---------------------------------------------------------------------------
function sniff(b: Uint8Array): string | null {
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf';
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'image/png';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}

// Metadata-only sanitized filename (basename, safe charset, length-capped).
function sanitizeFilename(name: unknown): string {
  const base = String(name || 'receipt').split(/[\\/]/).pop() || 'receipt';
  const clean = base.replace(/[^\w.\- ]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 120);
  return clean || 'receipt';
}

// ---------------------------------------------------------------------------
// POST /api/proofs — upload a payment proof.
// ---------------------------------------------------------------------------
async function uploadProof(req: Request): Promise<Response> {
  const claims = await requireUser(req);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw badRequest('Expected a multipart/form-data upload');
  }
  const file = form.get('file');
  if (!file || typeof file === 'string') throw badRequest('A file field is required');

  // Fast reject on declared size before reading the whole body.
  if (typeof (file as File).size === 'number' && (file as File).size > MAX_PROOF_BYTES) {
    throw payloadTooLarge('Proof exceeds the 5 MB limit');
  }

  const ab = await (file as File).arrayBuffer();
  const bytes = new Uint8Array(ab);
  if (bytes.byteLength > MAX_PROOF_BYTES) throw payloadTooLarge('Proof exceeds the 5 MB limit');
  if (bytes.byteLength === 0) throw badRequest('The uploaded file is empty');

  const contentType = sniff(bytes);
  if (!contentType) {
    throw new HttpError(415, 'unsupported_media_type', 'Upload a PDF, PNG, JPG, or WebP');
  }

  const filename = sanitizeFilename((file as File).name);
  const size = bytes.byteLength;
  const uploadedAt = new Date().toISOString();
  const proofKey = `proof/${claims.sub}/${randomUUID()}`;

  await store('proofs').set(proofKey, ab, {
    metadata: { contentType, filename, size, uploadedAt },
  });

  return json({ proofKey, filename, size }, 201);
}

// ---------------------------------------------------------------------------
// GET /api/proofs/:orderId — stream stored proof bytes (owner or admin).
// ---------------------------------------------------------------------------
async function downloadProof(req: Request, orderId: string): Promise<Response> {
  const claims = await requireUser(req);
  const order = await findOrderById(orderId);
  if (!order) throw notFound('Order not found');

  const admin = effectiveRole(claims) === 'admin';
  if (!admin && order.userId !== claims.sub) throw forbidden('Not allowed');
  if (!order.proofKey) throw notFound('No proof on file for this order');

  const res = await store('proofs').getWithMetadata(order.proofKey, { type: 'arrayBuffer' });
  if (!res || !res.data) throw notFound('Proof file not found');

  const meta = (res.metadata || {}) as { contentType?: string; filename?: string };
  const contentType = meta.contentType || 'application/octet-stream';
  const filename = sanitizeFilename(meta.filename || 'receipt');

  return new Response(res.data as ArrayBuffer, {
    status: 200,
    headers: {
      'content-type': contentType,
      'content-disposition': `inline; filename="${filename}"`,
      'x-content-type-options': 'nosniff',
      'cache-control': 'private, no-store',
    },
  });
}

// ---------------------------------------------------------------------------
// POST /api/orders — place an order.
// ---------------------------------------------------------------------------
async function placeOrder(req: Request): Promise<Response> {
  const claims = await requireUser(req);
  await ensureSeeded();
  const input = await parseJson(req, orderSchema);

  const catalog = (await readCatalog()) as Catalog | null;
  const inventory = (await readInventory()) as Inventory | null;
  const products = new Map<string, RawProduct>((catalog?.products ?? []).map((p) => [p.id, p]));
  const stock = inventory?.stock ?? {};

  // Validate every line against the live catalog + stock.
  const insufficient: { id: string; available: number }[] = [];
  const lines: OrderItem[] = [];
  for (const it of input.items) {
    const p = products.get(it.id);
    const active = !!p && p.active !== false;
    const available = active ? (stock[it.id] ?? 0) : 0;
    if (!active || available < it.qty) {
      insufficient.push({ id: it.id, available });
    } else {
      lines.push({ id: it.id, qty: it.qty, name: p!.name, mg: p!.mg, unitPrice: p!.price });
    }
  }
  if (insufficient.length) {
    throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Some items are unavailable in the requested quantity', {
      items: insufficient,
    });
  }

  // Verify the proof: must belong to THIS user and actually exist.
  const proofKey = input.proofKey;
  if (!proofKey.startsWith(`proof/${claims.sub}/`)) {
    throw new HttpError(422, 'BAD_PROOF', 'Proof of payment is invalid');
  }
  const proofMeta = await store('proofs').getMetadata(proofKey);
  if (!proofMeta) throw new HttpError(422, 'BAD_PROOF', 'Proof of payment was not found');
  const proofFilename =
    (proofMeta.metadata && (proofMeta.metadata as { filename?: string }).filename) || 'receipt';

  const total = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  const shipping = {
    name: input.shipping.name || '',
    addr1: input.shipping.addr1 || '',
    city: input.shipping.city || '',
    state: input.shipping.state || '',
    zip: input.shipping.zip || '',
  };
  const id = await mintOrderId(claims.sub);
  const now = new Date();
  const doc: OrderDoc = {
    version: SCHEMA_VERSION,
    id,
    userId: claims.sub,
    customer: shipping.name || 'Researcher',
    shipping,
    address: deriveAddress(shipping),
    items: lines,
    placed: now.toISOString().slice(0, 10),
    status: 'Processing',
    total,
    proofKey,
    proof: String(proofFilename),
    createdAt: now.toISOString(),
  };

  // Write the order first, then decrement stock (single helper), then stamp the
  // proof. A lost decrement is reconciled via the admin inventory screen.
  await writeOrder(doc);
  await applyStockDeltas(Object.fromEntries(lines.map((l) => [l.id, -l.qty])));
  await stampProofOrderId(proofKey, id);

  return json({ order: doc }, 201);
}

// ---------------------------------------------------------------------------
// GET /api/orders — the caller's own orders, newest first.
// ---------------------------------------------------------------------------
async function listOwnOrders(req: Request): Promise<Response> {
  const claims = await requireUser(req);
  const orders = await listOrders(orderPrefix(claims.sub));
  return json({ orders });
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

  if (path === '/api/orders') {
    methodGuard(req, ['GET', 'POST']);
    return req.method === 'POST' ? placeOrder(req) : listOwnOrders(req);
  }

  if (path === '/api/proofs') {
    methodGuard(req, ['POST']);
    return uploadProof(req);
  }

  const proofMatch = path.match(/^\/api\/proofs\/([^/]+)$/);
  if (proofMatch) {
    methodGuard(req, ['GET']);
    return downloadProof(req, decodeURIComponent(proofMatch[1]));
  }

  throw notFound('Unknown orders route');
});

export const config = {
  path: ['/api/orders', '/api/proofs', '/api/proofs/:orderId'],
};
