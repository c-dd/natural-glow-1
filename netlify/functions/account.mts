// ===========================================================================
// netlify/functions/account.mts — the signed-in user's own profile.
//
//   GET   /api/account   -> 200 {user}                (read profile)
//   PATCH /api/account   -> 200 {user}                (update profile)
//                           401 unauthenticated       (no/expired session)
//                           401 BAD_CURRENT_PASSWORD   (email/password change)
//                           409 EMAIL_EXISTS           (email already taken)
//                           400 validation_failed
//
// Profile fields update freely. An EMAIL change requires the current password
// AND moves the email/{emailLower} index (pre-read for uniqueness; residual
// race accepted per the spike verdict). A PASSWORD change requires the current
// password. When email or effective role changes, a fresh session cookie is
// issued so the JWT claims stay in sync. passwordHash is never serialized.
// ===========================================================================

import { z } from 'zod';
import { json, methodGuard, withErrors, parseJson, HttpError } from '../lib/http.mts';
import {
  hashPassword,
  verifyPassword,
  signSession,
  sessionCookie,
  effectiveRole,
  isAdminEmail,
  requireUser,
} from '../lib/auth.mts';
import {
  readUserById,
  readUserByEmail,
  writeUser,
  writeEmailIndex,
  deleteEmailIndex,
  publicUser,
  normalizeEmail,
  type UserDoc,
} from '../lib/users.mts';

const patchSchema = z.object({
  name: z.string().trim().max(120).optional(),
  org: z.string().trim().max(160).optional(),
  address1: z.string().trim().max(200).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  zip: z.string().trim().max(40).optional(),
  country: z.string().trim().max(120).optional(),
  email: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: 'Enter a valid email address' })
    .optional(),
  currentPassword: z.string().max(200).optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(200).optional(),
});

const PROFILE_FIELDS = ['name', 'org', 'address1', 'city', 'state', 'zip', 'country'] as const;

export default withErrors(async (req: Request) => {
  methodGuard(req, ['GET', 'PATCH']);

  const claims = await requireUser(req);
  const user = await readUserById(claims.sub);
  if (!user) throw new HttpError(401, 'unauthenticated', 'Session no longer valid');

  if (req.method === 'GET') {
    return json({ user: publicUser(user) });
  }

  const body = await parseJson(req, patchSchema);
  const next: UserDoc = { ...user };
  let reissueCookie = false;

  // --- password change (needs current password) -----------------------------
  if (body.newPassword !== undefined) {
    if (!body.currentPassword || !verifyPassword(body.currentPassword, user.passwordHash)) {
      throw new HttpError(401, 'BAD_CURRENT_PASSWORD', 'Your current password is incorrect');
    }
    next.passwordHash = hashPassword(body.newPassword);
  }

  // --- email change (needs current password + index move) --------------------
  let oldEmail: string | null = null;
  let newEmail: string | null = null;
  if (body.email !== undefined) {
    const candidate = normalizeEmail(body.email);
    if (candidate !== user.email) {
      if (!body.currentPassword || !verifyPassword(body.currentPassword, user.passwordHash)) {
        throw new HttpError(401, 'BAD_CURRENT_PASSWORD', 'Enter your current password to change your email');
      }
      const clash = await readUserByEmail(candidate);
      if (clash && clash.id !== user.id) {
        throw new HttpError(409, 'EMAIL_EXISTS', 'That email is already in use');
      }
      oldEmail = user.email;
      newEmail = candidate;
      next.email = candidate;
      reissueCookie = true;
    }
  }

  // --- profile fields --------------------------------------------------------
  for (const f of PROFILE_FIELDS) {
    if (body[f] !== undefined) next[f] = body[f] as string;
  }

  // --- keep the stored role aligned with ADMIN_EMAILS (email may have changed)
  const desiredRole = isAdminEmail(next.email) ? 'admin' : next.role;
  if (desiredRole !== next.role) {
    next.role = desiredRole;
    reissueCookie = true;
  }

  // --- persist. Write the doc first, then move the email index so a lookup by
  //     the new email always resolves to a doc that already carries it.
  await writeUser(next);
  if (newEmail) {
    await writeEmailIndex(newEmail, next.id);
    if (oldEmail && oldEmail !== newEmail) await deleteEmailIndex(oldEmail);
  }

  const headers: Record<string, string> = {};
  if (reissueCookie) {
    const role = effectiveRole({ role: next.role, email: next.email });
    const token = await signSession({ sub: next.id, role, email: next.email });
    headers['Set-Cookie'] = sessionCookie(token);
  }
  return json({ user: publicUser(next) }, 200, headers);
});

export const config = { path: '/api/account' };
