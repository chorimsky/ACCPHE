import "server-only";
import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { applications, reviews, users, votes } from "@/db/schema";
import { DECISION_STAGE } from "@/lib/domain";

export async function deliberations() {
  const apps = await db
    .select()
    .from(applications)
    .where(and(eq(applications.stage, DECISION_STAGE), eq(applications.decision, "")))
    .orderBy(asc(applications.updatedAt));
  const ids = apps.map((a) => a.id);
  const [revs, vts, members] = await Promise.all([
    ids.length ? db.select().from(reviews).where(and(inArray(reviews.applicationId, ids), isNotNull(reviews.submittedAt))) : [],
    ids.length ? db.select().from(votes).where(inArray(votes.applicationId, ids)) : [],
    db.select({ id: users.id }).from(users).where(and(eq(users.role, "commission"), eq(users.status, "active"))),
  ]);
  return { apps, revs, vts, memberCount: members.length };
}

export async function deliberation(applicationId: string) {
  const [app] = await db.select().from(applications).where(eq(applications.id, applicationId));
  if (!app) return null;
  const [revs, vts, members] = await Promise.all([
    db
      .select({ review: reviews, reviewer: users.name })
      .from(reviews)
      .innerJoin(users, eq(users.id, reviews.reviewerId))
      .where(and(eq(reviews.applicationId, applicationId), isNotNull(reviews.submittedAt))),
    db.select({ vote: votes, voter: users.name }).from(votes).innerJoin(users, eq(users.id, votes.voterId)).where(eq(votes.applicationId, applicationId)).orderBy(asc(votes.createdAt)),
    db.select({ id: users.id }).from(users).where(and(eq(users.role, "commission"), eq(users.status, "active"))),
  ]);
  return { app, revs, vts, memberCount: members.length };
}

export function tallyOf(vs: { vote: string }[]) {
  const m = new Map<string, number>();
  for (const v of vs) m.set(v.vote, (m.get(v.vote) ?? 0) + 1);
  return [...m.entries()].map(([k, n]) => `${k}: ${n}`).join(" · ") || "No votes yet";
}
