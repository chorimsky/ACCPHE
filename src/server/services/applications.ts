import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { applicationNotes, applications, DISTINCTION_CODES, fellows, files, programRecords, records, requirements, reviews, users, votes, PROGRAM_AWARDS, type AppKind, type Classification, type DistinctionCode, type NoteKind, type Pathway, type ProgramAward } from "@/db/schema";
import { appTitle, CERTIFICATION_YEARS, distinction, distinctionLabel, TRACKS, trackOf } from "@/lib/domain";
import { slugify } from "@/lib/site";
import { UserError } from "@/lib/action";
import { nextApplicationRef, nextFellowRef, nextFellowVerification, nextProgramRef, nextProgramVerification } from "@/server/sequence";
import { audit } from "@/server/audit";

export type Actor = { id: string | null; who: string };
export const WEBSITE: Actor = { id: null, who: "Website" };

export type Application = typeof applications.$inferSelect;

export async function loadApplication(id: string): Promise<Application> {
  const [app] = await db.select().from(applications).where(eq(applications.id, id));
  if (!app) throw new UserError("This application no longer exists.");
  return app;
}

export async function addNote(applicationId: string, kind: NoteKind, text: string, actor: Actor) {
  await db.insert(applicationNotes).values({ applicationId, kind, text, who: actor.who, userId: actor.id });
  await db.update(applications).set({ updatedAt: new Date() }).where(eq(applications.id, applicationId));
}

export type NewApplication = {
  kind?: AppKind;
  programTitle?: string;
  programCategory?: string;
  programDelivery?: string;
  programDuration?: string;
  programLearners?: string;
  name: string;
  country: string;
  pathway: Pathway;
  website?: string;
  fellowRoute?: string;
  fellowDesignation?: string;
  fellowEmail?: string;
  fellowPosition?: string;
  fellowAffiliation?: string;
  facebook?: string;
  linkedin?: string;
  yearEstablished?: string;
  type?: string;
  authRef?: string;
  repName?: string;
  repPosition?: string;
  repEmail?: string;
  repPhone?: string;
  profile?: string;
};

/** Create an application at stage 1 with its document requirements, a first note, and an audit entry. */
export async function createApplication(input: NewApplication, actor: Actor, source: "website" | "staff") {
  const kind = input.kind ?? "institution";
  const ref = kind === "program" ? await nextProgramRef() : kind === "fellow" ? await nextFellowRef() : await nextApplicationRef();
  const [app] = await db
    .insert(applications)
    .values({ ...input, kind, ref, source, stage: 0, checks: {} })
    .returning();
  await db.insert(requirements).values(TRACKS[kind].requirements.map((name, position) => ({ applicationId: app.id, name, position })));
  const what = kind === "program" ? "Program accreditation application" : kind === "fellow" ? `College of Fellows ${input.fellowRoute === "Nomination" ? "nomination" : "application"} (${distinctionLabel(input.fellowDesignation ?? "")})` : "Institutional inquiry";
  await addNote(app.id, "system", source === "website" ? `${what} received via the public website.` : `${what} logged by the Secretariat.`, actor);
  await audit({
    actorId: actor.id,
    who: actor.who,
    action: "application.create",
    entityType: "application",
    entityId: app.id,
    summary:
      source === "website"
        ? kind === "fellow"
          ? `New College of Fellows ${app.fellowRoute === "Nomination" ? `nomination of ${app.name} by ${app.repName}` : `application from ${app.name}`} (${app.fellowDesignation})`
          : `New ${kind === "program" ? "program application" : "inquiry"} received from ${app.name}${kind === "program" ? ` — ${app.programTitle}` : ""}`
        : `${what} logged: ${appTitle(app)}`,
  });
  return app;
}

