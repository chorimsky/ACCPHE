"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { APP_KINDS, applications, DOC_STATUS, files, PATHWAYS, requirements, reviews, users } from "@/db/schema";
import { attempt, fail, ok, parseForm, zs, type ActionResult, type ActionState } from "@/lib/action";
import { appTitle, RESPONSE_REQUIREMENT, trackOf } from "@/lib/domain";
import { audit } from "@/server/audit";
import { authorize, officeOf } from "@/server/auth";
import { notifyAssigned, notifyInstitution, notifyModule, notifyStatus } from "@/server/notify";
import { addNote, createApplication, loadApplication, recordDecision, type Actor } from "@/server/services/applications";
import { putFile } from "@/server/storage";

const refresh = () => revalidatePath("/portal", "layout");

async function staff() {
  const user = await authorize("applications");
  const actor: Actor = { id: user.id, who: officeOf(user) };
  return { user, actor };
}

const newSchema = z.object({
  kind: z.enum(APP_KINDS).default("institution"),
  programTitle: zs.opt(200),
  name: zs.text("Institution or provider name", 200),
  country: zs.text("Country", 100),
  pathway: z.enum(PATHWAYS),
  repName: zs.opt(150),
  repEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .optional()
    .transform((v) => v ?? "")
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email."),
});

export async function logInquiry(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const res = await attempt(async () => {
    const { actor } = await staff();
    const parsed = parseForm(newSchema, fd);
    if ("error" in parsed) return fail(parsed.error);
    if (parsed.data.kind === "program" && !parsed.data.programTitle) return fail("Program title is required.");
    const app = await createApplication(parsed.data, actor, "staff");
    return ok(`${app.kind === "program" ? "Program application" : "Inquiry"} logged as ${app.ref}`, { id: app.id });
  });
  if (res.ok) {
    refresh();
    redirect(`/portal/applications/${res.data?.id}?toast=${encodeURIComponent(res.message ?? "")}`);
  }
  return res;
}

export async function moveStage(id: string, delta: 1 | -1): Promise<ActionResult> {
  return attempt(async () => {
    const { user, actor } = await staff();
    const app = await loadApplication(id);
    const T = trackOf(app);
    if (app.decision === "Declined") return fail("This application was declined.");
    if (delta > 0 && app.stage === T.decisionStage) return fail("Record the decision of the authorized body to complete this stage.");
    if (delta > 0 && app.stage >= T.lastStage) return fail("This application is already at the final stage.");
    if (delta < 0 && (app.stage === 0 || app.stage > T.decisionStage)) return fail("This application cannot return to a previous stage.");
    const ns = app.stage + delta;
    // Optimistic check: only move from the stage the user was looking at.
    const moved = await db
      .update(applications)
      .set({ stage: ns, updatedAt: new Date() })
      .where(and(eq(applications.id, id), eq(applications.stage, app.stage)))
      .returning({ id: applications.id });
    if (!moved.length) return fail("The application changed while you were viewing it. Reload and try again.");
    const label = T.stages[ns];
    const title = appTitle(app);
    await addNote(id, "system", `${delta > 0 ? "Advanced to" : "Returned to"} stage ${ns + 1}: ${label}.`, actor);
    await audit({ actorId: user.id, who: actor.who, action: "application.stage", entityType: "application", entityId: id, summary: `${title} moved to ${label}` });
    if (delta > 0 && ns === T.findingsStage) {
      // The institution answers the review findings through a dedicated document.
      const reqs = await db.select().from(requirements).where(eq(requirements.applicationId, id));
      if (!reqs.some((r) => r.name === RESPONSE_REQUIREMENT)) {
        await db.insert(requirements).values({ applicationId: id, name: RESPONSE_REQUIREMENT, position: Math.max(0, ...reqs.map((r) => r.position)) + 1 });
      }
    }
    await notifyInstitution(
      app,
      {
        subject: `${app.ref}: now at ${label}`,
        text:
          ns === T.findingsStage
            ? `The independent evaluation of ${app.name} is complete and the review findings are being issued. You may correct factual inaccuracies and submit your institutional response, with any additional evidence, through the Institution Portal (“${RESPONSE_REQUIREMENT}”).`
            : `The evaluation of ${title} has moved to stage ${ns + 1} of ${T.stages.length}: ${label}.`,
      },
      "status",
    );
    if (delta > 0 && ns === T.decisionStage) {
      await notifyModule("decisions", { subject: `For deliberation: ${title} (${app.ref})`, text: `${title}${app.kind === "program" ? ` (${app.name})` : ""} has been submitted to the Accreditation Commission. The review record is available in the portal for deliberation and voting.`, link: `/portal/decisions/${id}` }, { secretariat: false });
    }
    if (app.officerId && app.officerId !== user.id) await notifyStatus([app.officerId], { subject: `${title} moved to ${label}`, text: `${actor.who} moved ${title} (${app.ref}) to ${label}.`, link: `/portal/applications/${id}` });
    refresh();
    return ok(`Moved to ${label}`);
  });
}

