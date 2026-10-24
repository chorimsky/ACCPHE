"use server";

import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { applications, authTokens, messages, users } from "@/db/schema";
import { attempt, fail, ok, parseForm, zs, type ActionState } from "@/lib/action";
import { homeFor, SELF_SERVICE_ROLES } from "@/lib/domain";
import { abs } from "@/lib/site";
import { audit } from "@/server/audit";
import {
  activateSession,
  burnPasswordCheck,
  createSession,
  destroySession,
  findResetToken,
  hashPassword,
  issueResetToken,
  mfaRequiredFor,
  passwordProblem,
  pendingUser,
  revokeUserSessions,
  verifyPassword,
  verifyUserTotp,
} from "@/server/auth";
import { trySendEmail } from "@/server/email";
import { notifyModule } from "@/server/notify";
import { clearLimit, clientIp, hit, isOverLimit, overIpLimit } from "@/server/security/rate-limit";

/** Only same-site portal paths are accepted as a post-sign-in destination. */
function safeNext(next: unknown): string | null {
  return typeof next === "string" && /^\/portal(\/|$)/.test(next) && !next.startsWith("//") ? next : null;
}

const signInSchema = z.object({ email: zs.email(), password: z.string().min(1, "Enter your password.").max(200), next: z.string().optional() });

export async function signIn(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const res = await attempt(async () => {
    const parsed = parseForm(signInSchema, fd);
    if ("error" in parsed) return fail("Enter your email and password.");
    const { email, password } = parsed.data;
    // Only failed attempts count, so colleagues signing in from one office network are never locked out.
    const ipKey = `ip:signin:${await clientIp()}`;
    if (await isOverLimit(ipKey, 30)) return fail("Too many failed sign-in attempts from this network. Wait a few minutes and try again.");
    const lockKey = `signin:${email}`;
    if (await isOverLimit(lockKey, 8)) return fail("This account is temporarily locked after repeated failed attempts. Try again in 15 minutes or reset your password.");
    const failed = async () => {
      await hit(ipKey, 30, 15 * 60_000);
      await hit(lockKey, 8, 15 * 60_000);
      return fail("The email or password is incorrect.");
    };

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      await burnPasswordCheck(password);
      return failed();
    }
    if (!(await verifyPassword(password, user.passwordHash))) return failed();
    if (user.status === "pending") return fail("Your account request is awaiting verification by the Secretariat. You will receive an email when it is active.");
    if (user.status === "suspended") return fail("This account is not active. Contact the Secretariat if you believe this is an error.");
    await clearLimit(lockKey);

    if (user.mfaEnabled && user.totpSecret) {
      await createSession(user.id, "pending_mfa");
      return ok("mfa", { next: safeNext(parsed.data.next) ?? "" });
    }
    await createSession(user.id, "active");
    await audit({ actorId: user.id, who: user.name, action: "auth.signin", entityType: "user", entityId: user.id, summary: `${user.name} signed in` });
    // Straight to Account settings when something must be done there first (a second redirect from the portal layout
    // during the post-sign-in navigation would leave the page blank).
    const dest = user.mustChangePassword ? "/portal/account?setup=password" : mfaRequiredFor(user.role) ? "/portal/account?setup=mfa" : (safeNext(parsed.data.next) ?? homeFor(user.role));
    return ok("signed-in", { next: dest });
  });
  if (res.ok && res.message === "mfa") redirect(`/portal/verify${res.data?.next ? `?next=${encodeURIComponent(String(res.data.next))}` : ""}`);
  if (res.ok) redirect(String(res.data?.next));
  return res;
}

export async function verifyMfa(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const res = await attempt(async () => {
    const user = await pendingUser();
    if (!user) return fail("Your sign-in has expired. Start again.");
    if ((await hit(`mfa:${user.id}`, 6, 10 * 60_000)).limited) {
      await destroySession();
      return fail("Too many incorrect codes. Sign in again.");
    }
    if (!(await verifyUserTotp(user, String(fd.get("code") ?? "")))) return fail("That code is not valid. Enter the current 6-digit code from your authenticator app.");
    await clearLimit(`mfa:${user.id}`);
    await activateSession();
    await audit({ actorId: user.id, who: user.name, action: "auth.signin", entityType: "user", entityId: user.id, summary: `${user.name} signed in with two-step verification` });
    return ok("ok", { next: user.mustChangePassword ? "/portal/account?setup=password" : (safeNext(fd.get("next")) ?? homeFor(user.role)) });
  });
  if (res.ok) redirect(String(res.data?.next));
  return res;
}

export async function signOut() {
  await destroySession();
  redirect("/portal/sign-in?signedOut=1");
}

