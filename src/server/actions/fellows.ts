"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { applications, DISTINCTION_CODES, fellowEvents, fellows, RECORD_STATUS } from "@/db/schema";
import { distinctionLabel } from "@/lib/domain";
import { isoDay } from "@/lib/format";
import { attempt, fail, ok, parseForm, zs, type ActionResult, type ActionState } from "@/lib/action";
import { audit } from "@/server/audit";
import { authorize, officeOf } from "@/server/auth";
import { notifyInstitution } from "@/server/notify";
import { nextFellowVerification } from "@/server/sequence";
import { uniqueFellowSlug } from "@/server/services/applications";

/** The College of Fellows credential verification register (Directory records module, "College of Fellows" tab). */

const refresh = () => {
  revalidatePath("/portal", "layout");
  revalidatePath("/directory", "layout");
  revalidatePath("/fellows");
};

const LIST = "/portal/directory?kind=fellows";

const schema = z.object({
  id: z.string().optional(),
  honorific: zs.opt(60, "Title"),
  name: zs.text("Full name", 200),
  designation: z.enum(DISTINCTION_CODES, { error: "Select the distinction." }),
  country: zs.text("Country", 100),
  position: zs.opt(200, "Position"),
  affiliation: zs.opt(200, "Institution or organization"),
  citation: zs.opt(1000, "Citation"),
  effective: zs.date(),
  review: zs.date(),
  status: z.enum(RECORD_STATUS),
  verified: zs.bool(),
  changeNote: zs.opt(500),
  intent: z.enum(["save", "publish"]),
});

const isPublic = (r: { status: string; verified: boolean }) => r.status === "Published" || (r.verified && ["Suspended", "Withdrawn", "Expired"].includes(r.status));

/** Public history: an entry when an entry becomes public, and whenever a public entry changes status or distinction. */
async function logEvent(fellowId: string, prev: { status: string; designation: string; verified: boolean } | undefined, next: { status: string; designation: string; verified: boolean; effective: string }, note = "") {
  if (!isPublic(next)) return;
  if (prev && isPublic(prev) && prev.status === next.status && prev.designation === next.designation) return;
  const first = !prev || !isPublic(prev);
  await db.insert(fellowEvents).values({
    fellowId,
    status: next.status as (typeof RECORD_STATUS)[number],
    designation: next.designation as (typeof DISTINCTION_CODES)[number],
    effective: first && next.status === "Published" && next.effective ? next.effective : isoDay(),
    note: note.slice(0, 500),
  });
}

async function tellCandidate(applicationId: string | null, name: string, designation: string, status: string, verification: string) {
  if (!applicationId) return;
  const [app] = await db.select().from(applications).where(eq(applications.id, applicationId));
  if (app)
    await notifyInstitution(
      app,
      {
        subject: `${app.ref}: register entry ${status.toLowerCase()}`,
        text:
          status === "Published"
            ? `The entry for ${name} — ${distinctionLabel(designation)} — is now published in the College of Fellows Directory, with the verification number ${verification}. The approved designation may be used in professional biographies, academic profiles and publications.`
            : `The register entry for ${name} (${verification}) is now ${status}.`,
      },
      "status",
    );
}

