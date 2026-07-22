// ===========================================================================
// netlify/lib/blobs.mts — Netlify Blobs accessors + JSON + CAS helpers.
//
// Built on @netlify/blobs 10.7.9, whose set/setJSON support genuine,
// server-side ATOMIC conditional writes (verified against the installed types
// and compiled source):
//
//   setJSON(key, data, { onlyIfNew: true })   -> create-only
//   setJSON(key, data, { onlyIfMatch: etag }) -> update-only, compare ETag
//
// Both return { etag?, modified }. A failed precondition returns
// { modified: false } (HTTP 412 mapped to a no-op) — it does NOT throw.
// getWithMetadata exposes the current `etag`, which is what CAS compares.
//
// EMPIRICAL SPIKE FINDING (GET /api/health, netlify/functions/health.mts):
//   • PRODUCTION Blobs honors onlyIfNew/onlyIfMatch atomically and returns
//     etags from getWithMetadata. Full compare-and-swap works.
//   • The LOCAL `netlify dev` Blobs SANDBOX does NOT: getWithMetadata returns
//     no etag and the conditions are ignored (last-write-wins). Strong
//     read-after-write DOES hold locally.
// So the helpers below are written to use real CAS whenever an etag is present
// (production) and to DEGRADE GRACEFULLY to last-write-wins when it is absent
// (local sandbox) — never to throw or spin. See docs/ARCHITECTURE.md.
//
// All stores are opened with consistency:'strong' so a read always reflects
// the most recent write (read-after-write). See docs/ARCHITECTURE.md.
// ===========================================================================

import { getStore } from '@netlify/blobs';
import type { Store } from '@netlify/blobs';

// Canonical store names used across the backend.
export type StoreName = 'catalog' | 'inventory' | 'orders' | 'users' | 'proofs';

// ---------------------------------------------------------------------------
// store(): strong-consistency accessor. In production, strong reads route to a
// non-distributed origin so we never observe a stale value after a write.
// ---------------------------------------------------------------------------
export function store(name: StoreName): Store {
  return getStore({ name, consistency: 'strong' });
}

// ---------------------------------------------------------------------------
// Plain JSON read/write.
// ---------------------------------------------------------------------------
export async function readJson<T = unknown>(name: StoreName, key: string): Promise<T | null> {
  const value = await store(name).get(key, { type: 'json' });
  return (value ?? null) as T | null;
}

export async function writeJson(name: StoreName, key: string, data: unknown): Promise<void> {
  await store(name).setJSON(key, data);
}

// Read the value together with its current ETag (needed for CAS). Returns a
// null `data` + undefined `etag` when the key does not exist.
export async function readJsonWithEtag<T = unknown>(
  name: StoreName,
  key: string,
): Promise<{ data: T | null; etag: string | undefined }> {
  const res = await store(name).getWithMetadata(key, { type: 'json' });
  if (!res) return { data: null, etag: undefined };
  return { data: (res.data ?? null) as T | null, etag: res.etag };
}

// ---------------------------------------------------------------------------
// writeIfNew(): create-only write. Returns true iff this call created the key
// (i.e. it did not exist before). Idempotent seed primitive.
//
// A pre-read short-circuits when the key already exists — this keeps the
// primitive idempotent even on the local sandbox, which ignores onlyIfNew.
// In production the onlyIfNew condition still atomically guards the read→write
// race between two concurrent creators (both may read null; only one write
// wins, the loser gets modified:false).
// ---------------------------------------------------------------------------
export async function writeIfNew(name: StoreName, key: string, data: unknown): Promise<boolean> {
  const s = store(name);
  const existing = await s.get(key, { type: 'json' });
  if (existing !== null && existing !== undefined) return false;
  const res = await s.setJSON(key, data, { onlyIfNew: true });
  return res.modified === true;
}

// ---------------------------------------------------------------------------
// casUpdate(): read-modify-write under a compare-and-swap loop.
//
//   read {data, etag}  ->  next = updateFn(data)  ->  write with
//   { onlyIfMatch: etag }  (or { onlyIfNew: true } when the key is absent).
//
// If the conditional write is a no-op (someone else wrote in between), we
// back off briefly and retry from a fresh read. This is the single-writer
// discipline every mutation of shared state (inventory, orders index, etc.)
// MUST go through — never a bare read-then-write.
//
// `updateFn` may be async and may throw to abort (its error propagates).
// Returns the value that was actually written.
// ---------------------------------------------------------------------------
export async function casUpdate<T>(
  name: StoreName,
  key: string,
  updateFn: (current: T | null) => T | Promise<T>,
  opts: { retries?: number } = {},
): Promise<T> {
  const retries = opts.retries ?? 5;
  const s = store(name);

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await s.getWithMetadata(key, { type: 'json' });
    const current = (res?.data ?? null) as T | null;
    const etag = res?.etag;

    const next = await updateFn(current);

    if (etag) {
      // Existing key WITH an etag (production): true compare-and-swap.
      const write = await s.setJSON(key, next, { onlyIfMatch: etag });
      if (write.modified) return next;
      // Lost the race — someone wrote between our read and write. Retry.
    } else if (current === null) {
      // Key is absent: create-only, race-safe in production.
      const write = await s.setJSON(key, next, { onlyIfNew: true });
      if (write.modified) return next;
      // Another writer created it first. Retry (next read picks up its etag).
    } else {
      // Existing key but NO etag returned (local dev sandbox — conditional
      // writes unavailable). We cannot CAS; degrade to last-write-wins so we
      // don't spin forever. Safe for single-user local dev.
      await s.setJSON(key, next);
      return next;
    }

    // Contention: another writer changed the key between our read and write.
    // Jittered backoff, then retry from a fresh read.
    await sleep(backoffMs(attempt));
  }

  throw new Error(
    `casUpdate: exhausted ${retries} retries on ${name}/${key} (write contention)`,
  );
}

function backoffMs(attempt: number): number {
  const base = Math.min(20 * 2 ** attempt, 300); // 20,40,80,160,300,300…
  return base + Math.floor(Math.random() * 20); // + up to 20ms jitter
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
