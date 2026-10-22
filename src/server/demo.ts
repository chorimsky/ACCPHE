import bcrypt from "bcryptjs";
import { ne, sql } from "drizzle-orm";
import { db } from "@/db";
import * as t from "@/db/schema";
import { DEFAULT_NOTICE, SEED_ARTICLES } from "@/content/site";
import { REQUIREMENTS } from "@/lib/domain";
import { DEMO_PASSWORD } from "@/server/demo-credentials";

/**
 * Demonstration data set — the same sample institutions, cases and messages as the approved prototype, plus one
 * portal account per role. Every institution and person is labelled "(demo)" / "Sample".
 * Demo accounts all use DEMO_PASSWORD (src/server/demo-credentials.ts).
 */
export { DEMO_PASSWORD };

export const DEMO_USERS = [
  { key: "admin", email: "admin@accphe.test", name: "Demo Administrator", position: "Executive Director", role: "admin" },
  { key: "officer", email: "officer@accphe.test", name: "Demo Accreditation Officer", position: "Deputy Director, Accreditation", role: "officer" },
  { key: "officer2", email: "compliance@accphe.test", name: "Demo Compliance Officer", position: "Program Officer — Compliance", role: "officer" },
  { key: "editor", email: "editor@accphe.test", name: "Demo Communications Editor", position: "Program Officer — Communications", role: "editor" },
  { key: "ethics", email: "ethics@accphe.test", name: "Demo Ethics Officer", position: "Secretary, Standards & Ethics Committee", role: "ethics" },
  { key: "reviewer", email: "reviewer@accphe.test", name: "Sample Reviewer", position: "Professor of Education", org: "Curriculum and assessment", role: "reviewer" },
  { key: "reviewer2", email: "reviewer2@accphe.test", name: "Sample Reviewer B", position: "Former Provost", org: "Academic governance", role: "reviewer" },
  { key: "c1", email: "commissioner.a@accphe.test", name: "Commissioner A", position: "Commission member", role: "commission" },
  { key: "c2", email: "commissioner.b@accphe.test", name: "Commissioner B", position: "Commission member", role: "commission" },
  { key: "c3", email: "commissioner.c@accphe.test", name: "Commissioner C", position: "Commission member", role: "commission" },
  { key: "inst", email: "registrar@example.edu", name: "Sample Registrar", position: "Registrar", org: "Sample Christian University (demo)", role: "institution", app: "a1" },
  { key: "inst3", email: "president@example.edu", name: "Sample President", position: "President", org: "Sample Business College (demo)", role: "institution", app: "a3" },
] as const;

const day = 864e5;
const ago = (n: number) => new Date(Date.now() - n * day);
const isoAgo = (n: number) => ago(n).toISOString().slice(0, 10);

