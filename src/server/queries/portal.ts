import "server-only";
import { cache } from "react";
import { and, count, eq, isNull, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import { applications, articles, cases, messages, records, users, type Role } from "@/db/schema";
import { CASE_CLOSED, LAST_STAGE, ROLE_INFO, type ModuleKey } from "@/lib/domain";

/** Badge counts for the module navigation (only for modules the role can open). */
export const navCounts = cache(async (role: Role): Promise<Partial<Record<ModuleKey, number>>> => {
  const mods = ROLE_INFO[role].modules;
  const n = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
  const out: Partial<Record<ModuleKey, number>> = {};
  await Promise.all([
    mods.includes("applications") &&
      n(db.select({ n: count() }).from(applications).where(and(lt(applications.stage, LAST_STAGE), ne(applications.decision, "Declined")))).then((v) => (out.applications = v)),
    mods.includes("directory") && n(db.select({ n: count() }).from(records).where(eq(records.status, "Draft"))).then((v) => (out.directory = v)),
    mods.includes("news") && n(db.select({ n: count() }).from(articles).where(eq(articles.status, "Draft"))).then((v) => (out.news = v)),
    mods.includes("cases") && n(db.select({ n: count() }).from(cases).where(lt(cases.stage, CASE_CLOSED))).then((v) => (out.cases = v)),
    mods.includes("messages") && n(db.select({ n: count() }).from(messages).where(and(eq(messages.read, false), isNull(messages.archivedAt)))).then((v) => (out.messages = v)),
    mods.includes("users") && n(db.select({ n: count() }).from(users).where(eq(users.status, "pending"))).then((v) => (out.users = v)),
  ]);
  return out;
});
