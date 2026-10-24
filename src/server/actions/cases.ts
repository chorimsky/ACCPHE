"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { applications, CASE_TYPES, caseNotes, cases, messages } from "@/db/schema";
import { trySendEmail } from "@/server/email";
import { attempt, fail, ok, parseForm, zs, type ActionResult, type ActionState } from "@/lib/action";
import { CASE_CLOSED, CASE_STAGES } from "@/lib/domain";
import { audit } from "@/server/audit";
import { authorize, officeOf } from "@/server/auth";
import { canAccess } from "@/lib/domain";
import { nextCaseRef } from "@/server/sequence";

const refresh = () => revalidatePath("/portal", "layout");

const schema = z.object({
  type: z.enum(CASE_TYPES),
  subject: zs.text("Subject", 300),
  institution: zs.opt(300),
  party: zs.opt(300),
  partyEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .optional()
    .transform((v) => v ?? "")
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email for the person who submitted the case."),
  applicationId: zs.opt(64),
  details: zs.text("Details", 10_000),
  fromMessage: zs.opt(64),
});

export async function createCase(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const res = await attempt(async () => {
    const user = await authorize("cases");
    const parsed = parseForm(schema, fd);
    if ("error" in parsed) return fail(parsed.error);
    const d = parsed.data;
    const who = officeOf(user);
    if (d.applicationId) {
      const [a] = await db.select({ id: applications.id }).from(applications).where(eq(applications.id, d.applicationId));
      if (!a) return fail("Choose a valid application.");
    }
    const { fromMessage, ...fields } = d;
    const [msg] = fromMessage && canAccess(user.role, "messages") ? await db.select().from(messages).where(and(eq(messages.id, fromMessage), isNull(messages.archivedAt))) : [];
    const ref = await nextCaseRef(d.type);
    const [c] = await db.insert(cases).values({ ...fields, applicationId: d.applicationId || null, ref }).returning();
    if (c.partyEmail) {
      await trySendEmail(
        c.partyEmail,
        `${d.type} received — ${ref}`,
        `Your ${d.type.toLowerCase()} concerning “${d.subject}” has been received by the ACCPHE Standards & Ethics Committee under the reference ${ref}.\n\nThe Committee first assesses whether the matter falls within its jurisdiction and whether sufficient information exists to warrant further review. Where appropriate, the institution or individual concerned is given a fair opportunity to respond. You will be informed of the determination.`,
      );
    }
    await db.insert(caseNotes).values({ caseId: c.id, who, userId: user.id, text: msg ? `${d.type} logged from a website message from ${msg.name} <${msg.email}> (${msg.route}).` : `${d.type} logged.` });
    if (msg) await db.update(messages).set({ read: true, archivedAt: new Date() }).where(eq(messages.id, msg.id));
    await audit({ actorId: user.id, who, action: "case.create", entityType: "case", entityId: c.id, summary: `${d.type} logged: ${ref}` });
    return ok(`${d.type} logged as ${ref}`, { id: c.id });
  });
  if (res.ok) {
    refresh();
    redirect(`/portal/cases/${res.data?.id}?toast=${encodeURIComponent(res.message ?? "")}`);
  }
  return res;
}

export async function advanceCase(id: string): Promise<ActionResult> {
  return attempt(async () => {
    const user = await authorize("cases");
    const [c] = await db.select().from(cases).where(eq(cases.id, id));
    if (!c) return fail("This case no longer exists.");
    if (c.stage >= CASE_CLOSED - 1) return fail("Record the determination to close the case.");
    const moved = await db
      .update(cases)
      .set({ stage: c.stage + 1, updatedAt: new Date() })
      .where(and(eq(cases.id, id), eq(cases.stage, c.stage)))
      .returning({ id: cases.id });
    if (!moved.length) return fail("The case changed while you were viewing it. Reload and try again.");
    const who = officeOf(user);
    const label = CASE_STAGES[c.stage + 1];
    await db.insert(caseNotes).values({ caseId: id, who, userId: user.id, text: `Moved to ${label}.` });
    await audit({ actorId: user.id, who, action: "case.stage", entityType: "case", entityId: id, summary: `${c.ref} moved to ${label}` });
    refresh();
    return ok("Case updated");
  });
}

export async function addCaseNote(id: string, text: string): Promise<ActionResult> {
  return attempt(async () => {
    const user = await authorize("cases");
    const t = text.trim();
    if (!t) return fail("Write a note first.");
    if (t.length > 8000) return fail("The note is too long.");
    const [c] = await db.select({ id: cases.id }).from(cases).where(eq(cases.id, id));
    if (!c) return fail("This case no longer exists.");
    await db.insert(caseNotes).values({ caseId: id, who: officeOf(user), userId: user.id, text: t });
    await db.update(cases).set({ updatedAt: new Date() }).where(eq(cases.id, id));
    refresh();
    return ok("Note added");
  });
}

export async function determineCase(id: string, text: string): Promise<ActionResult> {
  return attempt(async () => {
    const user = await authorize("cases");
    const t = text.trim();
    if (!t) return fail("Record the determination before closing the case.");
    const [c] = await db.select().from(cases).where(eq(cases.id, id));
    if (!c) return fail("This case no longer exists.");
    if (c.stage !== CASE_CLOSED - 1) return fail("The case must be under review before a determination is recorded.");
    const who = officeOf(user);
    await db.update(cases).set({ stage: CASE_CLOSED, determination: t, updatedAt: new Date() }).where(eq(cases.id, id));
    await db.insert(caseNotes).values({ caseId: id, who, userId: user.id, text: `Determination recorded and case closed.${c.partyEmail ? ` Determination sent to ${c.partyEmail}.` : ""}` });
    if (c.partyEmail) {
      await trySendEmail(c.partyEmail, `Determination — ${c.ref}`, `The ACCPHE Standards & Ethics Committee has recorded its determination on “${c.subject}” (${c.ref}):\n\n${t}`);
    }
    await audit({ actorId: user.id, who, action: "case.determine", entityType: "case", entityId: id, summary: `${c.ref} determined and closed` });
    refresh();
    return ok("Determination recorded");
  });
}