export async function setOfficer(id: string, officerId: string): Promise<ActionResult> {
  return attempt(async () => {
    const { user, actor } = await staff();
    const app = await loadApplication(id);
    let label = "Unassigned";
    if (officerId) {
      const [o] = await db.select().from(users).where(eq(users.id, officerId));
      if (!o || o.status !== "active" || !["admin", "officer"].includes(o.role)) return fail("Choose an active accreditation officer.");
      label = o.position ? `${o.name}, ${o.position}` : o.name;
    }
    await db.update(applications).set({ officerId: officerId || null, updatedAt: new Date() }).where(eq(applications.id, id));
    await audit({ actorId: user.id, who: actor.who, action: "application.assign", entityType: "application", entityId: id, summary: `${app.name} assigned to ${label}` });
    if (officerId && officerId !== user.id) {
      await notifyAssigned(officerId, { subject: `Assigned: ${appTitle(app)} (${app.ref})`, text: `${actor.who} assigned you as responsible officer for ${appTitle(app)} (${app.ref}), currently at ${trackOf(app).stages[app.stage]}.`, link: `/portal/applications/${id}` });
    }
    refresh();
    return ok("Officer assigned");
  });
}

export async function toggleCheck(id: string, stage: number, index: number): Promise<ActionResult> {
  return attempt(async () => {
    await staff();
    const app = await loadApplication(id);
    if (stage !== app.stage || index < 0 || index >= (trackOf(app).checks[stage]?.length ?? 0)) return fail("The checklist changed. Reload the page.");
    const checks = { ...app.checks };
    const arr = (checks[String(stage)] ?? []).slice();
    arr[index] = !arr[index];
    checks[String(stage)] = arr;
    await db.update(applications).set({ checks }).where(eq(applications.id, id));
    refresh();
    return ok();
  });
}

export async function setRequirementStatus(reqId: string, status: (typeof DOC_STATUS)[number]): Promise<ActionResult> {
  return attempt(async () => {
    const { user, actor } = await staff();
    if (!DOC_STATUS.includes(status)) return fail("Unknown status.");
    const [req] = await db.select().from(requirements).where(eq(requirements.id, reqId));
    if (!req) return fail("This document requirement no longer exists.");
    const app = await loadApplication(req.applicationId);
    await db.update(requirements).set({ status, updatedAt: new Date() }).where(eq(requirements.id, reqId));
    await db.update(applications).set({ updatedAt: new Date() }).where(eq(applications.id, app.id));
    await audit({ actorId: user.id, who: actor.who, action: "document.status", entityType: "application", entityId: app.id, summary: `${app.name}: ${req.name} marked ${status.toLowerCase()}` });
    refresh();
    return ok("Document status updated");
  });
}

/** Staff can file documents received by email or post against a requirement. */
export async function staffUpload(reqId: string, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const { user, actor } = await staff();
    const file = fd.get("file");
    if (!(file instanceof File) || !file.size) return fail("Choose a file to upload.");
    const [req] = await db.select().from(requirements).where(eq(requirements.id, reqId));
    if (!req) return fail("This document requirement no longer exists.");
    const app = await loadApplication(req.applicationId);
    const s = await putFile(file);
    await db.insert(files).values({ applicationId: app.id, requirementId: req.id, fileName: s.fileName, storageKey: s.key, size: s.size, mimeType: s.mimeType, uploadedById: user.id, uploadedByLabel: actor.who });
    await db.update(requirements).set({ status: "Received", updatedAt: new Date() }).where(eq(requirements.id, req.id));
    await addNote(app.id, "staff", `Filed “${s.fileName}” for ${req.name}.`, actor);
    await audit({ actorId: user.id, who: actor.who, action: "document.upload", entityType: "application", entityId: app.id, summary: `${app.name}: ${s.fileName} filed for ${req.name}` });
    refresh();
    return ok("Document filed and marked received");
  });
}

