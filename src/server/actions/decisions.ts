"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, votes } from "@/db/schema";
import { attempt, fail, ok, type ActionResult } from "@/lib/action";
import { appTitle, awaitingDecision, COMMISSION_QUORUM, trackOf } from "@/lib/domain";
import type { Vote } from "@/db/schema";
import { audit } from "@/server/audit";
import { authorize } from "@/server/auth";
import { notifyStatus } from "@/server/notify";
import { addNote } from "@/server/services/applications";

const refresh = () => revalidatePath("/portal", "layout");

async function openForDeliberation(applicationId: string) {
  const [app] = await db.select().from(applications).where(eq(applications.id, applicationId));
  if (!app || !awaitingDecision(app)) return null;
  return app;
}

async function upsertVote(applicationId: string, voterId: string, vote: Vote, note: string) {
  await db
    .insert(votes)
    .values({ applicationId, voterId, vote, note })
    .onConflictDoUpdate({ target: [votes.applicationId, votes.voterId], set: { vote, note, createdAt: new Date() } });
}

export async function castVote(applicationId: string, vote: string, note: string, noConflict: boolean): Promise<ActionResult> {
  return attempt(async () => {
    const user = await authorize("decisions");
    if (!noConflict) return fail("Confirm you have no conflict of interest.");
    const app = await openForDeliberation(applicationId);
    if (!app) return fail("This application is no longer open for deliberation.");
    if (!trackOf(app).voteOptions.includes(vote as never)) return fail("Select your vote.");
    const [prev] = await db.select().from(votes).where(and(eq(votes.applicationId, applicationId), eq(votes.voterId, user.id)));
    await upsertVote(applicationId, user.id, vote as Vote, note.trim().slice(0, 4000));
    await addNote(applicationId, "system", `${user.name} ${prev ? "changed their" : "recorded a"} vote.`, { id: user.id, who: "Accreditation Commission" });
    await audit({ actorId: user.id, who: user.name, action: "decision.vote", entityType: "application", entityId: applicationId, summary: `${user.name} voted on ${appTitle(app)}` });
    const all = await db.select({ vote: votes.vote }).from(votes).where(eq(votes.applicationId, applicationId));
    const counted = all.filter((v) => v.vote !== "Recused").length;
    if (!prev && counted === COMMISSION_QUORUM) {
      await notifyStatus([app.officerId], { subject: `Commission quorum reached: ${appTitle(app)}`, text: `${counted} Commission votes have been recorded for ${appTitle(app)} (${app.ref}). The decision can now be recorded.`, link: `/portal/applications/${app.id}` });
    }
    refresh();
    return ok("Vote recorded");
  });
}

export async function recuse(applicationId: string): Promise<ActionResult> {
  return attempt(async () => {
    const user = await authorize("decisions");
    const app = await openForDeliberation(applicationId);
    if (!app) return fail("This application is no longer open for deliberation.");
    await upsertVote(applicationId, user.id, "Recused", "Declared a conflict of interest.");
    await addNote(applicationId, "system", `${user.name} recused from the deliberation.`, { id: user.id, who: "Accreditation Commission" });
    await audit({ actorId: user.id, who: user.name, action: "decision.recuse", entityType: "application", entityId: applicationId, summary: `${user.name} recused from ${appTitle(app)}` });
    refresh();
    return ok("Recusal recorded");
  });
}
