import "server-only";
import { cache } from "react";
import { and, count, eq, isNull, lt, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { applications, articles, cases, messages, programRecords, records, users, type Role } from "@/db/schema";
import { CASE_CLOSED, ROLE_INFO, TRACKS, type ModuleKey } from "@/lib/domain";

/** Badge counts for the module navigation (only for modules the role can open). */
export const navCounts = cache(async (role: Role): Promise<Partial<Record<ModuleKey, number>>> => {
  const mods = ROLE_INFO[role].modules;
  const n = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
  const out: Partial<Record<ModuleKey, number>> = {};
  await Promise.all([
    mods.includes("applications") &&
      n(
        db
          .select({ n: count() })
          .from(applications)
          .where(
            and(
              ne(applications.decision, "Declined"),
              or(...Object.values(TRACKS).map((t) => and(eq(applications.kind, t.kind), lt(applications.stage, t.lastStage)))),
            ),
          ),
      ).then((v) => (out.applications = v)),
    mods.includes("directory") &&
      Promise.all([n(db.select({ n: count() }).from(records).where(eq(records.status, "Draft"))), n(db.select({ n: count() }).from(programRecords).where(eq(programRecords.status, "Draft")))]).then(
        ([a, b]) => (out.directory = a + b),
      ),
    mods.includes("news") && n(db.select({ n: count() }).from(articles).where(eq(articles.status, "Draft"))).then((v) => (out.news = v)),
    mods.includes("cases") && n(db.select({ n: count() }).from(cases).where(lt(cases.stage, CASE_CLOSED))).then((v) => (out.cases = v)),
    mods.includes("messages") && n(db.select({ n: count() }).from(messages).where(and(eq(messages.read, false), isNull(messages.archivedAt)))).then((v) => (out.messages = v)),
    mods.includes("users") && n(db.select({ n: count() }).from(users).where(eq(users.status, "pending"))).then((v) => (out.users = v)),
  ]);
  return out;
});