export async function saveFellow(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const res = await attempt(async () => {
    const user = await authorize("directory");
    const parsed = parseForm(schema, fd);
    if ("error" in parsed) return fail(parsed.error);
    const d = parsed.data;
    const status = d.intent === "publish" ? "Published" : d.status;
    if (status !== "Draft" && !d.verified) return fail("Confirm the formal decision has been verified before publishing.");
    if (status === "Published" && !d.effective) return fail("The date conferred is required to publish.");
    if (d.review && d.effective && d.review < d.effective) return fail("The renewal date must be after the date conferred.");

    const who = officeOf(user);
    const t = new Date();
    const existing = d.id ? (await db.select().from(fellows).where(eq(fellows.id, d.id)))[0] : undefined;
    if (d.id && !existing) return fail("This entry no longer exists.");
    const values = {
      honorific: d.honorific,
      name: d.name,
      designation: d.designation,
      country: d.country,
      position: d.position,
      affiliation: d.affiliation,
      citation: d.citation,
      effective: d.effective,
      review: d.review,
      status,
      verified: d.verified,
      updatedAt: t,
      slug: existing && existing.name === d.name && existing.designation === d.designation ? existing.slug : await uniqueFellowSlug(d.name, d.designation, existing?.id),
      publishedAt: status === "Published" ? (existing?.publishedAt ?? t) : (existing?.publishedAt ?? null),
    };
    let id = existing?.id;
    let verification = existing?.verification ?? "";
    if (existing) await db.update(fellows).set(values).where(eq(fellows.id, existing.id));
    else {
      verification = await nextFellowVerification();
      id = (await db.insert(fellows).values({ ...values, verification }).returning({ id: fellows.id }))[0].id;
    }

    await logEvent(id!, existing, { status, designation: d.designation, verified: d.verified, effective: d.effective }, d.changeNote);
    await audit({ actorId: user.id, who, action: existing ? "fellow.update" : "fellow.create", entityType: "fellow", entityId: id, summary: `Register entry ${existing ? "updated" : "created"}: ${d.name} — ${d.designation} (${status}, ${verification})` });
    if (existing && existing.status !== status && status !== "Draft") await tellCandidate(existing.applicationId, d.name, d.designation, status, verification);
    return ok(status === "Published" ? `Published to the College of Fellows Directory (${verification})` : "Register entry saved");
  });
  if (res.ok) {
    refresh();
    redirect(`${LIST}&toast=${encodeURIComponent(res.message ?? "Saved")}`);
  }
  return res;
}

export async function toggleFellowPublish(id: string): Promise<ActionResult> {
  return attempt(async () => {
    const user = await authorize("directory");
    const [r] = await db.select().from(fellows).where(eq(fellows.id, id));
    if (!r) return fail("This entry no longer exists.");
    if (r.status !== "Published" && r.status !== "Draft") return fail(`This entry is ${r.status}. Open it to change its status.`);
    if (r.status !== "Published" && !r.verified) return fail("Open the entry and confirm verification of the formal decision, then publish.");
    if (r.status !== "Published" && !r.effective) return fail("Open the entry and add the date conferred, then publish.");
    const ns = r.status === "Published" ? "Draft" : "Published";
    await db
      .update(fellows)
      .set({ status: ns, updatedAt: new Date(), publishedAt: ns === "Published" ? (r.publishedAt ?? new Date()) : r.publishedAt })
      .where(eq(fellows.id, id));
    await logEvent(id, r, { ...r, status: ns });
    await audit({ actorId: user.id, who: officeOf(user), action: "fellow.publish", entityType: "fellow", entityId: id, summary: `${r.name} (${r.designation}) ${ns === "Published" ? "published to" : "removed from"} the College of Fellows Directory` });
    if (ns === "Published") await tellCandidate(r.applicationId, r.name, r.designation, ns, r.verification);
    refresh();
    return ok(ns === "Published" ? "Published to the College of Fellows Directory" : "Removed from the public directory");
  });
}

export async function deleteFellow(id: string): Promise<ActionResult> {
  const res = await attempt(async () => {
    const user = await authorize("directory");
    const [r] = await db.select().from(fellows).where(eq(fellows.id, id));
    if (!r) return fail("This entry no longer exists.");
    if (r.status !== "Draft") return fail("Only draft entries can be deleted. Change the status (for example to Withdrawn) to record a change in a published entry.");
    await db.delete(fellows).where(eq(fellows.id, id));
    await audit({ actorId: user.id, who: officeOf(user), action: "fellow.delete", entityType: "fellow", entityId: id, summary: `Register entry deleted: ${r.name} (${r.verification})` });
    return ok("Entry deleted");
  });
  if (res.ok) {
    refresh();
    redirect(`${LIST}&toast=${encodeURIComponent("Entry deleted")}`);
  }
  return res;
}