export async function seedDemo(opts: { keepUserId?: string } = {}) {
  const year = new Date().getUTCFullYear();
  // Children first (foreign keys).
  for (const table of [t.votes, t.reviews, t.complianceSubmissions, t.files, t.applicationNotes, t.requirements, t.records, t.caseNotes, t.cases, t.messages, t.articles, t.auditLog, t.counters, t.emailOutbox, t.rateLimits, t.authTokens]) {
    await db.delete(table);
  }
  if (opts.keepUserId) {
    await db.delete(t.sessions).where(ne(t.sessions.userId, opts.keepUserId));
    await db.update(t.users).set({ applicationId: null });
    await db.delete(t.applications);
    await db.delete(t.users).where(ne(t.users.id, opts.keepUserId));
  } else {
    await db.delete(t.sessions);
    await db.update(t.users).set({ applicationId: null });
    await db.delete(t.applications);
    await db.delete(t.users);
  }
  const kept = opts.keepUserId ? (await db.select().from(t.users)).map((u) => u.email) : [];

  /* People */
  const hash = await bcrypt.hash(DEMO_PASSWORD, 11);
  const uid: Record<string, string> = {};
  for (const u of DEMO_USERS) {
    if (kept.includes(u.email)) continue;
    const [row] = await db
      .insert(t.users)
      .values({ email: u.email, name: u.name, position: u.position, org: "org" in u ? u.org : "", role: u.role, status: "active", passwordHash: hash, createdAt: ago(60) })
      .returning({ id: t.users.id });
    uid[u.key] = row.id;
  }
  // Two pending requests for the Users & access module.
  await db.insert(t.users).values([
    { email: "dean@example.edu", name: "Sample Dean", position: "Dean of Academics", org: "Sample Theological Seminary (demo)", role: "institution", status: "pending", passwordHash: hash, requestedRef: `ACC-${year}-0132`, createdAt: ago(1) },
    { email: "assessor@example.org", name: "Sample Assessor", position: "Associate Professor", org: "Quality assurance and accreditation", role: "reviewer", status: "pending", passwordHash: hash, createdAt: ago(2) },
  ]);

  /* Applications — as in the prototype seed */
  const apps = [
    { k: "a1", name: "Sample Christian University (demo)", country: "Kenya", type: "University", pathway: "Accreditation", stage: 3, officer: "officer", days: 120 },
    { k: "a2", name: "Sample Theological Seminary (demo)", country: "Philippines", type: "Seminary / theological institution", pathway: "Associate Membership", stage: 1, officer: "officer2", days: 14 },
    { k: "a3", name: "Sample Business College (demo)", country: "Ghana", type: "College", pathway: "Accreditation", stage: 6, officer: "officer", days: 210 },
    { k: "a4", name: "Sample Bible Institute (demo)", country: "Brazil", type: "Institute / school", pathway: "Associate Membership", stage: 0, officer: null, days: 3 },
    { k: "a5", name: "Sample Private University (demo)", country: "United Kingdom", type: "University", pathway: "Distinguished Membership inquiry", stage: 2, officer: "officer2", days: 40 },
    { k: "a6", name: "Sample College of Education (demo)", country: "Nigeria", type: "College", pathway: "Accreditation", stage: 4, officer: "officer2", days: 75 },
  ] as const;
  const aid: Record<string, string> = {};
  for (const [i, a] of apps.entries()) {
    const n = i + 1;
    const [row] = await db
      .insert(t.applications)
      .values({
        ref: `ACC-${year}-${String(130 + n).padStart(4, "0")}`,
        name: a.name,
        country: a.country,
        website: "https://example.edu",
        yearEstablished: String(1988 + n * 4),
        type: a.type,
        authRef: `REG-${4100 + n * 17}`,
        repName: "Sample Representative",
        repPosition: "Registrar",
        repEmail: "registrar@example.edu",
        repPhone: "+00 000 000 000",
        pathway: a.pathway,
        profile: "Demonstration record. Real submissions from the public inquiry form appear here with the details provided by the institution.",
        stage: a.stage,
        officerId: a.officer ? (uid[a.officer] ?? null) : null,
        checks: {},
        source: "website",
        submittedAt: ago(a.days),
        updatedAt: ago(Math.max(1, Math.floor(a.days / 5))),
      })
      .returning({ id: t.applications.id });
    aid[a.k] = row.id;
    await db.insert(t.requirements).values(
      REQUIREMENTS.map((name, position) => ({ applicationId: row.id, name, position, status: position < a.stage ? ("Received" as const) : ("Outstanding" as const) })),
    );
    await db.insert(t.applicationNotes).values({ applicationId: row.id, kind: "system", who: "Website", text: "Institutional inquiry received via the public website.", createdAt: ago(a.days) });
  }
  await db.insert(t.counters).values([
    { name: `acc:${year}`, value: 130 + apps.length },
    { name: `cmp:${year}`, value: 7 },
    { name: `apl:${year}`, value: 2 },
  ]);
  for (const u of DEMO_USERS) if ("app" in u && uid[u.key]) await db.update(t.users).set({ applicationId: aid[u.app] }).where(sql`${t.users.id} = ${uid[u.key]}`);

  /* Reviews and votes (prototype: a3 has a submitted report and one vote; a6 is in progress) */
  if (uid.reviewer) {
    await db.insert(t.reviews).values({
      applicationId: aid.a3,
      reviewerId: uid.reviewer,
      assignedById: uid.officer ?? null,
      coiConfirmedAt: ago(30),
      submittedAt: ago(9),
      ratings: ["met", "met", "met", "met", "partial", "met", "met", "partial", "met", "partial", "met", "met"],
      comments: [
        "Mission is published and consistently reflected in planning documents.",
        "Registration and program approvals verified.",
        "",
        "",
        "Professional development policy exists; participation records are incomplete.",
        "",
        "",
        "Digital library access is limited for distance learners.",
        "",
        "Improvement plans documented; evidence of closed actions is partial.",
        "",
        "",
      ],
      summary:
        "The institution substantially meets the standards. Recommend accreditation with a reporting condition on faculty development and internal quality assurance follow-through.",
      createdAt: ago(40),
    });
    await db.insert(t.reviews).values({
      applicationId: aid.a6,
      reviewerId: uid.reviewer,
      assignedById: uid.officer2 ?? null,
      coiConfirmedAt: ago(5),
      ratings: ["met", "met", "partial", "", "", "", "", "", "", "", "", ""],
      comments: ["", "", "Board minutes do not consistently record conflict-of-interest declarations.", "", "", "", "", "", "", "", "", ""],
      createdAt: ago(10),
    });
  }
  if (uid.c1) await db.insert(t.votes).values({ applicationId: aid.a3, voterId: uid.c1, vote: "Award accreditation", note: "Concur with the review team, including the reporting condition.", createdAt: ago(2) });

  /* Directory */
  await db.insert(t.records).values({ slug: "sample-institution-demo-record-kenya", name: "Sample Institution (demo record)", country: "Kenya", cls: "Associate Member", effective: isoAgo(5), status: "Draft", verified: false, updatedAt: ago(5) });

  /* Articles */
  const articleAge = [6, 8, 12, 1];
  await db.insert(t.articles).values(
    SEED_ARTICLES.map((a, i) => ({ ...a, category: a.category as t.ArticleCategory, status: a.status as "Draft" | "Published", date: isoAgo(articleAge[i]), createdAt: ago(articleAge[i]) })),
  );

  /* Cases */
  const [c1] = await db
    .insert(t.cases)
    .values({
      ref: `CMP-${year}-007`,
      type: "Complaint",
      subject: "Public representation of membership status",
      institution: "Institution under assessment",
      party: "Member of the public",
      details: "The complainant reports that an institution describes Associate Membership as accreditation in its admissions materials.",
      stage: 1,
      receivedAt: ago(9),
    })
    .returning({ id: t.cases.id });
  await db.insert(t.caseNotes).values({ caseId: c1.id, who: "Website", text: "Complaint received in writing.", createdAt: ago(9) });
  const [c2] = await db
    .insert(t.cases)
    .values({
      ref: `APL-${year}-002`,
      type: "Appeal",
      subject: "Request for reconsideration of monitoring conditions",
      institution: "Sample Business College (demo)",
      party: "Institution",
      details: "The institution requests reconsideration of a reporting condition on the grounds of procedural error.",
      stage: 3,
      receivedAt: ago(21),
    })
    .returning({ id: t.cases.id });
  await db.insert(t.caseNotes).values([
    { caseId: c2.id, who: "Website", text: "Appeal received within the published deadline.", createdAt: ago(21) },
    { caseId: c2.id, who: "Standards & Ethics Committee", text: "Panel appointed; members confirmed no conflict of interest.", createdAt: ago(12) },
  ]);

  /* Messages */
  await db.insert(t.messages).values([
    { name: "Sample Correspondent", org: "Ministry liaison office", email: "liaison@example.org", route: "Status verification", body: "We would like to confirm whether a named institution holds ACCPHE accreditation, and the effective date of any award.", createdAt: ago(0.2) },
    { name: "Sample Registrar", org: "Private college", email: "registrar@example.edu", route: "Membership and accreditation", body: "Could you clarify the documentation required for the preliminary eligibility review for an institution operating in two jurisdictions?", createdAt: ago(1.4) },
    { name: "Sample Journalist", org: "Higher education press", email: "press@example.com", route: "General inquiry", read: true, body: "I am preparing an article on quality assurance in faith-based higher education and would welcome a short comment from the Council.", createdAt: ago(4) },
  ]);

  /* Site content */
  await db
    .insert(t.siteContent)
    .values({ id: 1, notice: DEFAULT_NOTICE })
    .onConflictDoUpdate({ target: t.siteContent.id, set: { bannerOn: false, bannerText: "", notice: DEFAULT_NOTICE, email: "", phone: "", address: "", updatedAt: new Date() } });

  /* Activity */
  await db.insert(t.auditLog).values([
    { who: "Communications Office", action: "article.publish", entityType: "article", summary: "Article published: Proposed Institutional Accreditation Standards", createdAt: ago(6) },
    { who: "Website", action: "application.create", entityType: "application", entityId: aid.a4, summary: "New inquiry received from Sample Bible Institute (demo)", createdAt: ago(3) },
    { who: "Communications Office", action: "article.save", entityType: "article", summary: "Draft article created: Call for expressions of interest", createdAt: ago(1) },
    { who: "Accreditation Office", action: "application.stage", entityType: "application", entityId: aid.a6, summary: "Sample College of Education (demo) moved to Independent evaluation", createdAt: ago(0.5) },
  ]);
  return { users: Object.keys(uid).length, applications: apps.length };
}