export async function addApplicationNote(id: string, kind: "staff" | "message", text: string): Promise<ActionResult> {
  return attempt(async () => {
    const { user, actor } = await staff();
    const t = text.trim();
    if (!t) return fail("Write a note first.");
    if (t.length > 8000) return fail("The note is too long.");
    const app = await loadApplication(id);
    await addNote(id, kind, t, actor);
    if (kind === "message") {
      await audit({ actorId: user.id, who: actor.who, action: "application.message", entityType: "application", entityId: id, summary: `Message sent to ${app.name}` });
      const reached = await notifyInstitution(app, { subject: `Message from the ACCPHE Secretariat — ${app.ref}`, text: `${t}\n\n— ${actor.who}` }, "message");
      refresh();
      return ok(
        reached
          ? `Message sent to the ${trackOf(app).party}`
          : `Message recorded, but no email address or portal account is on file for this ${trackOf(app).party}, so nobody was notified. Add the representative’s email in the details.`,
      );
    }
    refresh();
    return ok("Internal note added");
  });
}

export async function decide(id: string, decision: string): Promise<ActionResult> {
  return attempt(async () => {
    const { user, actor } = await staff();
    const app = await loadApplication(id);
    const T = trackOf(app);
    if (app.stage !== T.decisionStage || app.decision) return fail("A decision can only be recorded at the Decision stage.");
    if (decision !== "Declined" && !T.decisions.some((x) => x.value === decision)) return fail("Unknown decision.");
    const d = decision;
    await recordDecision(app, d, actor);
    const title = appTitle(app);
    await audit({
      actorId: user.id,
      who: actor.who,
      action: "application.decision",
      entityType: "application",
      entityId: id,
      summary: d === "Declined" ? `${title} — application declined` : `${title} — decision recorded: ${d}`,
    });
    await notifyInstitution(
      app,
      {
        subject: `${app.ref}: decision recorded`,
        text:
          d === "Declined"
            ? `The authorized body has declined the application for ${title}. Contact the Secretariat for information on the appeals procedure.`
            : app.kind === "program"
              ? `The authorized body has recorded its decision for ${title}: ${d}. Your certificate and the public program record, with its verification number, will be issued after verification. The accreditation applies only to the approved program, not to the provider or its other offerings.`
              : `The authorized body has recorded its decision for ${app.name}: ${d}. The official directory record will be published after verification. Please represent your institution's status accurately: membership is not accreditation.`,
      },
      "status",
    );
    refresh();
    return ok(d === "Declined" ? "Decision recorded" : app.kind === "program" ? "Decision recorded — draft program record created" : "Decision recorded — draft directory record created");
  });
}

export async function assignReviewer(id: string, reviewerId: string): Promise<ActionResult> {
  return attempt(async () => {
    const { user, actor } = await staff();
    const app = await loadApplication(id);
    if (app.decision) return fail("A decision has already been recorded.");
    const [r] = await db.select().from(users).where(eq(users.id, reviewerId));
    if (!r || r.role !== "reviewer" || r.status !== "active") return fail("Choose an active reviewer.");
    const [existing] = await db.select().from(reviews).where(and(eq(reviews.applicationId, id), eq(reviews.reviewerId, reviewerId)));
    if (existing) return fail(`${r.name} is already on the review team.`);
    const n = trackOf(app).standards;
    await db.insert(reviews).values({ applicationId: id, reviewerId, assignedById: user.id, ratings: Array(n).fill(""), comments: Array(n).fill("") });
    await addNote(id, "staff", `${r.name} appointed to the review team.`, actor);
    await audit({ actorId: user.id, who: actor.who, action: "review.assign", entityType: "application", entityId: id, summary: `${r.name} appointed to review ${appTitle(app)}` });
    await notifyAssigned(r.id, {
      subject: `Review assignment: ${appTitle(app)} (${app.ref})`,
      text: `You have been appointed to the review team for ${app.kind === "program" ? `the program “${appTitle(app)}” offered by ${app.name}` : app.name} (${app.country}). Before opening the evaluation you will be asked to declare any conflict of interest.`,
      link: "/portal/reviews",
    });
    refresh();
    return ok("Reviewer appointed");
  });
}

