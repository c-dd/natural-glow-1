// ===========================================================================
// netlify/functions/auth.mts — the session API.
//
//   POST /api/auth/signup   {name,email,password>=8}  -> 201 + Set-Cookie
//                                                        409 EMAIL_EXISTS / 400
//   POST /api/auth/login    {email,password}          -> 200 + Set-Cookie
//                                                        401 INVALID_CREDENTIALS
//                                                        429 LOCKED
//   POST /api/auth/logout                             -> 204 + cookie cleared
//   GET  /api/auth/me                                 -> 200 {user} / 401
//
// (login/logout also answer to the ARCHITECTURE aliases signin/signout.)
//
// Users live in the `users` Blobs store as id/{uuid} + email/{emailLower}
// (netlify/lib/users.mts). Uniqueness is enforced by a pre-read of the email
// index — conditional writes are NOT usable in prod (see the BINDING spike
// verdict), so the residual same-millisecond duplicate-signup race is accepted.
//
// ADMIN_EMAILS role SYNC: on signup, on successful login, AND on /api/auth/me,
// the stored role is reconciled to the allowlist — email ON the list -> 'admin'
// (promote), email NOT on the list -> 'user' (DEMOTE). This is the single source
// of truth for role, so any signup not on ADMIN_EMAILS is always a normal
// account, and a stale admin (e.g. an account created under an email later
// removed from ADMIN_EMAILS) loses access on its next login or /me refresh.
//
// NOTE: the session JWT also carries `role`. An already-issued token keeps its
// old role until it expires (7d) or is refreshed; a demotion therefore takes
// full effect at the NEXT login or /me, when syncRole() reissues the cookie with
// the corrected claim. The response role is always the EFFECTIVE role
// (publicUser()). passwordHash / lockout counters are never serialized.
// ===========================================================================

import { z } from 'zod';
import { json, methodGuard, withErrors, parseJson, HttpError, unauthorized } from '../lib/http.mts';
import {
  hashPassword,
  verifyPassword,
  signSession,
  sessionCookie,
  clearSessionCookie,
  isAdminEmail,
  effectiveRole,
  requireUser,
} from '../lib/auth.mts';
import {
  readUserById,
  readUserByEmail,
  writeUser,
  writeEmailIndex,
  newUserDoc,
  publicUser,
  normalizeEmail,
  type UserDoc,
} from '../lib/users.mts';

// ---- lockout policy: 10 failed attempts in a 15-minute window -> 15-min lock.
const LOCK_THRESHOLD = 10;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const LOCK_DURATION_MS = 15 * 60 * 1000;

const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(200)
  .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: 'Enter a valid email address' });

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(200),
});

// The trailing path segment: signup | login | signin | logout | signout | me.
function actionOf(req: Request): string {
  const path = new URL(req.url).pathname.replace(/\/+$/, '');
  return path.split('/').pop() || '';
}

// The role the stored doc SHOULD carry given the current ADMIN_EMAILS allowlist.
// On the list -> 'admin' (promote); off it -> 'user' (demote). One authority for
// role; applied on signup, login, and /me so promotion AND demotion both persist.
function syncedRole(emailLower: string): 'admin' | 'user' {
  return isAdminEmail(emailLower) ? 'admin' : 'user';
}

async function sessionResponse(user: UserDoc, status: number): Promise<Response> {
  const role = effectiveRole({ role: user.role, email: user.email });
  const token = await signSession({ sub: user.id, role, email: user.email });
  return json({ user: publicUser(user) }, status, { 'Set-Cookie': sessionCookie(token) });
}

async function handleSignup(req: Request): Promise<Response> {
  const { name, email, password } = await parseJson(req, signupSchema);
  const emailLower = normalizeEmail(email);

  // Uniqueness pre-read (mandated fallback; residual race accepted).
  const existing = await readUserByEmail(emailLower);
  if (existing) {
    throw new HttpError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
  }

  const role = syncedRole(emailLower);
  const user = newUserDoc({
    email: emailLower,
    passwordHash: hashPassword(password),
    name: name.trim(),
    role,
  });

  await writeUser(user);
  await writeEmailIndex(emailLower, user.id);

  return sessionResponse(user, 201);
}

async function handleLogin(req: Request): Promise<Response> {
  const { email, password } = await parseJson(req, loginSchema);
  const emailLower = normalizeEmail(email);
  const user = await readUserByEmail(emailLower);
  const now = Date.now();

  // Unknown email — generic 401 (do not reveal which of email/password failed).
  if (!user) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
  }

  // Currently locked out?
  if (user.lockUntil && now < user.lockUntil) {
    throw new HttpError(429, 'LOCKED', 'Too many failed attempts. Please try again in a few minutes.');
  }

  if (!verifyPassword(password, user.passwordHash)) {
    // Advance the failure window on the user doc.
    let failedCount = user.failedCount || 0;
    let windowStart = user.failedWindowStart || 0;
    if (!windowStart || now - windowStart > LOCK_WINDOW_MS) {
      windowStart = now;
      failedCount = 1;
    } else {
      failedCount += 1;
    }
    const lockUntil = failedCount >= LOCK_THRESHOLD ? now + LOCK_DURATION_MS : null;
    await writeUser({ ...user, failedCount, failedWindowStart: windowStart, lockUntil });
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
  }

  // Success: reset counters + SYNC role to ADMIN_EMAILS (promote AND demote).
  // Using syncedRole (not the old promote-only `isAdminEmail ? admin : user.role`)
  // means a stale stored admin whose email is no longer on the list is demoted to
  // 'user' here — persisted to the doc AND carried into the reissued cookie.
  const role = syncedRole(emailLower);
  const updated: UserDoc = {
    ...user,
    role,
    failedCount: 0,
    failedWindowStart: null,
    lockUntil: null,
  };
  await writeUser(updated);
  return sessionResponse(updated, 200);
}

function handleLogout(): Response {
  // Idempotent; clearing a cookie never requires a valid session.
  return new Response(null, {
    status: 204,
    headers: { 'Set-Cookie': clearSessionCookie() },
  });
}

async function handleMe(req: Request): Promise<Response> {
  const claims = await requireUser(req); // throws 401 when unauthenticated
  const user = await readUserById(claims.sub);
  if (!user) throw unauthorized('Session no longer valid');

  // /me re-reads the doc, so it is the natural refresh point to SYNC the role to
  // ADMIN_EMAILS (promote AND demote). If the stored role is stale, persist the
  // corrected role and reissue the cookie so the JWT claim matches — this is how
  // a demotion (email removed from ADMIN_EMAILS) takes effect on session refresh.
  const desired = syncedRole(user.email);
  if (desired !== user.role) {
    const updated: UserDoc = { ...user, role: desired };
    await writeUser(updated);
    return sessionResponse(updated, 200);
  }
  return json({ user: publicUser(user) });
}

export default withErrors(async (req: Request) => {
  const action = actionOf(req);

  switch (action) {
    case 'signup':
      methodGuard(req, ['POST']);
      return handleSignup(req);
    case 'login':
    case 'signin':
      methodGuard(req, ['POST']);
      return handleLogin(req);
    case 'logout':
    case 'signout':
      methodGuard(req, ['POST']);
      return handleLogout();
    case 'me':
      methodGuard(req, ['GET']);
      return handleMe(req);
    default:
      throw new HttpError(404, 'not_found', `Unknown auth endpoint: ${action}`);
  }
});

export const config = { path: '/api/auth/:action' };
