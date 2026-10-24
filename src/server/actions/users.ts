"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { applications, ROLES, users } from "@/db/schema";
import { attempt, fail, ok, parseForm, zs, type ActionResult, type ActionState } from "@/lib/action";
import { ROLE_INFO } from "@/lib/domain";
import { randomToken } from "@/lib/crypto";
import { abs } from "@/lib/site";
import { audit } from "@/server/audit";
import { authorize, hashPassword, issueResetToken, officeOf, revokeUserSessions } from "@/server/auth";
import { emailEnabled, trySendEmail } from "@/server/email";

const refresh = () => revalidatePath("/portal", "layout");

async function admin() {
  const user = await authorize("users");
  return { user, who: officeOf(user) };
}

async function load(id: string) {
  const [u] = await db.select().from(users).where(eq(users.id, id));
  return u;
}

export async function approveUser(id: string, applicationId: string | null): Promise<ActionResult> {
  return attempt(async () => {
    const { user, who } = await admin();
    const u = await load(id);
    if (!u) return fail("This account no longer exists.");
    if (u.status !== "pending") return fail("This request has already been handled.");
    let link: { id: string; ref: string; name: string } | undefined;
    if (u.role === "institution") {
      if (!applicationId) return fail("Link the representative to their institution’s application before approving.");
      [link] = await db.select({ id: applications.id, ref: applications.ref, name: applications.name }).from(applications).where(eq(applications.id, applicationId));
      if (!link) return fail("Choose a valid application.");
    }
    await db
      .update(users)
      .set({ status: "active", applicationId: link?.id ?? null, reviewedBy: user.id, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id));
    await audit({ actorId: user.id, who, action: "user.approve", entityType: "user", entityId: id, summary: `Account approved: ${u.name}${link ? ` (linked to ${link.ref})` : ""}` });
    await trySendEmail(
      u.email,
      "Your ACCPHE Portal account is active",
      `Hello ${u.name},\n\nThe Secretariat has verified your account request. You can now sign in to the ACCPHE Portal as ${ROLE_INFO[u.role].label.toLowerCase()}${link ? ` for ${link.name} (${link.ref})` : ""}.`,
      { label: "Sign in", url: abs("/portal/sign-in") },
    );
    refresh();
    return ok(`Account approved: ${u.name}`);
  });
}

export async function setUserStatus(id: string, status: "active" | "suspended"): Promise<ActionResult> {
  return attempt(async () => {
    const { user, who } = await admin();
    if (id === user.id) return fail("You cannot change the status of your own account.");
    const u = await load(id);
    if (!u) return fail("This account no longer exists.");
    if (status === "active" && u.role === "institution" && !u.applicationId) return fail("Link the representative to an application before reactivating.");
    const declined = u.status === "pending" && status === "suspended";
    await db.update(users).set({ status, reviewedBy: user.id, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, id));
    if (status === "suspended") await revokeUserSessions(id);
    const verb = status === "active" ? "reactivated" : declined ? "declined" : "suspended";
    await audit({ actorId: user.id, who, action: `user.${verb}`, entityType: "user", entityId: id, summary: `Account ${verb}: ${u.name}` });
    if (declined) {
      await trySendEmail(u.email, "Your ACCPHE Portal account request", `Hello ${u.name},\n\nThe Secretariat was unable to verify your account request. If you believe this is an error, please contact the Secretariat through the website.`);
    }
    refresh();
    return ok(`Account ${verb}: ${u.name}`);
  });
}

export async function linkApplication(id: string, applicationId: string): Promise<ActionResult> {
  return attempt(async () => {
    const { user, who } = await admin();
    const u = await load(id);
    if (!u || u.role !== "institution") return fail("Only institution representatives are linked to an application.");
    const [app] = applicationId ? await db.select().from(applications).where(eq(applications.id, applicationId)) : [];
    if (applicationId && !app) return fail("Choose a valid application.");
    await db.update(users).set({ applicationId: app?.id ?? null, updatedAt: new Date() }).where(eq(users.id, id));
    await audit({ actorId: user.id, who, action: "user.link", entityType: "user", entityId: id, summary: app ? `${u.name} linked to ${app.ref}` : `${u.name} unlinked from their application` });
    refresh();
    return ok(app ? `Linked to ${app.ref}` : "Link removed");
  });
}

const inviteSchema = z.object({
  name: zs.text("Full name", 150),
  email: zs.email(),
  position: zs.opt(150),
  org: zs.opt(200),
  role: z.enum(ROLES),
});

