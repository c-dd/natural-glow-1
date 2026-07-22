// ===========================================================================
// netlify/lib/users.mts — user records in the `users` Blobs store.
//
// Data model (per the WS2 build spec + PRODUCTION SPIKE VERDICT in
// docs/ARCHITECTURE.md — conditional writes are NOT usable, so uniqueness is a
// pre-read + last-write-wins with an accepted, documented residual race):
//
//   id/{uuid}          -> full user doc (source of truth; survives email change)
//   email/{emailLower} -> { id } reverse index (login lookup + uniqueness)
//
// `id` is the JWT `sub`. `email` is stored lowercased and also indexed. Lockout
// counters live ON the user doc. Password + lockout fields are NEVER serialized
// to a response — use publicUser() at the API boundary.
// ===========================================================================

import { randomUUID } from 'node:crypto';
import { readJson, writeJson, store } from './blobs.mts';
import { effectiveRole } from './auth.mts';
import type { Role } from './auth.mts';

export interface UserDoc {
  version: number;
  id: string;
  email: string; // lowercased
  passwordHash: string;
  name: string;
  org: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  role: Role;
  createdAt: string;
  // lockout counters (never serialized)
  failedCount: number;
  failedWindowStart: number | null;
  lockUntil: number | null;
}

// Safe projection returned to clients — no passwordHash / lockout fields.
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  org: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  role: Role;
  createdAt: string;
}

const idKey = (id: string) => `id/${id}`;
const emailKey = (emailLower: string) => `email/${emailLower}`;

export function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

export async function readUserById(id: string): Promise<UserDoc | null> {
  if (!id) return null;
  return readJson<UserDoc>('users', idKey(id));
}

export async function readUserByEmail(email: string): Promise<UserDoc | null> {
  const idx = await readJson<{ id: string }>('users', emailKey(normalizeEmail(email)));
  if (!idx || !idx.id) return null;
  return readUserById(idx.id);
}

export async function writeUser(user: UserDoc): Promise<void> {
  // Distinct per-user key (uuid); no shared-blob contention -> plain write is
  // correct even under the last-write-wins fallback.
  await writeJson('users', idKey(user.id), user);
}

export async function writeEmailIndex(emailLower: string, id: string): Promise<void> {
  await writeJson('users', emailKey(emailLower), { id });
}

export async function deleteEmailIndex(emailLower: string): Promise<void> {
  try {
    await store('users').delete(emailKey(emailLower));
  } catch {
    // best-effort; a stale index is reconciled on next write of that email.
  }
}

export function newUserDoc(input: {
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
}): UserDoc {
  return {
    version: 1,
    id: randomUUID(),
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash,
    name: input.name || '',
    org: '',
    address1: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    role: input.role,
    createdAt: new Date().toISOString(),
    failedCount: 0,
    failedWindowStart: null,
    lockUntil: null,
  };
}

// Boundary projection: strips secrets and reflects the EFFECTIVE role (stored
// role OR ADMIN_EMAILS membership) so the client sees the true privilege.
export function publicUser(user: UserDoc): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name || '',
    org: user.org || '',
    address1: user.address1 || '',
    city: user.city || '',
    state: user.state || '',
    zip: user.zip || '',
    country: user.country || '',
    role: effectiveRole({ role: user.role, email: user.email }),
    createdAt: user.createdAt,
  };
}