/** Unique slug for a directory record (adds -2, -3… when taken). */
export async function uniqueRecordSlug(name: string, country: string, exceptId?: string): Promise<string> {
  const base = slugify(`${name} ${country}`);
  for (let i = 1; i < 500; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const [hit] = await db.select({ id: records.id }).from(records).where(eq(records.slug, slug));
    if (!hit || hit.id === exceptId) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Unique slug for a program record. */
export async function uniqueProgramSlug(title: string, provider: string, exceptId?: string): Promise<string> {
  const base = slugify(`${title} ${provider}`).slice(0, 90);
  for (let i = 1; i < 500; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const [hit] = await db.select({ id: programRecords.id }).from(programRecords).where(eq(programRecords.slug, slug));
    if (!hit || hit.id === exceptId) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function uniqueFellowSlug(name: string, designation: string, exceptId?: string): Promise<string> {
  const base = slugify(`${name} ${designation}`).slice(0, 90);
  for (let i = 1; i < 500; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const [hit] = await db.select({ id: fellows.id }).from(fellows).where(eq(fellows.slug, slug));
    if (!hit || hit.id === exceptId) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Atomically take the decision slot, so two simultaneous "record decision" clicks cannot both succeed. */
async function claimDecision(appId: string, decision: string) {
  const claimed = await db
    .update(applications)
    .set({ decision, updatedAt: new Date() })
    .where(and(eq(applications.id, appId), eq(applications.decision, "")))
    .returning({ id: applications.id });
  if (!claimed.length) throw new UserError("A decision has already been recorded for this application.");
}

/** Program decisions: a draft program record (with its verification number) is created for verification. */
async function recordProgramDecision(app: Application, decision: ProgramAward | "Declined", actor: Actor) {
  const t = new Date();
  await claimDecision(app.id, decision);
  if (decision === "Declined") {
    await addNote(app.id, "system", "Program application declined by the authorized body.", actor);
    return null;
  }
  const effective = t.toISOString().slice(0, 10);
  const title = app.programTitle || app.name;
  const [rec] = await db
    .insert(programRecords)
    .values({
      slug: await uniqueProgramSlug(title, app.name),
      verification: await nextProgramVerification(t.getUTCFullYear()),
      title,
      provider: app.name,
      country: app.country,
      category: app.programCategory,
      award: decision,
      effective,
      review: `${t.getUTCFullYear() + 3}${effective.slice(4)}`,
      scope: decision === "Accredited Program" ? "Program-level accreditation" : "Program recognition",
      status: "Draft",
      verified: false,
      applicationId: app.id,
    })
    .returning();
  await db.update(applications).set({ stage: TRACKS.program.decisionStage + 1, updatedAt: t }).where(eq(applications.id, app.id));
  await addNote(app.id, "system", `Decision recorded: ${decision}. A draft program record (${rec.verification}) was created for verification.`, actor);
  return rec;
}

/** College of Fellows decisions: a draft register entry (with its verification number) is created for verification. */
async function recordFellowDecision(app: Application, decision: DistinctionCode | "Declined", actor: Actor) {
  const t = new Date();
  await claimDecision(app.id, decision);
  if (decision === "Declined") {
    await addNote(app.id, "system", "Not conferred: declined by the recognition body.", actor);
    return null;
  }
  const effective = t.toISOString().slice(0, 10);
  const certification = distinction(decision)?.group === "Professional Certification";
  const [rec] = await db
    .insert(fellows)
    .values({
      slug: await uniqueFellowSlug(app.name, decision),
      verification: await nextFellowVerification(t.getUTCFullYear()),
      name: app.name,
      designation: decision,
      country: app.country,
      position: app.fellowPosition,
      affiliation: app.fellowAffiliation,
      effective,
      review: certification ? `${t.getUTCFullYear() + CERTIFICATION_YEARS}${effective.slice(4)}` : "",
      status: "Draft",
      verified: false,
      applicationId: app.id,
    })
    .returning();
  await db.update(applications).set({ stage: TRACKS.fellow.decisionStage + 1, updatedAt: t }).where(eq(applications.id, app.id));
  const sought = app.fellowDesignation && app.fellowDesignation !== decision ? ` (sought: ${app.fellowDesignation})` : "";
  await addNote(app.id, "system", `Decision recorded: ${distinctionLabel(decision)} conferred${sought}. A draft register entry (${rec.verification}) was created for verification.`, actor);
  return rec;
}

/** Record the authorized body's decision. Awards create a draft directory record for verification. */
export async function recordDecision(app: Application, decision: string, actor: Actor) {
  if (app.kind === "fellow") {
    if (decision !== "Declined" && !DISTINCTION_CODES.includes(decision as DistinctionCode)) throw new UserError("Unknown decision.");
    return recordFellowDecision(app, decision as DistinctionCode | "Declined", actor);
  }
  if (app.kind === "program") {
    if (decision !== "Declined" && !PROGRAM_AWARDS.includes(decision as ProgramAward)) throw new UserError("Unknown decision.");
    return recordProgramDecision(app, decision as ProgramAward | "Declined", actor);
  }
  return recordInstitutionDecision(app, decision as Classification | "Declined", actor);
}

async function recordInstitutionDecision(app: Application, decision: Classification | "Declined", actor: Actor) {
  const t = new Date();
  await claimDecision(app.id, decision);
  if (decision === "Declined") {
    await addNote(app.id, "system", "Application declined by the authorized body.", actor);
    return null;
  }
  const effective = t.toISOString().slice(0, 10);
  const review = decision === "Accredited Institution" ? `${t.getUTCFullYear() + 5}${effective.slice(4)}` : "";
  const [rec] = await db
    .insert(records)
    .values({
      slug: await uniqueRecordSlug(app.name, app.country),
      name: app.name,
      country: app.country,
      website: app.website,
      cls: decision,
      effective,
      review,
      scope: decision === "Accredited Institution" ? "Institutional accreditation" : "",
      status: "Draft",
      verified: false,
      applicationId: app.id,
    })
    .returning();
  await db.update(applications).set({ stage: trackOf(app).decisionStage + 1, updatedAt: t }).where(eq(applications.id, app.id));
  await addNote(app.id, "system", `Decision recorded: ${decision}. A draft directory record was created for verification.`, actor);
  return rec;
}

/** Everything the staff application page needs. */
export async function applicationDetail(id: string) {
  const app = await loadApplication(id);
  const [reqs, fileRows, notes, reviewRows, voteRows, officer] = await Promise.all([
    db.select().from(requirements).where(eq(requirements.applicationId, id)).orderBy(asc(requirements.position)),
    db.select().from(files).where(eq(files.applicationId, id)).orderBy(asc(files.createdAt)),
    db.select().from(applicationNotes).where(eq(applicationNotes.applicationId, id)).orderBy(desc(applicationNotes.createdAt)),
    db
      .select({ review: reviews, reviewer: { id: users.id, name: users.name, org: users.org, email: users.email } })
      .from(reviews)
      .innerJoin(users, eq(users.id, reviews.reviewerId))
      .where(eq(reviews.applicationId, id))
      .orderBy(asc(reviews.createdAt)),
    db
      .select({ vote: votes, voter: { id: users.id, name: users.name } })
      .from(votes)
      .innerJoin(users, eq(users.id, votes.voterId))
      .where(eq(votes.applicationId, id))
      .orderBy(asc(votes.createdAt)),
    app.officerId ? db.select({ id: users.id, name: users.name, position: users.position }).from(users).where(eq(users.id, app.officerId)) : Promise.resolve([]),
  ]);
  return { app, reqs, files: fileRows, notes, reviews: reviewRows, votes: voteRows, officer: officer[0] ?? null };
}

/** Files grouped by requirement id ("" = sent with the public inquiry). */
export function groupFiles<T extends { requirementId: string | null }>(rows: T[]) {
  const m = new Map<string, T[]>();
  for (const f of rows) {
    const k = f.requirementId ?? "";
    m.set(k, [...(m.get(k) ?? []), f]);
  }
  return m;
}

export async function officerOptions() {
  return db
    .select({ id: users.id, name: users.name, position: users.position })
    .from(users)
    .where(and(inArray(users.role, ["admin", "officer"]), eq(users.status, "active")))
    .orderBy(asc(users.name));
}

export const officerLabel = (o: { name: string; position: string } | null | undefined) => (o ? (o.position ? `${o.name} — ${o.position}` : o.name) : "Unassigned");
