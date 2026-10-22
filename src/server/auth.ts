import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { and, eq, gt, lt, lte } from "drizzle-orm";
import { generateSecret, generateURI, verify as verifyOtp } from "otplib";
import { db } from "@/db";
import { authTokens, sessions, users, type Role } from "@/db/schema";
import { canAccess, homeFor, ROLE_INFO, type ModuleKey } from "@/lib/domain";
import { hashToken, randomToken } from "@/lib/crypto";
import { UserError } from "@/lib/action";

export const SESSION_COOKIE = "accphe_session";
const SESSION_TTL = 12 * 3600_000; // portal sessions last a working day
const PENDING_TTL = 10 * 60_000;

export type User = typeof users.$inferSelect;

/* ─────────── Passwords ─────────── */

export const hashPassword = (pw: string) => bcrypt.hash(pw, 11);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

/** A precomputed hash so sign-in takes the same time whether or not the email exists. */
const DUMMY_HASH = "$2b$11$yhsjlqq.yX3oH9YVoNnDa.okU1.C.TKRZt.IfXJOrM9mv5N5/y/s6";
export const burnPasswordCheck = (pw: string) => bcrypt.compare(pw, DUMMY_HASH).catch(() => false);

export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return "Password must be at least 10 characters.";
  if (pw.length > 200) return "Password is too long.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Use a mix of letters and numbers.";
  return null;
}

/** Staff, reviewers and Commission members must use two-step verification when REQUIRE_STAFF_MFA is on. */
export const mfaRequiredFor = (role: Role) => process.env.REQUIRE_STAFF_MFA === "1" && role !== "institution";

/* ─────────── Sessions ─────────── */

async function setCookie(value: string, expires: Date) {
  (await cookies()).set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

async function clientMeta() {
  const h = await headers();
  return {
    userAgent: h.get("user-agent")?.slice(0, 200) ?? null,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) || h.get("x-real-ip") || null,
  };
}

/** Start a session with a fresh random id (a browser-supplied id is never reused). */
export async function createSession(userId: string, stage: "pending_mfa" | "active") {
  const jar = await cookies();
  const previous = jar.get(SESSION_COOKIE)?.value;
  if (previous) await db.delete(sessions).where(eq(sessions.id, hashToken(previous)));
  await db.delete(sessions).where(and(eq(sessions.userId, userId), lte(sessions.expiresAt, new Date())));
  const raw = randomToken(32);
  const expiresAt = new Date(Date.now() + (stage === "active" ? SESSION_TTL : PENDING_TTL));
  await db.insert(sessions).values({ id: hashToken(raw), userId, stage, expiresAt, ...(await clientMeta()) });
  await setCookie(raw, expiresAt);
  if (stage === "active") await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
}

const readSession = cache(async () => {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [row] = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(raw)), gt(sessions.expiresAt, new Date())));
  // Only active accounts keep access: suspending an account signs it out on the next request.
  if (!row || row.user.status !== "active") return null;
  return row;
});

/** Promote the pending session after two-step verification (the id is rotated). */
export async function activateSession() {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) redirect("/portal/sign-in?expired=1");
  const [old] = await db
    .delete(sessions)
    .where(and(eq(sessions.id, hashToken(raw)), eq(sessions.stage, "pending_mfa"), gt(sessions.expiresAt, new Date())))
    .returning();
  if (!old) redirect("/portal/sign-in?expired=1");
  await createSession(old.userId, "active");
}

/** Re-issue the current session under a new id after a security change. */
export async function rotateSession(userId: string) {
  await createSession(userId, "active");
}

export async function revokeUserSessions(userId: string, exceptCurrent = false) {
  if (!exceptCurrent) {
    await db.delete(sessions).where(eq(sessions.userId, userId));
    return;
  }
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  const keep = raw ? hashToken(raw) : "";
  const all = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
  for (const s of all) if (s.id !== keep) await db.delete(sessions).where(eq(sessions.id, s.id));
}

