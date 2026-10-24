import "server-only";
import { cache } from "react";
import { and, desc, eq, gte, inArray, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { articles, programRecordEvents, programRecords, recordEvents, records, siteContent } from "@/db/schema";
import { DEFAULT_NOTICE } from "@/content/site";
import { isoDay } from "@/lib/format";

export type SiteContent = typeof siteContent.$inferSelect;

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const [row] = await db.select().from(siteContent).where(eq(siteContent.id, 1));
  return row ?? { id: 1, bannerOn: false, bannerText: "", notice: DEFAULT_NOTICE, email: "", phone: "", address: "", updatedAt: new Date(0) };
});

export const publishedArticles = cache(async () =>
  db
    .select({ id: articles.id, slug: articles.slug, title: articles.title, category: articles.category, date: articles.date, excerpt: articles.excerpt, updatedAt: articles.updatedAt })
    .from(articles)
    // Articles dated in the future are scheduled: they appear on their publication date.
    .where(and(eq(articles.status, "Published"), lte(articles.date, isoDay())))
    .orderBy(desc(articles.date), desc(articles.createdAt)),
);

export async function articleBySlug(slug: string) {
  const [a] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.status, "Published"), lte(articles.date, isoDay())));
  return a ?? null;
}

/**
 * Records visible to the public: Published, plus verified records whose status changed (suspended, withdrawn,
 * expired) so that a change in status is "reflected promptly in the public directory".
 */
const visible = or(eq(records.status, "Published"), and(eq(records.verified, true), inArray(records.status, ["Suspended", "Withdrawn", "Expired"])));

export const publicRecords = cache(async () => db.select().from(records).where(visible).orderBy(records.name));

export async function recordBySlug(slug: string) {
  const [r] = await db
    .select()
    .from(records)
    .where(and(eq(records.slug, slug), visible));
  return r ?? null;
}

/** Official developments of the last six months (new publications and status changes), newest first. */
export async function recentDevelopments() {
  const since = new Date(Date.now() - 183 * 864e5);
  return db
    .select({ event: recordEvents, record: { slug: records.slug, name: records.name, country: records.country } })
    .from(recordEvents)
    .innerJoin(records, eq(records.id, recordEvents.recordId))
    .where(and(visible, gte(recordEvents.createdAt, since)))
    .orderBy(desc(recordEvents.createdAt));
}

export async function recordHistory(recordId: string) {
  return db.select().from(recordEvents).where(eq(recordEvents.recordId, recordId)).orderBy(desc(recordEvents.createdAt));
}

/* ─────────── Directory of approved programs ─────────── */

const programVisible = or(eq(programRecords.status, "Published"), and(eq(programRecords.verified, true), inArray(programRecords.status, ["Suspended", "Withdrawn", "Expired"])));

export const publicPrograms = cache(async () => db.select().from(programRecords).where(programVisible).orderBy(programRecords.title));

export async function programBySlug(slug: string) {
  const [r] = await db
    .select()
    .from(programRecords)
    .where(and(eq(programRecords.slug, slug), programVisible));
  return r ?? null;
}

/** Look up a public program by its verification number (case- and spacing-insensitive). */
export async function programByVerification(code: string) {
  const v = code.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^ACCPHE-P-\d{4}-\d{4}$/.test(v)) return null;
  const [r] = await db
    .select()
    .from(programRecords)
    .where(and(eq(programRecords.verification, v), programVisible));
  return r ?? null;
}

export async function programHistory(programId: string) {
  return db.select().from(programRecordEvents).where(eq(programRecordEvents.programId, programId)).orderBy(desc(programRecordEvents.createdAt));
}
