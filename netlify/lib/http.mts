// ===========================================================================
// netlify/lib/http.mts — HTTP helpers for Netlify Functions v2 (.mts).
//
// One error shape for the whole API:
//     { error: { code, message, details? } }
//
// Handlers throw `HttpError` (or let a zod/parse helper throw) and wrap
// themselves with `withErrors()` so every thrown error becomes a clean JSON
// envelope with the right status. No stack traces or internals leak to the
// client.
// ===========================================================================

import type { ZodType } from 'zod';

// ---------------------------------------------------------------------------
// Typed HTTP error. `status` is the HTTP status; `code` is a stable,
// machine-readable string the frontend can switch on; `details` is optional
// structured context (e.g. zod field errors).
// ---------------------------------------------------------------------------
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Convenience constructors for the statuses this API actually uses.
export const badRequest = (msg: string, details?: unknown) =>
  new HttpError(400, 'bad_request', msg, details);
export const unauthorized = (msg = 'Sign in required') =>
  new HttpError(401, 'unauthenticated', msg);
export const forbidden = (msg = 'Not allowed') =>
  new HttpError(403, 'forbidden', msg);
export const notFound = (msg = 'Not found') =>
  new HttpError(404, 'not_found', msg);
export const conflict = (msg: string, details?: unknown) =>
  new HttpError(409, 'conflict', msg, details);
export const payloadTooLarge = (msg: string, details?: unknown) =>
  new HttpError(413, 'payload_too_large', msg, details);

type HeaderInit = Record<string, string>;

// ---------------------------------------------------------------------------
// json(): serialize `data` to a JSON Response. Extra headers (e.g. Set-Cookie)
// merge over the content-type default.
// ---------------------------------------------------------------------------
export function json(data: unknown, status = 200, headers: HeaderInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

// Build the standard error envelope from any thrown value.
export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    const body: { error: { code: string; message: string; details?: unknown } } = {
      error: { code: err.code, message: err.message },
    };
    if (err.details !== undefined) body.error.details = err.details;
    return json(body, err.status);
  }
  // Never leak internals — log server-side, return a generic 500.
  console.error('[http] unhandled error:', err);
  return json(
    { error: { code: 'internal_error', message: 'Something went wrong' } },
    500,
  );
}

// ---------------------------------------------------------------------------
// methodGuard(): throw 405 (with an `Allow`-friendly details list) unless the
// request method is in `allowed`. Handles CORS-free same-origin APIs where we
// only need to reject unexpected verbs.
// ---------------------------------------------------------------------------
export function methodGuard(req: Request, allowed: string[]): void {
  if (!allowed.includes(req.method)) {
    throw new HttpError(405, 'method_not_allowed', `Method ${req.method} not allowed`, {
      allowed,
    });
  }
}

// ---------------------------------------------------------------------------
// parseJson(): read the JSON body and validate it against a zod schema.
// 400s with `validation_failed` + flattened field errors on bad input, or
// `invalid_json` when the body isn't parseable JSON.
// ---------------------------------------------------------------------------
export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, 'invalid_json', 'Request body must be valid JSON');
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    // zod 4: .flatten() -> { formErrors, fieldErrors } (verified against 4.4.3)
    throw new HttpError(400, 'validation_failed', 'Request failed validation', result.error.flatten());
  }
  return result.data;
}

// Validate an already-parsed value (query object, params, etc).
export function parseValue<T>(value: unknown, schema: ZodType<T>): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new HttpError(400, 'validation_failed', 'Input failed validation', result.error.flatten());
  }
  return result.data;
}

// ---------------------------------------------------------------------------
// withErrors(): wrap a v2 handler so any thrown HttpError/Error is converted
// to the JSON envelope instead of a 500 with a stack.
//
//   export default withErrors(async (req) => { ... });
// ---------------------------------------------------------------------------
type Handler = (req: Request, context?: unknown) => Response | Promise<Response>;

export function withErrors(handler: Handler): Handler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
