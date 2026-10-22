import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { applications, files, requirements, reviews } from "@/db/schema";

/** Reviews assigned to a reviewer (withdrawn ones excluded). */
export async function myReviews(reviewerId: string) {
  return db
    .select({ review: reviews, app: applications })
    .from(reviews)
    .innerJoin(applications, eq(applications.id, reviews.applicationId))
    .where(and(eq(reviews.reviewerId, reviewerId), isNull(reviews.conflictDeclaredAt)))
    .orderBy(asc(applications.name));
}

export async function evidenceFile(applicationId: string) {
  const [reqs, fs] = await Promise.all([
    db.select().from(requirements).where(eq(requirements.applicationId, applicationId)).orderBy(asc(requirements.position)),
    db.select().from(files).where(eq(files.applicationId, applicationId)).orderBy(asc(files.createdAt)),
  ]);
  return reqs.map((r) => ({ ...r, files: fs.filter((f) => f.requirementId === r.id) })).concat(
    fs.some((f) => !f.requirementId) ? [{ id: "inquiry", applicationId, position: 99, name: "Submitted with the inquiry", status: "Received" as const, updatedAt: new Date(), files: fs.filter((f) => !f.requirementId) }] : [],
  );
}
