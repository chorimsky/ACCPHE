"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { applications, CLASSIFICATIONS, RECORD_STATUS, recordEvents, records } from "@/db/schema";
import { isoDay } from "@/lib/format";
import { attempt, fail, ok, parseForm, zs, type ActionResult, type ActionState } from "@/lib/action";
import { audit } from "@/server/audit";
import { authorize, officeOf } from "@/server/auth";
import { notifyInstitution } from "@/server/notify";
import { uniqueRecordSlug } from "@/server/services/applications";

const refresh = () => {
  revalidatePath("/portal", "layout");
  revalidatePath("/directory", "layout");
};

const schema = z.object({
  id: z.string().optional(),
  name: zs.text("Institution name", 200),
  country: zs.text("Country", 100),
  cls: z.enum(CLASSIFICATIONS),
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

/**
 * Public status history: an entry whenever a record becomes public, or a public record changes status or
 * classification ("relevant status changes" in the directory).
 */
async function logRecordEvent(recordId: string, prev: { status: string; cls: string; verified: boolean } | undefined, next: { status: string; cls: string; verified: boolean; effective: string }, note = "") {
  if (!isPublic(next)) return;
  if (prev && isPublic(prev) && prev.status === next.status && prev.cls === next.cls) return;
  const first = !prev || !isPublic(prev);
  await db.insert(recordEvents).values({
    recordId,
    status: next.status as (typeof RECORD_STATUS)[number],
    cls: next.cls as (typeof CLASSIFICATIONS)[number],
    effective: first && next.status === "Published" && next.effective ? next.effective : isoDay(),
    note: note.slice(0, 500),
  });
}

export async function saveRecord(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const res = await attempt(async () => {
    const user = await authorize("directory");
    const parsed = parseForm(schema, fd);
    if ("error" in parsed) return fail(parsed.error);
    const d = parsed.data;
    const status = d.intent === "publish" ? "Published" : d.status;
    // A record is public when Published, or when a verified record shows a status change (suspension etc.).
    if (status !== "Draft" && !d.verified) return fail("Confirm the formal decision has been verified before publishing.");
    if (status === "Published" && !d.effective) return fail("An effective date is required to publish.");
    if (d.review && d.effective && d.review < d.effective) return fail("The review date must be after the effective date.");

    const who = officeOf(user);
    const t = new Date();
    const existing = d.id ? (await db.select().from(records).where(eq(records.id, d.id)))[0] : undefined;
    if (d.id && !existing) return fail("This record no longer exists.");
    const values = {
      name: d.name,
      country: d.country,
      cls: d.cls,
      effective: d.effective,
      review: d.review,
      scope: d.scope,
      conditions: d.conditions,
      status,
      verified: d.verified,
      updatedAt: t,
      slug: existing && existing.name === d.name && existing.country === d.country ? existing.slug : await uniqueRecordSlug(d.name, d.country, existing?.id),
      publishedAt: status === "Published" ? (existing?.publishedAt ?? t) : (existing?.publishedAt ?? null),
    };
    let id = existing?.id;
    if (existing) await db.update(records).set(values).where(eq(records.id, existing.id));
    else id = (await db.insert(records).values(values).returning({ id: records.id }))[0].id;

    await logRecordEvent(id!, existing, { status, cls: d.cls, verified: d.verified, effective: d.effective }, d.changeNote);
    await audit({ actorId: user.id, who, action: existing ? "record.update" : "record.create", entityType: "record", entityId: id, summary: `Directory record ${existing ? "updated" : "created"}: ${d.name} (${status})` });
    if (existing?.applicationId && existing.status !== status && status !== "Draft") {
      const [app] = await db.select().from(applications).where(eq(applications.id, existing.applicationId));
      if (app) await notifyInstitution(app, { subject: `${app.ref}: directory record ${status.toLowerCase()}`, text: `The official directory record for ${app.name} is now ${status}.` }, "status");
    }
    return ok(status === "Published" ? "Published to the public directory" : "Record saved");
  });
  if (res.ok) {
    refresh();
    redirect(`/portal/directory?toast=${encodeURIComponent(res.message ?? "Saved")}`);
  }
  return res;
}

export async function togglePublish(id: string): Promise<ActionResult> {
  return attempt(async () => {
    const user = await authorize("directory");
    const [r] = await db.select().from(records).where(eq(records.id, id));
    if (!r) return fail("This record no longer exists.");
    if (r.status !== "Published" && !r.verified) return fail("Open the record and confirm verification of the formal decision, then publish.");
    if (r.status !== "Published" && !r.effective) return fail("Open the record and add an effective date, then publish.");
    const ns = r.status === "Published" ? "Draft" : "Published";
    await db
      .update(records)
      .set({ status: ns, updatedAt: new Date(), publishedAt: ns === "Published" ? (r.publishedAt ?? new Date()) : r.publishedAt })
      .where(eq(records.id, id));
    await logRecordEvent(id, r, { ...r, status: ns });
    await audit({ actorId: user.id, who: officeOf(user), action: "record.publish", entityType: "record", entityId: id, summary: `${r.name} ${ns === "Published" ? "published to the directory" : "removed from the public directory"}` });
    refresh();
    return ok(ns === "Published" ? "Published to the public directory" : "Removed from the public directory");
  });
}

export async function deleteRecord(id: string): Promise<ActionResult> {
  const res = await attempt(async () => {
    const user = await authorize("directory");
    const [r] = await db.select().from(records).where(eq(records.id, id));
    if (!r) return fail("This record no longer exists.");
    if (r.status !== "Draft") return fail("Only draft records can be deleted. Change the status (for example to Withdrawn) to record a change in a published record.");
    await db.delete(records).where(eq(records.id, id));
    await audit({ actorId: user.id, who: officeOf(user), action: "record.delete", entityType: "record", entityId: id, summary: `Directory record deleted: ${r.name}` });
    return ok("Record deleted");
  });
  if (res.ok) {
    refresh();
    redirect(`/portal/directory?toast=${encodeURIComponent("Record deleted")}`);
  }
  return res;
}