export async function removeReviewer(reviewId: string): Promise<ActionResult> {
  return attempt(async () => {
    const { user, actor } = await staff();
    const [rv] = await db.select().from(reviews).where(eq(reviews.id, reviewId));
    if (!rv) return fail("This assignment no longer exists.");
    if (rv.submittedAt) return fail("A submitted review report is part of the record and cannot be removed.");
    const app = await loadApplication(rv.applicationId);
    const [r] = await db.select({ name: users.name }).from(users).where(eq(users.id, rv.reviewerId));
    await db.delete(reviews).where(eq(reviews.id, reviewId));
    await addNote(app.id, "staff", `${r?.name ?? "A reviewer"} removed from the review team.`, actor);
    await audit({ actorId: user.id, who: actor.who, action: "review.unassign", entityType: "application", entityId: app.id, summary: `${r?.name ?? "Reviewer"} removed from the review of ${app.name}` });
    refresh();
    return ok("Reviewer removed");
  });
}


const editSchema = z.object({
  id: z.string(),
  name: zs.text("Institution name", 200),
  country: zs.text("Country", 100),
  website: zs.opt(300),
  yearEstablished: z
    .string()
    .trim()
    .optional()
    .transform((v) => v ?? "")
    .refine((v) => v === "" || /^\d{4}$/.test(v), "Enter the year as four digits."),
  type: zs.opt(80),
  authRef: zs.opt(200),
  pathway: z.enum(PATHWAYS),
  repName: zs.opt(150),
  repPosition: zs.opt(150),
  repEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .optional()
    .transform((v) => v ?? "")
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email."),
  repPhone: zs.opt(60),
  profile: zs.opt(6000),
  programTitle: zs.opt(200),
  programCategory: zs.opt(200),
  programDelivery: zs.opt(60),
  programDuration: zs.opt(120),
  programLearners: zs.opt(600),
});

const FIELD_LABELS: Record<string, string> = {
  name: "institution name",
  country: "country",
  website: "website",
  yearEstablished: "year established",
  type: "institution type",
  authRef: "authorization reference",
  pathway: "pathway",
  repName: "representative",
  repPosition: "representative’s position",
  repEmail: "representative email",
  repPhone: "telephone",
  profile: "profile",
  programTitle: "program title",
  programCategory: "program category",
  programDelivery: "delivery mode",
  programDuration: "duration",
  programLearners: "intended learners",
};

/** Correct the details of an application (each correction is recorded). */
export async function updateApplication(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const res = await attempt(async () => {
    const { user, actor } = await staff();
    const parsed = parseForm(editSchema, fd);
    if ("error" in parsed) return fail(parsed.error);
    const { id, ...d } = parsed.data;
    const app = await loadApplication(id);
    if (app.kind === "program" && !d.programTitle) return fail("Program title is required.");
    const changed = (Object.keys(d) as (keyof typeof d)[]).filter((k) => String(app[k] ?? "") !== String(d[k]));
    if (!changed.length) return ok("No changes", { id });
    await db.update(applications).set({ ...d, updatedAt: new Date() }).where(eq(applications.id, id));
    const what = changed.map((k) => FIELD_LABELS[k]).join(", ");
    await addNote(id, "staff", `Application details corrected: ${what}.`, actor);
    await audit({ actorId: user.id, who: actor.who, action: "application.edit", entityType: "application", entityId: id, summary: `${d.name}: details corrected (${what})` });
    return ok("Application details saved", { id });
  });
  if (res.ok) {
    refresh();
    redirect(`/portal/applications/${res.data?.id}?toast=${encodeURIComponent(res.message ?? "Saved")}`);
  }
  return res;
}
