"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { applications, RATINGS, reviews, type Rating } from "@/db/schema";
import { attempt, fail, ok, type ActionResult } from "@/lib/action";
import { appTitle, RATING_LABELS, trackOf } from "@/lib/domain";
import { audit } from "@/server/audit";
import { authorize } from "@/server/auth";
import { notifyOfficer } from "@/server/notify";
import { addNote } from "@/server/services/applications";

const refresh = () => revalidatePath("/portal", "layout");

/** The signed-in reviewer's own assignment. */
async function mine(reviewId: string) {
  const user = await authorize("reviews");
  const [rv] = await db.select().from(reviews).where(and(eq(reviews.id, reviewId), eq(reviews.reviewerId, user.id)));
  if (!rv) throw new Error("not found");
  const [app] = await db.select().from(applications).where(eq(applications.id, rv.applicationId));
  return { user, rv, app };
}

/** The evaluation is editable after the declaration, until the report is submitted. */
async function editable(reviewId: string) {
  const ctx = await mine(reviewId);
  if (ctx.rv.conflictDeclaredAt) throw new Error("conflict");
  if (!ctx.rv.coiConfirmedAt) throw new Error("coi");
  if (ctx.rv.submittedAt) throw new Error("submitted");
  if (ctx.app?.decision) throw new Error("decided");
  return ctx;
}

const explain = (e: unknown) =>
  fail(
    e instanceof Error && e.message === "submitted"
      ? "This report has been submitted and can no longer be edited."
      : e instanceof Error && e.message === "decided"
        ? "A decision has already been recorded for this application; the review is closed."
      : e instanceof Error && e.message === "coi"
        ? "Confirm the conflict-of-interest declaration first."
        : e instanceof Error && e.message === "conflict"
          ? "You declared a conflict of interest for this review."
          : "This review is not assigned to you.",
  );

export async function confirmCoi(reviewId: string): Promise<ActionResult> {
  return attempt(async () => {
    try {
      const { user, rv, app } = await mine(reviewId);
      if (rv.conflictDeclaredAt) return fail("You declared a conflict of interest for this review.");
      if (rv.coiConfirmedAt) return ok();
      await db.update(reviews).set({ coiConfirmedAt: new Date(), updatedAt: new Date() }).where(eq(reviews.id, reviewId));
      await addNote(rv.applicationId, "system", `${user.name} confirmed no conflict of interest and opened the evaluation.`, { id: user.id, who: user.name });
      await audit({ actorId: user.id, who: user.name, action: "review.coi", entityType: "application", entityId: rv.applicationId, summary: `${user.name} declared no conflict of interest for ${app?.name}` });
      refresh();
      return ok("Declaration recorded");
    } catch (e) {
      return explain(e);
    }
  });
}

export async function declareConflict(reviewId: string): Promise<ActionResult> {
  return attempt(async () => {
    try {
      const { user, rv, app } = await mine(reviewId);
      if (rv.submittedAt) return fail("This report has already been submitted.");
      await db.update(reviews).set({ conflictDeclaredAt: new Date(), updatedAt: new Date() }).where(eq(reviews.id, reviewId));
      await addNote(rv.applicationId, "staff", `${user.name} declared a conflict of interest and withdrew. Reassignment required.`, { id: user.id, who: user.name });
      await audit({ actorId: user.id, who: user.name, action: "review.conflict", entityType: "application", entityId: rv.applicationId, summary: `${user.name} declared a conflict on ${app ? appTitle(app) : "an application"}` });
      if (app) await notifyOfficer(app.officerId, { subject: `Reviewer conflict: ${appTitle(app)}`, text: `${user.name} declared a conflict of interest and withdrew from the review of ${appTitle(app)} (${app.ref}). A replacement reviewer is required.`, link: `/portal/applications/${app.id}` });
      refresh();
      return ok("Conflict declared — the Secretariat will reassign this review");
    } catch (e) {
      return explain(e);
    }
  });
}

export async function saveRating(reviewId: string, index: number, rating: Rating): Promise<ActionResult> {
  return attempt(async () => {
    try {
      const { rv } = await editable(reviewId);
      if (!RATINGS.includes(rating) || index < 0 || index >= rv.ratings.length) return fail("Invalid rating.");
      const ratings = [...rv.ratings];
      ratings[index] = rating;
      await db.update(reviews).set({ ratings, updatedAt: new Date() }).where(and(eq(reviews.id, reviewId), isNull(reviews.submittedAt)));
      refresh();
      return ok();
    } catch (e) {
      return explain(e);
    }
  });
}

export async function saveComment(reviewId: string, index: number, comment: string): Promise<ActionResult> {
  return attempt(async () => {
    try {
      const { rv } = await editable(reviewId);
      if (index < 0 || index >= rv.comments.length) return fail("Invalid standard.");
      const comments = [...rv.comments];
      comments[index] = comment.slice(0, 4000);
      await db.update(reviews).set({ comments, updatedAt: new Date() }).where(and(eq(reviews.id, reviewId), isNull(reviews.submittedAt)));
      return ok();
    } catch (e) {
      return explain(e);
    }
  });
}

export async function saveSummary(reviewId: string, summary: string): Promise<ActionResult> {
  return attempt(async () => {
    try {
      await editable(reviewId);
      await db.update(reviews).set({ summary: summary.slice(0, 8000), updatedAt: new Date() }).where(and(eq(reviews.id, reviewId), isNull(reviews.submittedAt)));
      return ok();
    } catch (e) {
      return explain(e);
    }
  });
}

export async function submitReview(reviewId: string): Promise<ActionResult> {
  return attempt(async () => {
    try {
      const { user, rv, app } = await editable(reviewId);
      if (!app || app.stage < trackOf(app).evaluationStage) return fail("The application has not reached the independent evaluation stage.");
      const rated = rv.ratings.filter(Boolean).length;
      if (rated < rv.ratings.length) return fail(`Rate all ${rv.ratings.length} standards before submitting (${rated} of ${rv.ratings.length}).`);
      if (!rv.summary.trim()) return fail("Add an overall summary and recommendation.");
      const c = (k: Rating) => rv.ratings.filter((x) => x === k).length;
      await db.update(reviews).set({ submittedAt: new Date(), updatedAt: new Date() }).where(and(eq(reviews.id, reviewId), isNull(reviews.submittedAt)));
      const counts = `${c("met")} ${RATING_LABELS.met.toLowerCase()}, ${c("partial")} ${RATING_LABELS.partial.toLowerCase()}, ${c("not")} ${RATING_LABELS.not.toLowerCase()}`;
      await addNote(app.id, "system", `Independent review report submitted by ${user.name} (${counts}).`, { id: user.id, who: user.name });
      await audit({ actorId: user.id, who: user.name, action: "review.submit", entityType: "application", entityId: app.id, summary: `Review report submitted for ${appTitle(app)}` });
      await notifyOfficer(app.officerId, { subject: `Review report submitted: ${appTitle(app)}`, text: `${user.name} submitted the independent review report for ${appTitle(app)} (${app.ref}): ${counts}.`, link: `/portal/applications/${app.id}` });
      refresh();
      return ok("Review report submitted to the Secretariat");
    } catch (e) {
      return explain(e);
    }
  });
}
