import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { applicationNotes, applications, files, records, requirements, reviews, users, votes, type Classification, type NoteKind, type Pathway } from "@/db/schema";
import { REQUIREMENTS } from "@/lib/domain";
import { slugify } from "@/lib/site";
import { UserError } from "@/lib/action";
import { nextApplicationRef } from "@/server/sequence";
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
  name: string;
  country: string;
  pathway: Pathway;
  website?: string;
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
  const ref = await nextApplicationRef();
  const [app] = await db
    .insert(applications)
    .values({ ...input, ref, source, stage: 0, checks: {} })
    .returning();
  await db.insert(requirements).values(REQUIREMENTS.map((name, position) => ({ applicationId: app.id, name, position })));
  await addNote(app.id, "system", source === "website" ? "Institutional inquiry received via the public website." : "Inquiry logged by the Secretariat.", actor);
  await audit({
    actorId: actor.id,
    who: actor.who,
    action: "application.create",
    entityType: "application",
    entityId: app.id,
    summary: source === "website" ? `New inquiry received from ${app.name}` : `Inquiry logged: ${app.name}`,
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

/** Record the authorized body's decision. Awards create a draft directory record for verification. */
export async function recordDecision(app: Application, decision: Classification | "Declined", actor: Actor) {
  const t = new Date();
  if (decision === "Declined") {
    await db.update(applications).set({ decision, updatedAt: t }).where(eq(applications.id, app.id));
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
      cls: decision,
      effective,
      review,
      scope: decision === "Accredited Institution" ? "Institutional accreditation" : "",
      status: "Draft",
      verified: false,
      applicationId: app.id,
    })
    .returning();
  await db.update(applications).set({ decision, stage: 7, updatedAt: t }).where(eq(applications.id, app.id));
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
