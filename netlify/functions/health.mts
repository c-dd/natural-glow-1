// ===========================================================================
// netlify/functions/health.mts — GET /api/health
//
// Liveness probe AND the Blobs conditional-write SPIKE. On each call it runs
// three empirical tests against the Blobs backend (the local sandbox under
// `netlify dev`, or real Blobs in the cloud) and reports exactly what is and
// isn't supported:
//
//   (a) onlyIfNew  — does a second create-only write correctly no-op?
//   (b) onlyIfMatch — does a write with a STALE etag correctly no-op,
//                     while a write with the CURRENT etag succeeds?
//   (c) strong consistency — does a read immediately after a write return the
//                     just-written value (read-after-write)?
//
// casUpdate()/writeIfNew() in netlify/lib/blobs.mts are built on the APIs
// proven here. If a future backend ever fails the spike, `verdict.allSupported`
// flips to false and the fallback strategy in ARCHITECTURE.md applies.
// ===========================================================================

import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';
import { json, methodGuard, withErrors } from '../lib/http.mts';
import { ensureSeeded } from '../lib/seed.mts';

// Installed @netlify/blobs version (verified from node_modules at build time).
const BLOBS_SDK_VERSION = '10.7.9';

// The real conditional-write API names in this SDK version (from the types +
// compiled source): failed preconditions map HTTP 412 -> { modified:false }
// (they do NOT throw); successful writes return { etag, modified:true }.
const CONDITIONAL_WRITE_API = {
  create: "store.setJSON(key, data, { onlyIfNew: true })",
  update: "store.setJSON(key, data, { onlyIfMatch: etag })",
  readEtag: "store.getWithMetadata(key, { type: 'json' }).etag",
  result: "{ etag?: string, modified: boolean }  // modified:false on failed precondition",
  mutuallyExclusive: true, // onlyIfNew and onlyIfMatch cannot be combined
};

async function runSpike() {
  const s = getStore({ name: 'health-spike', consistency: 'strong' });
  const key = `spike-${Date.now()}-${randomUUID()}`;
  const strongKey = `${key}-strong`;

  // ---- (a) onlyIfNew: create-only ----------------------------------------
  const w1 = await s.setJSON(key, { n: 1 }, { onlyIfNew: true }); // expect modified:true
  const w2 = await s.setJSON(key, { n: 2 }, { onlyIfNew: true }); // expect modified:false
  const afterOnlyIfNew = await s.get(key, { type: 'json' }); // expect { n: 1 }
  const onlyIfNew = {
    firstWriteModified: w1.modified, // expect true
    firstWriteReturnedEtag: typeof w1.etag === 'string' && w1.etag.length > 0,
    secondWriteModified: w2.modified, // expect false
    valueUnchangedBySecondWrite: afterOnlyIfNew?.n === 1, // second write must not overwrite
    supported:
      w1.modified === true &&
      w2.modified === false &&
      afterOnlyIfNew?.n === 1,
  };

  // ---- (b) onlyIfMatch: compare-and-swap on etag -------------------------
  const meta = await s.getWithMetadata(key, { type: 'json' });
  const capturedEtag = meta?.etag; // etag of { n: 1 }
  const wMatch = await s.setJSON(key, { n: 3 }, { onlyIfMatch: capturedEtag as string }); // expect modified:true, etag moves forward
  const wStale = await s.setJSON(key, { n: 999 }, { onlyIfMatch: capturedEtag as string }); // expect modified:false (etag now stale)
  const afterStale = await s.get(key, { type: 'json' }); // expect { n: 3 }
  const onlyIfMatch = {
    getWithMetadataReturnedEtag: typeof capturedEtag === 'string' && capturedEtag.length > 0,
    matchingEtagWriteModified: wMatch.modified, // expect true
    staleEtagWriteModified: wStale.modified, // expect false
    valueUnchangedByStaleWrite: afterStale?.n === 3, // stale write must not overwrite
    supported:
      typeof capturedEtag === 'string' &&
      wMatch.modified === true &&
      wStale.modified === false &&
      afterStale?.n === 3,
  };

  // ---- (c) strong consistency: read-after-write --------------------------
  const marker = `v-${randomUUID()}`;
  await s.setJSON(strongKey, { marker });
  const readBack = await s.get(strongKey, { type: 'json' });
  const strongConsistency = {
    wrote: marker,
    readBack: readBack?.marker ?? null,
    readAfterWriteHolds: readBack?.marker === marker,
    supported: readBack?.marker === marker,
  };

  // ---- cleanup (best effort) ---------------------------------------------
  await Promise.allSettled([s.delete(key), s.delete(strongKey)]);

  const allSupported =
    onlyIfNew.supported && onlyIfMatch.supported && strongConsistency.supported;

  return {
    onlyIfNew,
    onlyIfMatch,
    strongConsistency,
    verdict: {
      allSupported,
      // If false here under `netlify dev`, the local sandbox does not honor
      // conditional writes — production Blobs still does; see ARCHITECTURE.md.
      conditionalWritesUsable: onlyIfNew.supported && onlyIfMatch.supported,
    },
  };
}

export default withErrors(async (req: Request) => {
  methodGuard(req, ['GET']);

  // Exercise the idempotent seed path on every health check.
  let seed: unknown;
  let seedError: string | null = null;
  try {
    seed = await ensureSeeded();
  } catch (err) {
    seedError = err instanceof Error ? err.message : String(err);
  }

  // Run the spike; capture (don't swallow) any failure so /api/health still
  // answers and surfaces the problem.
  let spike: unknown;
  let spikeError: string | null = null;
  try {
    spike = await runSpike();
  } catch (err) {
    spikeError = err instanceof Error ? err.message : String(err);
  }

  return json({
    ok: true,
    service: 'natural-glow-backend',
    time: new Date().toISOString(),
    node: process.version,
    seed,
    seedError,
    blobs: {
      sdkVersion: BLOBS_SDK_VERSION,
      conditionalWriteApi: CONDITIONAL_WRITE_API,
      spike,
      spikeError,
    },
  });
});

export const config = { path: '/api/health' };
