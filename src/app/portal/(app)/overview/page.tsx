import Link from "next/link";
import { and, count, desc, eq, inArray, isNull, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import { applicationNotes, applications, articles, auditLog, cases, messages, programRecords, records, requirements, reviews, users, votes } from "@/db/schema";
import { Greeting } from "@/components/portal/greeting";
import { Card, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { appTitle, awaitingDecision, CASE_CLOSED, CASE_STAGES, COMMISSION_QUORUM, isOpen, ROLE_INFO, TRACKS, trackOf, type ModuleKey } from "@/lib/domain";
import { daysFromToday, fmtDate, fmtRelative, isoDay } from "@/lib/format";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Overview" };

type Attention = { k: string; t: string; href: string };

export default async function OverviewPage() {
  const user = await requireModule("overview");
  const mods = ROLE_INFO[user.role].modules;
  const has = (m: ModuleKey) => mods.includes(m);

  const apps = has("applications") ? await db.select().from(applications) : [];
  const n = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
  const [publishedRecords, publishedPrograms, publishedArticles, openCases, unread] = await Promise.all([
    has("directory") ? n(db.select({ n: count() }).from(records).where(eq(records.status, "Published"))) : 0,
    has("directory") ? n(db.select({ n: count() }).from(programRecords).where(eq(programRecords.status, "Published"))) : 0,
    has("news") ? n(db.select({ n: count() }).from(articles).where(eq(articles.status, "Published"))) : 0,
    has("cases") ? n(db.select({ n: count() }).from(cases).where(lt(cases.stage, CASE_CLOSED))) : 0,
    has("messages") ? n(db.select({ n: count() }).from(messages).where(and(eq(messages.read, false), isNull(messages.archivedAt)))) : 0,
  ]);

  const kpis = [
    { mod: "applications" as const, n: apps.filter((a) => a.decision !== "Declined" && a.stage <= (a.kind === "program" ? 0 : 1)).length, t: "New inquiries, applications and eligibility reviews", href: "/portal/applications" },
    { mod: "applications" as const, n: apps.filter((a) => a.decision !== "Declined" && a.stage > (a.kind === "program" ? 0 : 1) && a.stage < trackOf(a).decisionStage).length, t: "Applications in evaluation", href: "/portal/applications" },
    { mod: "applications" as const, n: apps.filter(awaitingDecision).length, t: "Awaiting accreditation decision", href: "/portal/decisions" },
    { mod: "directory" as const, n: publishedRecords, t: "Published directory records", href: "/portal/directory?status=Published" },
    { mod: "directory" as const, n: publishedPrograms, t: "Published program records", href: "/portal/directory?kind=programs&status=Published" },
    { mod: "news" as const, n: publishedArticles, t: "Published articles", href: "/portal/news?status=Published" },
    { mod: "cases" as const, n: openCases, t: "Open complaints and appeals", href: "/portal/cases" },
    { mod: "messages" as const, n: unread, t: "Unread messages", href: "/portal/messages" },
  ].filter((k) => has(k.mod));

  const pipelines = (["institution", "program"] as const).map((k) => {
    const list = apps.filter((a) => a.kind === k && a.decision !== "Declined");
    const counts = TRACKS[k].stages.map((_, i) => list.filter((a) => a.stage === i).length);
    return { T: TRACKS[k], counts, max: Math.max(1, ...counts), total: list.length };
  });
  const att: Attention[] = [];
  if (has("applications") && apps.length) {
    const open = apps.filter(isOpen);
    const ids = open.map((a) => a.id);
    const [lastNotes, submittedDocs, submittedReviews, voteRows] = await Promise.all([
      ids.length ? db.select({ applicationId: applicationNotes.applicationId, kind: applicationNotes.kind, at: applicationNotes.createdAt }).from(applicationNotes).where(inArray(applicationNotes.applicationId, ids)).orderBy(desc(applicationNotes.createdAt)) : [],
      ids.length ? db.select({ applicationId: requirements.applicationId }).from(requirements).where(and(inArray(requirements.applicationId, ids), eq(requirements.status, "Submitted"))) : [],
      ids.length ? db.select({ applicationId: reviews.applicationId, submittedAt: reviews.submittedAt }).from(reviews).where(inArray(reviews.applicationId, ids)) : [],
      ids.length ? db.select({ applicationId: votes.applicationId, vote: votes.vote }).from(votes).where(and(inArray(votes.applicationId, ids), ne(votes.vote, "Recused"))) : [],
    ]);
    const latest = new Map<string, string>();
    for (const r of lastNotes) if (!latest.has(r.applicationId) && r.kind !== "system") latest.set(r.applicationId, r.kind);
    const href = (id: string) => `/portal/applications/${id}`;
    for (const a of open.filter(awaitingDecision)) att.push({ k: "Decision required", t: appTitle(a), href: href(a.id) });
    for (const a of open.filter((a) => !a.officerId)) att.push({ k: "Assign an officer", t: appTitle(a), href: href(a.id) });
    for (const a of open.filter((a) => latest.get(a.id) === "institution")) att.push({ k: a.kind === "program" ? "Provider awaiting reply" : "Institution awaiting reply", t: appTitle(a), href: href(a.id) });
    for (const id of new Set(submittedDocs.map((d) => d.applicationId))) {
      const a = open.find((x) => x.id === id);
      att.push({ k: "Review submitted documents", t: a ? appTitle(a) : "", href: href(id) });
    }
    for (const a of open.filter((a) => a.stage === trackOf(a).evaluationStage && submittedReviews.some((r) => r.applicationId === a.id && r.submittedAt))) att.push({ k: "Review report submitted", t: appTitle(a), href: href(a.id) });
    for (const a of open.filter((a) => awaitingDecision(a) && voteRows.filter((v) => v.applicationId === a.id).length >= COMMISSION_QUORUM))
      att.push({ k: "Commission quorum reached", t: appTitle(a), href: href(a.id) });
  }
  if (has("users")) {
    for (const u of await db.select().from(users).where(eq(users.status, "pending"))) att.push({ k: "Verify account request", t: `${u.name} — ${u.org}`, href: "/portal/users" });
  }
  if (has("directory")) {
    const all = await db.select().from(records);
    for (const r of all.filter((x) => x.status === "Draft")) att.push({ k: "Verify and publish record", t: r.name, href: `/portal/directory/${r.id}` });
    // Monitoring: published awards whose expiry or review date is within 90 days, or has passed.
    const today = isoDay();
    const soon = daysFromToday(90);
    for (const r of all.filter((x) => x.status === "Published" && x.review && x.review <= soon))
      att.push({ k: r.review < today ? `Review overdue · ${fmtDate(r.review)}` : `Review due · ${fmtDate(r.review)}`, t: r.name, href: `/portal/directory/${r.id}` });
    const progs = await db.select().from(programRecords);
    for (const r of progs.filter((x) => x.status === "Draft")) att.push({ k: "Verify and publish program record", t: r.title, href: `/portal/directory/programs/${r.id}` });
    for (const r of progs.filter((x) => x.status === "Published" && x.review && x.review <= soon))
      att.push({ k: r.review < today ? `Program validity ended · ${fmtDate(r.review)}` : `Program renewal due · ${fmtDate(r.review)}`, t: r.title, href: `/portal/directory/programs/${r.id}` });
  }
  if (has("cases")) {
    for (const c of await db.select().from(cases).where(lt(cases.stage, CASE_CLOSED)).orderBy(desc(cases.receivedAt)))
      att.push({ k: `${c.type} · ${CASE_STAGES[c.stage]}`, t: c.subject, href: `/portal/cases/${c.id}` });
  }
  if (has("news")) {
    for (const a of await db.select().from(articles).where(eq(articles.status, "Draft"))) att.push({ k: "Draft article", t: a.title, href: `/portal/news/${a.id}` });
  }
  if (has("messages")) {
    for (const m of await db.select().from(messages).where(and(eq(messages.read, false), isNull(messages.archivedAt))).orderBy(desc(messages.createdAt)))
      att.push({ k: `Unread · ${m.route}`, t: m.name, href: `/portal/messages?id=${m.id}` });
  }

  const quick = [
    { mod: "applications" as const, label: "Review applications", href: "/portal/applications" },
    { mod: "directory" as const, label: "+ New directory record", href: "/portal/directory/new" },
    { mod: "directory" as const, label: "+ New program record", href: "/portal/directory/programs/new" },
    { mod: "news" as const, label: "+ New article", href: "/portal/news/new" },
    { mod: "cases" as const, label: "+ Log a case", href: "/portal/cases/new" },
    { mod: "messages" as const, label: "Open messages", href: "/portal/messages" },
  ].filter((q) => has(q.mod));

  const activity = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(8);

  return (
    <>
      <ModuleHeader mod="overview" />
      <ModuleBody>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Greeting who={ROLE_INFO[user.role].who} />
          <div className="flex flex-wrap gap-2">
            {quick.map((q) => (
              <Link key={q.href} href={q.href} className="p-btn-secondary" style={{ padding: "9px 14px", fontSize: 13 }}>
                {q.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,148px),1fr))" }}>
          {kpis.map((k) => (
            <Link key={k.t} href={k.href} className="flex flex-col gap-2.5 rounded border border-line bg-white px-5 pb-[18px] pt-5 no-underline transition-shadow hover:border-steel hover:shadow-[0_8px_20px_rgba(20,43,69,.07)]">
              <span style={{ font: "500 38px/1 var(--font-serif)", color: "var(--color-navy)" }}>{k.n}</span>
              <span className="min-h-9 flex-1 text-slate" style={{ font: "500 13px/1.4 var(--font-sans)" }}>
                {k.t}
              </span>
              <span className="border-t border-cloud pt-2 text-navy" style={{ font: "600 12px var(--font-sans)" }}>
                View →
              </span>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-start gap-6">
          {has("applications") && (
            <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-6">
              {pipelines.map(({ T, counts, max, total }) => (
                <Card key={T.kind} className="gap-[18px]">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="p-h3">{T.kind === "program" ? "Program accreditation pipeline" : "Accreditation pipeline"}</h2>
                    <span className="text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
                      {total} {T.kind === "program" ? "program" : "institutional"} application{total === 1 ? "" : "s"} by current stage
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {T.stages.map((s, i) => {
                      const c = counts[i];
                      return (
                        <Link
                          key={s}
                          href={`/portal/applications?${T.kind === "program" ? "kind=program&" : ""}stage=${i}`}
                          className="grid grid-cols-[minmax(150px,230px)_1fr_28px] items-center gap-3.5 rounded-[3px] px-1.5 py-2 no-underline hover:bg-mist"
                        >
                          <span className="flex gap-2 text-navy" style={{ font: "500 13.5px var(--font-sans)" }}>
                            <span className="w-3.5 font-semibold text-steel">{i + 1}</span>
                            {s}
                          </span>
                          <span className="block h-2.5 overflow-hidden rounded-[1px] bg-cloud">
                            <span className="block h-full transition-[width]" style={{ width: `${c ? Math.max(4, (c / max) * 100) : 0}%`, background: i > T.decisionStage ? "var(--color-navy)" : "var(--color-slate)" }} />
                          </span>
                          <span className="text-right text-navy" style={{ font: "600 14px var(--font-sans)" }}>
                            {c}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}
          <Card className="flex-[1_1_320px] gap-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="p-h3">Requires attention</h2>
              <span className="text-slate" style={{ font: "600 12px var(--font-sans)" }}>
                {att.length}
              </span>
            </div>
            {!att.length && <p className="small m-0">Nothing outstanding.</p>}
            <div className="flex flex-col">
              {att.slice(0, 7).map((a, i) => (
                <Link key={i} href={a.href} className="flex items-center justify-between gap-3 border-t border-cloud py-3 no-underline hover:text-slate">
                  <span className="flex min-w-0 flex-col gap-[3px]">
                    <span className="text-slate" style={{ font: "600 11px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase" }}>
                      {a.k}
                    </span>
                    <span className="text-navy" style={{ font: "500 14px/1.4 var(--font-sans)" }}>
                      {a.t}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-steel">
                    →
                  </span>
                </Link>
              ))}
            </div>
            {att.length > 7 && (
              <p className="m-0 text-muted" style={{ font: "500 12.5px var(--font-sans)" }}>
                + {att.length - 7} more items in their modules
              </p>
            )}
          </Card>
        </div>

        <Card className="gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="p-h3">Recent activity</h2>
            {has("reports") && (
              <Link href="/portal/reports#audit" className="p-link">
                Full audit log →
              </Link>
            )}
          </div>
          <div className="flex flex-col">
            {activity.map((a) => (
              <div key={a.id} className="grid grid-cols-[10px_1fr_auto] items-baseline gap-3.5 border-t border-cloud py-[11px]">
                <span aria-hidden="true" className="h-[7px] w-[7px] -translate-y-px rounded-full bg-steel" />
                <span style={{ font: "400 14px/1.5 var(--font-sans)" }}>
                  <span className="font-semibold text-navy">{a.who}</span> — {a.summary}
                </span>
                <span className="whitespace-nowrap text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
                  {fmtRelative(a.createdAt)}
                </span>
              </div>
            ))}
            {!activity.length && <p className="small m-0">No activity yet.</p>}
          </div>
        </Card>
      </ModuleBody>
    </>
  );
}
