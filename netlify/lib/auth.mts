// ===========================================================================
// netlify/lib/auth.mts — password hashing, session JWTs, cookies, guards.
//
// - Passwords: scrypt (node:crypto), self-describing string format so the
//   cost parameters travel with the hash. Constant-time verify.
// - Sessions: JWT (jose, HS256), 7-day TTL, secret from AUTH_JWT_SECRET.
//   Claims: { sub, role, email }.
// - Cookie: ng_session; HttpOnly; Secure; SameSite=Lax; Path=/.
// - Guards: requireUser / requireAdmin throw typed 401/403 (HttpError).
//
// Admin is bootstrapped by ADMIN_EMAILS (comma-separated allowlist): any user
// whose email is on that list is treated as an admin even if their stored
// role is 'user'. This lets the site owner grant admin without a migration.
// ===========================================================================

import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { HttpError, unauthorized, forbidden } from './http.mts';

// ---------------------------------------------------------------------------
// Password hashing — scrypt
// Format: scrypt$N$r$p$saltB64$hashB64
// N=16384 (2^14), r=8, p=1  ->  ~16MB work memory, under node's 32MB default.
// ---------------------------------------------------------------------------
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 32;
const SCRYPT_SALT_BYTES = 16;

export function hashPassword(password: string): string {
  const salt = randomBytes(SCRYPT_SALT_BYTES);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
    const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(hashB64, 'base64');
    const actual = scryptSync(password, salt, expected.length, {
      N: Number(nStr),
      r: Number(rStr),
      p: Number(pStr),
      // guard against a maliciously large N in a stored hash
      maxmem: 64 * 1024 * 1024,
    });
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Session JWT — jose, HS256
// ---------------------------------------------------------------------------
export type Role = 'user' | 'admin';

export interface SessionClaims {
  sub: string; // stable user id
  role: Role;
  email: string;
}

const SESSION_TTL = '7d';

function jwtSecret(): Uint8Array {
  const s = process.env.AUTH_JWT_SECRET;
  if (!s || s.length < 16) {
    // Misconfiguration, not a client error.
    throw new HttpError(500, 'server_misconfigured', 'AUTH_JWT_SECRET is not set');
  }
  return new TextEncoder().encode(s);
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role, email: claims.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(jwtSecret());
}

export async function verifySession(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, jwtSecret(), { algorithms: ['HS256'] });
  const role: Role = payload.role === 'admin' ? 'admin' : 'user';
  return {
    sub: String(payload.sub ?? ''),
    role,
    email: String(payload.email ?? ''),
  };
}

// ---------------------------------------------------------------------------
// Cookie helpers — ng_session
// ---------------------------------------------------------------------------
export const SESSION_COOKIE = 'ng_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // seconds, matches JWT TTL

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export function readSessionCookie(req: Request): string | null {
  const header = req.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (name === SESSION_COOKIE) return part.slice(eq + 1).trim();
  }
  return null;
}

// ---------------------------------------------------------------------------
// Admin allowlist — ADMIN_EMAILS (comma-separated), case-insensitive.
// ---------------------------------------------------------------------------
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  const target = String(email || '').trim().toLowerCase();
  return target.length > 0 && adminEmails().includes(target);
}

// Effective role: stored role OR membership in ADMIN_EMAILS.
export function effectiveRole(claims: Pick<SessionClaims, 'role' | 'email'>): Role {
  return claims.role === 'admin' || isAdminEmail(claims.email) ? 'admin' : 'user';
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------
export async function requireUser(req: Request): Promise<SessionClaims> {
  const token = readSessionCookie(req);
  if (!token) throw unauthorized('Sign in required');
  try {
    return await verifySession(token);
  } catch (err) {
    if (err instanceof HttpError) throw err; // e.g. server_misconfigured
    throw unauthorized('Invalid or expired session');
  }
}

export async function requireAdmin(req: Request): Promise<SessionClaims> {
  const claims = await requireUser(req);
  if (effectiveRole(claims) !== 'admin') {
    throw forbidden('Admin access required');
  }
  // Normalize role to 'admin' for downstream code.
  return { ...claims, role: 'admin' };
}
