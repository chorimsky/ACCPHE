"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { applications, PROGRAM_AWARDS, programRecordEvents, programRecords, RECORD_STATUS } from "@/db/schema";
import { isoDay } from "@/lib/format";
import { attempt, fail, ok, parseForm, zs, type ActionResult, type ActionState } from "@/lib/action";
import { audit } from "@/server/audit";
import { authorize, officeOf } from "@/server/auth";
import { notifyInstitution } from "@/server/notify";
import { nextProgramVerification } from "@/server/sequence";
import { uniqueProgramSlug } from "@/server/services/applications";

/** Program records in the public directory of approved programs (Directory records module, "Programs" tab). */

const refresh = () => {
  revalidatePath("/portal", "layout");
  revalidatePath("/directory", "layout");
  revalidatePath("/accreditation/programs");
};

const LIST = "/portal/directory?kind=programs";

const schema = z.object({
  id: z.string().optional(),
  title: zs.text("Program title", 200),
  provider: zs.text("Education provider", 200),
  country: zs.text("Country", 100),
  category: zs.opt(200),
  award: z.enum(PROGRAM_AWARDS),
  effective: zs.date(),
  review: zs.date(),
  scope: zs.opt(300),
  conditions: zs.opt(2000),
  status: z.enum(RECORD_STATUS),
  verified: zs.bool(),
  changeNote: zs.opt(500),
  intent: z.enum(["save", "publish"]),
});

const isPublic = (r: { status: string; verified: boolean }) => r.status === "Published" || (r.verified && ["Suspended", "Withdrawn", "Expired"].includes(r.status));

/** Public history: an entry when a record becomes public, and whenever a public record changes status or award. */
async function logEvent(programId: string, prev: { status: string; award: string; verified: boolean } | undefined, next: { status: string; award: string; verified: boolean; effective: string }, note = "") {
  if (!isPublic(next)) return;
  if (prev && isPublic(prev) && prev.status === next.status && prev.award === next.award) return;
  const first = !prev || !isPublic(prev);
  await db.insert(programRecordEvents).values({
    programId,
    status: next.status as (typeof RECORD_STATUS)[number],
    award: next.award as (typeof PROGRAM_AWARDS)[number],
    effective: first && next.status === "Published" && next.effective ? next.effective : isoDay(),
    note: note.slice(0, 500),
  });
}

async function tellProvider(applicationId: string | null, title: string, status: string, verification: string) {
  if (!applicationId) return;
  const [app] = await db.select().from(applications).where(eq(applications.id, applicationId));
  if (app)
    await notifyInstitution(
      app,
      {
        subject: `${app.ref}: program record ${status.toLowerCase()}`,
        text:
          status === "Published"
            ? `The public record for “${title}” is now published in the ACCPHE directory of approved programs, with the verification number ${verification}. The accreditation applies only to this program, not to the provider or its other offerings.`
            : `The public record for “${title}” (${verification}) is now ${status}.`,
      },
      "status",
    );
}