export async function destroySession() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) await db.delete(sessions).where(eq(sessions.id, hashToken(raw)));
  jar.delete(SESSION_COOKIE);
}

/** Fully signed-in user, or null. Cached per request. */
export const currentUser = cache(async (): Promise<User | null> => {
  const s = await readSession();
  return s && s.session.stage === "active" ? s.user : null;
});

/** User who passed the password step but not yet two-step verification. */
export const pendingUser = cache(async (): Promise<User | null> => {
  const s = await readSession();
  return s && s.session.stage === "pending_mfa" ? s.user : null;
});

/** Guard for pages: redirects to sign-in, or to the user's own home when the module is not theirs. */
export async function requireModule(mod: ModuleKey): Promise<User> {
  const user = await currentUser();
  if (!user) {
    const next = (await headers()).get("x-accphe-path");
    redirect(next ? `/portal/sign-in?next=${encodeURIComponent(next)}` : "/portal/sign-in");
  }
  if (!canAccess(user.role, mod)) redirect(homeFor(user.role));
  return user;
}

/** Guard for server actions: throws instead of redirecting so the form shows the message. */
export async function authorize(mod: ModuleKey): Promise<User> {
  const user = await currentUser();
  if (!user) throw new UserError("Your session has ended. Sign in again to continue.");
  if (!canAccess(user.role, mod)) throw new UserError("You do not have access to this module.");
  return user;
}

/** Office label recorded in notes and the audit log. */
export function officeOf(user: Pick<User, "role" | "name" | "org">): string {
  if (user.role === "institution") return user.org || "Institution";
  if (user.role === "reviewer" || user.role === "commission") return user.name;
  return ROLE_INFO[user.role].who;
}

/* ─────────── Password reset tokens ─────────── */

const RESET_TTL = 60 * 60_000;

export async function issueResetToken(userId: string): Promise<string> {
  await db.delete(authTokens).where(and(eq(authTokens.userId, userId), eq(authTokens.purpose, "password_reset")));
  const token = randomToken(32);
  await db.insert(authTokens).values({ userId, purpose: "password_reset", tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL) });
  return token;
}

export async function findResetToken(token: string) {
  const [row] = await db
    .select()
    .from(authTokens)
    .where(and(eq(authTokens.purpose, "password_reset"), eq(authTokens.tokenHash, hashToken(token)), gt(authTokens.expiresAt, new Date())));
  return row && !row.usedAt ? row : null;
}

/* ─────────── Two-step verification (TOTP) ─────────── */

const TOTP_REUSE_MS = 3 * 60_000;

export function newTotpSecret(email: string) {
  const secret = generateSecret();
  return { secret, uri: generateURI({ issuer: "ACCPHE Portal", label: email, secret }) };
}

export async function checkTotp(secret: string, code: string) {
  return (await verifyOtp({ secret, token: code.replace(/\s/g, ""), epochTolerance: 30 })).valid;
}

/** Verify a sign-in code; each code is accepted once. */
export async function verifyUserTotp(user: User, code: string): Promise<boolean> {
  if (!user.totpSecret) return false;
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean) || !(await checkTotp(user.totpSecret, clean))) return false;
  const marker = hashToken(`totp:${user.id}:${clean}`);
  const [seen] = await db
    .select({ id: authTokens.id })
    .from(authTokens)
    .where(and(eq(authTokens.userId, user.id), eq(authTokens.purpose, "totp_used"), eq(authTokens.tokenHash, marker), gt(authTokens.expiresAt, new Date())));
  if (seen) return false;
  await db.delete(authTokens).where(and(eq(authTokens.userId, user.id), eq(authTokens.purpose, "totp_used"), lt(authTokens.expiresAt, new Date())));
  await db.insert(authTokens).values({ userId: user.id, purpose: "totp_used", tokenHash: marker, expiresAt: new Date(Date.now() + TOTP_REUSE_MS), usedAt: new Date() });
  return true;
}