/** Create an account for staff, Commission members or reviewers; they choose their own password from the email. */
export async function inviteUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return attempt(async () => {
    const { user, who } = await admin();
    const parsed = parseForm(inviteSchema, fd);
    if ("error" in parsed) return fail(parsed.error);
    const d = parsed.data;
    if (d.role === "institution") return fail("Institution representatives request their own account so their authority can be verified.");
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, d.email));
    if (existing) return fail("An account already exists for this email.");
    const [u] = await db
      .insert(users)
      .values({ ...d, org: d.org || ROLE_INFO[d.role].who, status: "active", passwordHash: await hashPassword(randomToken(24)), reviewedBy: user.id, reviewedAt: new Date() })
      .returning();
    const token = await issueResetToken(u.id);
    await trySendEmail(
      u.email,
      "Your ACCPHE Portal account",
      `Hello ${u.name},\n\nThe Executive Secretariat has created an ACCPHE Portal account for you as ${ROLE_INFO[u.role].label}. Choose a password to activate it. The link expires in 60 minutes; if it has expired, use “Forgot password?” on the sign-in page.`,
      { label: "Choose a password", url: abs(`/portal/reset/${token}`) },
    );
    await audit({ actorId: user.id, who, action: "user.invite", entityType: "user", entityId: u.id, summary: `Account created for ${u.name} (${ROLE_INFO[u.role].label})` });
    refresh();
    return ok(`Account created — ${u.name} has been emailed a link to choose a password.`);
  });
}

export async function setUserRole(id: string, role: string): Promise<ActionResult> {
  return attempt(async () => {
    const { user, who } = await admin();
    if (id === user.id) return fail("You cannot change your own role.");
    if (!ROLES.includes(role as never)) return fail("Unknown role.");
    const u = await load(id);
    if (!u) return fail("This account no longer exists.");
    if (u.role === "institution" || role === "institution") return fail("Institution representatives keep their own account type; create a new account instead.");
    await db.update(users).set({ role: role as (typeof ROLES)[number], updatedAt: new Date() }).where(eq(users.id, id));
    await revokeUserSessions(id);
    await audit({ actorId: user.id, who, action: "user.role", entityType: "user", entityId: id, summary: `${u.name}: role changed from ${ROLE_INFO[u.role].label} to ${ROLE_INFO[role as (typeof ROLES)[number]].label}` });
    refresh();
    return ok(`${u.name} is now ${ROLE_INFO[role as (typeof ROLES)[number]].label}`);
  });
}

/** For someone who lost their authenticator: turns two-step verification off so they can set it up again. */
export async function resetUserMfa(id: string): Promise<ActionResult> {
  return attempt(async () => {
    const { user, who } = await admin();
    const u = await load(id);
    if (!u) return fail("This account no longer exists.");
    await db.update(users).set({ mfaEnabled: false, totpSecret: null, updatedAt: new Date() }).where(eq(users.id, id));
    await revokeUserSessions(id);
    await audit({ actorId: user.id, who, action: "user.mfa_reset", entityType: "user", entityId: id, summary: `Two-step verification reset for ${u.name}` });
    await trySendEmail(u.email, "Two-step verification was reset", `Hello ${u.name},\n\nAn administrator reset two-step verification on your ACCPHE Portal account. Sign in with your password and set it up again from Account settings.\n\nIf you did not ask for this, contact the Executive Secretariat immediately.`);
    refresh();
    return ok(`Two-step verification reset for ${u.name}`);
  });
}

export async function sendPasswordLink(id: string): Promise<ActionResult> {
  return attempt(async () => {
    const { user, who } = await admin();
    const u = await load(id);
    if (!u || u.status !== "active") return fail("Only active accounts can receive a password link.");
    const token = await issueResetToken(u.id);
    await trySendEmail(u.email, "Choose a new ACCPHE Portal password", `Hello ${u.name},\n\nThe Executive Secretariat sent you a link to choose a new password. It expires in 60 minutes and can be used once.`, { label: "Choose a password", url: abs(`/portal/reset/${token}`) });
    if (!emailEnabled()) {
      // Email is not delivered: hand the one-time link to the administrator to pass on.
      await audit({ actorId: user.id, who, action: "user.password_link", entityType: "user", entityId: id, summary: `Password link created for ${u.name} (email delivery off)` });
      return ok(`One-time link for ${u.name} — copy it below and send it to them. It expires in 60 minutes.`, { link: abs(`/portal/reset/${token}`) });
    }
    await audit({ actorId: user.id, who, action: "user.password_link", entityType: "user", entityId: id, summary: `Password link sent to ${u.name}` });
    return ok(`Password link sent to ${u.email}`);
  });
}