export async function saveProgramRecord(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const res = await attempt(async () => {
    const user = await authorize("directory");
    const parsed = parseForm(schema, fd);
    if ("error" in parsed) return fail(parsed.error);
    const d = parsed.data;
    const status = d.intent === "publish" ? "Published" : d.status;
    if (status !== "Draft" && !d.verified) return fail("Confirm the formal decision has been verified before publishing.");
    if (status === "Published" && !d.effective) return fail("An effective date is required to publish.");
    if (status === "Published" && !d.review) return fail("A validity end date is required to publish.");
    if (d.review && d.effective && d.review < d.effective) return fail("The validity end date must be after the effective date.");

    const who = officeOf(user);
    const t = new Date();
    const existing = d.id ? (await db.select().from(programRecords).where(eq(programRecords.id, d.id)))[0] : undefined;
    if (d.id && !existing) return fail("This record no longer exists.");
    const values = {
      title: d.title,
      provider: d.provider,
      country: d.country,
      category: d.category,
      award: d.award,
      effective: d.effective,
      review: d.review,
      scope: d.scope,
      conditions: d.conditions,
      status,
      verified: d.verified,
      updatedAt: t,
      slug: existing && existing.title === d.title && existing.provider === d.provider ? existing.slug : await uniqueProgramSlug(d.title, d.provider, existing?.id),
      publishedAt: status === "Published" ? (existing?.publishedAt ?? t) : (existing?.publishedAt ?? null),
    };
    let id = existing?.id;
    let verification = existing?.verification ?? "";
    if (existing) await db.update(programRecords).set(values).where(eq(programRecords.id, existing.id));
    else {
      verification = await nextProgramVerification();
      id = (await db.insert(programRecords).values({ ...values, verification }).returning({ id: programRecords.id }))[0].id;
    }

    await logEvent(id!, existing, { status, award: d.award, verified: d.verified, effective: d.effective }, d.changeNote);
    await audit({ actorId: user.id, who, action: existing ? "program.update" : "program.create", entityType: "program", entityId: id, summary: `Program record ${existing ? "updated" : "created"}: ${d.title} — ${d.provider} (${status}, ${verification})` });
    if (existing && existing.status !== status && status !== "Draft") await tellProvider(existing.applicationId, d.title, status, verification);
    return ok(status === "Published" ? `Published to the directory of approved programs (${verification})` : "Program record saved");
  });
  if (res.ok) {
    refresh();
    redirect(`${LIST}&toast=${encodeURIComponent(res.message ?? "Saved")}`);
  }
  return res;
}

export async function toggleProgramPublish(id: string): Promise<ActionResult> {
  return attempt(async () => {
    const user = await authorize("directory");
    const [r] = await db.select().from(programRecords).where(eq(programRecords.id, id));
    if (!r) return fail("This record no longer exists.");
    if (r.status !== "Published" && r.status !== "Draft") return fail(`This record is ${r.status}. Open it to change its status.`);
    if (r.status !== "Published" && !r.verified) return fail("Open the record and confirm verification of the formal decision, then publish.");
    if (r.status !== "Published" && (!r.effective || !r.review)) return fail("Open the record and add the effective date and validity end date, then publish.");
    const ns = r.status === "Published" ? "Draft" : "Published";
    await db
      .update(programRecords)
      .set({ status: ns, updatedAt: new Date(), publishedAt: ns === "Published" ? (r.publishedAt ?? new Date()) : r.publishedAt })
      .where(eq(programRecords.id, id));
    await logEvent(id, r, { ...r, status: ns });
    await audit({ actorId: user.id, who: officeOf(user), action: "program.publish", entityType: "program", entityId: id, summary: `${r.title} ${ns === "Published" ? "published to" : "removed from"} the directory of approved programs` });
    if (ns === "Published") await tellProvider(r.applicationId, r.title, ns, r.verification);
    refresh();
    return ok(ns === "Published" ? "Published to the directory of approved programs" : "Removed from the public directory");
  });
}

export async function deleteProgramRecord(id: string): Promise<ActionResult> {
  const res = await attempt(async () => {
    const user = await authorize("directory");
    const [r] = await db.select().from(programRecords).where(eq(programRecords.id, id));
    if (!r) return fail("This record no longer exists.");
    if (r.status !== "Draft") return fail("Only draft records can be deleted. Change the status (for example to Withdrawn) to record a change in a published record.");
    await db.delete(programRecords).where(eq(programRecords.id, id));
    await audit({ actorId: user.id, who: officeOf(user), action: "program.delete", entityType: "program", entityId: id, summary: `Program record deleted: ${r.title} (${r.verification})` });
    return ok("Record deleted");
  });
  if (res.ok) {
    refresh();
    redirect(`${LIST}&toast=${encodeURIComponent("Record deleted")}`);
  }
  return res;
}
