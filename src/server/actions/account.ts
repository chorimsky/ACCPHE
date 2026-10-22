"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { attempt, fail, ok, parseForm, zs, type ActionResult, type ActionState } from "@/lib/action";
import { audit } from "@/server/audit";
import { authorize, checkTotp, hashPassword, mfaRequiredFor, newTotpSecret, passwordProblem, revokeUserSessions, rotateSession, verifyPassword } from "@/server/auth";

const refresh = () => revalidatePath("/portal", "layout");

const profileSchema = z.object({
  name: zs.text("Display name", 150),
  email: zs.email(),
  notifyAssign: zs.bool(),
  notifyStatus: zs.bool(),
  notifyDigest: zs.bool(),
});

export async function saveProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return attempt(async () => {
    const user = await authorize("account");
    const parsed = parseForm(profileSchema, fd);
    if ("error" in parsed) return fail(parsed.error);
    const d = parsed.data;
    if (d.email !== user.email) {
      const [taken] = await db.select({ id: users.id }).from(users).where(and(eq(users.email, d.email), ne(users.id, user.id)));
      if (taken) return fail("Another account already uses this email.");
      if (!(await verifyPassword(String(fd.get("currentPassword") ?? ""), user.passwordHash))) return fail("Enter your current password to change your email address.");
    }
    await db.update(users).set({ ...d, updatedAt: new Date() }).where(eq(users.id, user.id));
    await audit({ actorId: user.id, who: user.name, action: "user.profile", entityType: "user", entityId: user.id, summary: `${d.name} updated their profile` });
    refresh();
    return ok("Profile saved");
  });
}

export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return attempt(async () => {
    const user = await authorize("account");
    const cur = String(fd.get("currentPassword") ?? "");
    const nw = String(fd.get("newPassword") ?? "");
    if (!cur) return fail("Enter your current password to change it.");
    const p = passwordProblem(nw);
    if (p) return fail(p);
    if (!(await verifyPassword(cur, user.passwordHash))) return fail("Your current password is incorrect.");
    await db.update(users).set({ passwordHash: await hashPassword(nw), updatedAt: new Date() }).where(eq(users.id, user.id));
    await revokeUserSessions(user.id, true);
    await rotateSession(user.id);
    await audit({ actorId: user.id, who: user.name, action: "user.password", entityType: "user", entityId: user.id, summary: `${user.name} changed their password` });
    return ok("Password updated. Other devices have been signed out.");
  });
}

/** Step 1: create a new secret (not active until a code from the app is confirmed). */
export async function startMfa(): Promise<ActionResult> {
  return attempt(async () => {
    const user = await authorize("account");
    if (user.mfaEnabled) return fail("Two-step verification is already on.");
    const { secret, uri } = newTotpSecret(user.email);
    await db.update(users).set({ totpSecret: secret, updatedAt: new Date() }).where(eq(users.id, user.id));
    const QR = await import("qrcode");
    const qr = await QR.toDataURL(uri, { margin: 1, width: 220, color: { dark: "#142B45", light: "#FFFFFF" } });
    return ok("", { secret, qr });
  });
}

export async function confirmMfa(code: string): Promise<ActionResult> {
  return attempt(async () => {
    const user = await authorize("account");
    if (!user.totpSecret || user.mfaEnabled) return fail("Start the setup again.");
    if (!(await checkTotp(user.totpSecret, code))) return fail("That code is not valid. Enter the current 6-digit code from your authenticator app.");
    await db.update(users).set({ mfaEnabled: true, updatedAt: new Date() }).where(eq(users.id, user.id));
    await rotateSession(user.id);
    await audit({ actorId: user.id, who: user.name, action: "user.mfa_on", entityType: "user", entityId: user.id, summary: `${user.name} turned on two-step verification` });
    refresh();
    return ok("Two-step verification is on");
  });
}

export async function disableMfa(password: string): Promise<ActionResult> {
  return attempt(async () => {
    const user = await authorize("account");
    if (mfaRequiredFor(user.role)) return fail("Two-step verification is required for your role.");
    if (!(await verifyPassword(password, user.passwordHash))) return fail("Your password is incorrect.");
    await db.update(users).set({ mfaEnabled: false, totpSecret: null, updatedAt: new Date() }).where(eq(users.id, user.id));
    await audit({ actorId: user.id, who: user.name, action: "user.mfa_off", entityType: "user", entityId: user.id, summary: `${user.name} turned off two-step verification` });
    refresh();
    return ok("Two-step verification is off");
  });
}