const registerSchema = z
  .object({
    type: z.enum(SELF_SERVICE_ROLES, { error: "Choose an account type." }),
    name: zs.text("Full name", 150),
    position: zs.text("Position", 150),
    org: zs.text("Institution or area of expertise", 200),
    ref: zs.opt(40),
    email: zs.email("Official email"),
    password: z.string().max(200),
    confirm: z.string().max(200),
    agree: z.literal("on", { error: "Please accept the Terms of Use and Privacy Notice." }),
  })
  .superRefine((d, ctx) => {
    const p = passwordProblem(d.password);
    if (p) ctx.addIssue({ code: "custom", message: p });
    else if (d.password !== d.confirm) ctx.addIssue({ code: "custom", message: "Passwords do not match." });
  });

export async function requestAccount(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return attempt(async () => {
    const parsed = parseForm(registerSchema, fd);
    if ("error" in parsed) return fail(parsed.error);
    const d = parsed.data;
    if (await overIpLimit("register", 5, 60 * 60_000)) return fail("Too many account requests from this connection. Try again later.");
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, d.email));
    if (existing) return fail("An account or account request already exists for this email. Sign in, or reset your password.");

    const ref = d.type === "institution" ? d.ref.toUpperCase() : "";
    const [linked] = ref ? await db.select({ id: applications.id, ref: applications.ref }).from(applications).where(eq(applications.ref, ref)) : [];
    const [u] = await db
      .insert(users)
      .values({ email: d.email, name: d.name, position: d.position, org: d.org, role: d.type, status: "pending", passwordHash: await hashPassword(d.password), requestedRef: ref })
      .returning();
    const label = d.type === "institution" ? "Institution representative" : "Reviewer";
    await db.insert(messages).values({
      name: d.name,
      org: d.org,
      email: d.email,
      route: "Account request",
      body: `${label} account requested by ${d.name}, ${d.position}.${linked ? ` Linked to inquiry ${linked.ref}.` : ref ? ` Quoted reference ${ref} (not found).` : ""} Please verify identity and authority before activation.`,
    });
    await audit({ actorId: u.id, who: "Website", action: "user.request", entityType: "user", entityId: u.id, summary: `Account requested: ${d.name}` });
    await notifyModule("users", { subject: `Account request: ${d.name} (${label})`, text: `${d.name}, ${d.position} — ${d.org} — requested a ${label.toLowerCase()} account.`, link: "/portal/users" });
    const first = d.name.split(/\s+/)[0];
    return ok(
      `Thank you, ${first}. The Secretariat will verify your identity${d.type === "institution" ? " and authority to act for your institution" : " and expertise"}${linked ? ` (linked to ${linked.ref})` : ""}, then email you at ${d.email} when your account is active.`,
    );
  });
}

export async function forgotPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return attempt(async () => {
    const parsed = parseForm(z.object({ email: zs.email() }), fd);
    if ("error" in parsed) return fail(parsed.error);
    const { email } = parsed.data;
    if (await overIpLimit("forgot", 10, 60 * 60_000)) return fail("Too many requests. Try again later.");
    // Same answer whether or not the account exists.
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (user && user.status === "active" && !(await hit(`forgot:${user.id}`, 3, 60 * 60_000)).limited) {
      const token = await issueResetToken(user.id);
      await trySendEmail(
        user.email,
        "Reset your ACCPHE Portal password",
        `Hello ${user.name},\n\nA password reset was requested for your ACCPHE Portal account. The link below expires in 60 minutes and can be used once.\n\nIf you did not request this, you can ignore this email.`,
        { label: "Choose a new password", url: abs(`/portal/reset/${token}`) },
      );
    }
    return ok(email);
  });
}

const resetSchema = z
  .object({ token: z.string().min(10), password: z.string().max(200), confirm: z.string().max(200) })
  .superRefine((d, ctx) => {
    const p = passwordProblem(d.password);
    if (p) ctx.addIssue({ code: "custom", message: p });
    else if (d.password !== d.confirm) ctx.addIssue({ code: "custom", message: "Passwords do not match." });
  });

export async function resetPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const res = await attempt(async () => {
    const parsed = parseForm(resetSchema, fd);
    if ("error" in parsed) return fail(parsed.error);
    const tok = await findResetToken(parsed.data.token);
    if (!tok) return fail("This link has expired or was already used. Request a new one.");
    const used = await db
      .update(authTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(authTokens.id, tok.id), isNull(authTokens.usedAt)))
      .returning({ id: authTokens.id });
    if (!used.length) return fail("This link was already used. Request a new one.");
    const [user] = await db.select().from(users).where(eq(users.id, tok.userId));
    if (!user || user.status === "suspended") return fail("This account is not active.");
    await db.update(users).set({ passwordHash: await hashPassword(parsed.data.password), mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, user.id));
    await revokeUserSessions(user.id);
    await audit({ actorId: user.id, who: user.name, action: "user.password_reset", entityType: "user", entityId: user.id, summary: `${user.name} reset their password` });
    return ok();
  });
  if (res.ok) redirect("/portal/sign-in?reset=1");
  return res;
}
