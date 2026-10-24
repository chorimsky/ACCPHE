"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, complianceSubmissions, COMPLIANCE_TYPES, files, requirements } from "@/db/schema";
import { attempt, fail, ok, UserError, type ActionResult } from "@/lib/action";
import { appTitle, trackOf } from "@/lib/domain";
import { audit } from "@/server/audit";
import { authorize } from "@/server/auth";
import { notifyOfficer } from "@/server/notify";
import { addNote } from "@/server/services/applications";
import { putFile } from "@/server/storage";

const refresh = () => revalidatePath("/portal", "layout");

/** The representative's own application (never one chosen by the browser). */
async function own() {
  const user = await authorize("myapp");
  if (!user.applicationId) throw new UserError("Your account is not linked to an application yet. Contact the Secretariat.");
  const [app] = await db.select().from(applications).where(eq(applications.id, user.applicationId));
  if (!app) throw new UserError("Your application could not be found. Contact the Secretariat.");
  return { user, app, actor: { id: user.id, who: app.name } };
}

/** "Provider — Program" for programs, the institution otherwise. */
const who = (app: { kind: "institution" | "program"; name: string; programTitle: string }) => (app.kind === "program" ? `${app.name} — ${app.programTitle}` : app.name);

/** Officer (or the Applications team if no one can act on it), naming the program for program applications. */
const alertStaff = (app: { id: string; officerId: string | null }, subject: string, text: string) => notifyOfficer(app.officerId, { subject, text, link: `/portal/applications/${app.id}` });

export async function uploadDocument(reqId: string, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const { user, app, actor } = await own();
    const file = fd.get("file");
    if (!(file instanceof File) || !file.size) return fail("Choose a file to upload.");
    const [req] = await db.select().from(requirements).where(and(eq(requirements.id, reqId), eq(requirements.applicationId, app.id)));
    if (!req) return fail("This document requirement is not part of your application.");
    if (req.status === "Received") return fail("This document has already been received by the Secretariat.");
    const s = await putFile(file);
    await db.insert(files).values({ applicationId: app.id, requirementId: req.id, fileName: s.fileName, storageKey: s.key, size: s.size, mimeType: s.mimeType, uploadedById: user.id, uploadedByLabel: app.name });
    await db.update(requirements).set({ status: "Submitted", updatedAt: new Date() }).where(eq(requirements.id, req.id));
    await addNote(app.id, "institution", `Uploaded “${s.fileName}” for ${req.name}.`, actor);
    await audit({ actorId: user.id, who: app.name, action: "document.upload", entityType: "application", entityId: app.id, summary: `${app.name} uploaded ${s.fileName}` });
    await alertStaff(app, `Document submitted: ${appTitle(app)}`, `${who(app)} (${app.ref}) uploaded “${s.fileName}” for ${req.name}. Review it and mark it received.`);
    refresh();
    return ok("Document submitted for review");
  });
}

export async function sendInstitutionMessage(text: string): Promise<ActionResult> {
  return attempt(async () => {
    const { user, app, actor } = await own();
    const t = text.trim();
    if (!t) return fail("Write a message first.");
    if (t.length > 8000) return fail("The message is too long.");
    await addNote(app.id, "institution", t, actor);
    await audit({ actorId: user.id, who: app.name, action: "application.message", entityType: "application", entityId: app.id, summary: `Message from ${app.name}` });
    await alertStaff(app, `Message from ${appTitle(app)} (${app.ref})`, `${user.name} (${who(app)}) wrote:\n\n${t.slice(0, 1500)}`);
    refresh();
    return ok("Message sent to the Secretariat");
  });
}

export async function submitCompliance(type: string, text: string): Promise<ActionResult> {
  return attempt(async () => {
    const { user, app, actor } = await own();
    if (app.stage <= trackOf(app).decisionStage || app.decision === "Declined") return fail("Compliance reports are submitted once a decision has been recorded.");
    if (!COMPLIANCE_TYPES.includes(type as never)) return fail("Choose the type of submission.");
    const t = text.trim();
    if (!t) return fail("Write a summary first.");
    const kind = type as (typeof COMPLIANCE_TYPES)[number];
    await db.insert(complianceSubmissions).values({ applicationId: app.id, type: kind, text: t.slice(0, 10_000), userId: user.id });
    await addNote(app.id, "institution", `${kind} submitted: ${t.slice(0, 2000)}`, actor);
    await audit({ actorId: user.id, who: app.name, action: "compliance.submit", entityType: "application", entityId: app.id, summary: `${kind} received from ${app.name}` });
    await alertStaff(app, `${kind}: ${appTitle(app)}`, `${who(app)} (${app.ref}) submitted a ${kind.toLowerCase()}:\n\n${t.slice(0, 1500)}`);
    refresh();
    return ok(`${kind} submitted`);
  });
}
