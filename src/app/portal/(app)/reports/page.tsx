import { desc, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, auditLog, cases, CLASSIFICATIONS, PROGRAM_AWARDS, programRecords, records } from "@/db/schema";
import { ListSearch } from "@/components/portal/list-search";
import { Bars, Card, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { CASE_CLOSED, CASE_STAGES, isOpen } from "@/lib/domain";
import { daysSince, fmtDateTime } from "@/lib/format";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Reports & audit" };

const PAGE = 100;

function group<T>(arr: T[], f: (x: T) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const x of arr) m.set(f(x) || "—", (m.get(f(x) || "—") ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireModule("reports");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(0, Number(sp.page ?? 0) || 0);
  const [apps, recs, progs, cs] = await Promise.all([db.select().from(applications), db.select().from(records), db.select().from(programRecords), db.select().from(cases)]);
  const where = q ? or(like(auditLog.summary, `%${q}%`), like(auditLog.who, `%${q}%`)) : undefined;
  const [audit, [{ n: total }]] = await Promise.all([
    db.select().from(auditLog).where(where).orderBy(desc(auditLog.createdAt)).limit(PAGE).offset(page * PAGE),
    db.select({ n: sql<number>`count(*)` }).from(auditLog).where(where),
  ]);
  const open = apps.filter(isOpen);
  const avgDays = open.length ? Math.round(open.reduce((t, a) => t + daysSince(a.submittedAt), 0) / open.length) : 0;
  const kpis = [
    { n: apps.length, t: "Applications on record" },
    { n: open.length, t: "Open in the pathway" },
    { n: `${avgDays} d`, t: "Average time in pathway (open)" },
    { n: apps.filter((a) => a.decision && a.decision !== "Declined").length, t: "Awards recorded" },
    { n: recs.filter((r) => r.status === "Published").length, t: "Published directory records" },
    { n: progs.filter((r) => r.status === "Published").length, t: "Published program records" },
    { n: `${cs.filter((c) => c.stage === CASE_CLOSED).length} / ${cs.length}`, t: "Cases determined" },
  ];
  const pageHref = (p: number) => `/portal/reports?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) }).toString()}#audit`;
  return (
    <>
      <ModuleHeader mod="reports">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page */}
        <a href="/portal/export/applications" className="p-btn-secondary">
          Applications CSV
        </a>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page */}
        <a href="/portal/export/directory" className="p-btn-secondary">
          Directory CSV
        </a>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page */}
        <a href="/portal/export/programs" className="p-btn-secondary">
          Programs CSV
        </a>
      </ModuleHeader>
      <ModuleBody>
        <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,180px),1fr))" }}>
          {kpis.map((k) => (
            <div key={k.t} className="flex flex-col gap-2 rounded border border-line bg-white p-5">
              <span style={{ font: "500 34px/1 var(--font-serif)", color: "var(--color-navy)" }}>{k.n}</span>
              <span className="text-slate" style={{ font: "500 13px/1.4 var(--font-sans)" }}>
                {k.t}
              </span>
            </div>
          ))}
        </div>
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))" }}>
          <Card className="gap-2.5" style={{ padding: 22 }}>
            <h2 className="p-h3">Applications by pathway</h2>
            <Bars rows={group(apps, (a) => (a.kind === "program" ? "Program accreditation" : a.pathway))} />
          </Card>
          <Card className="gap-2.5" style={{ padding: 22 }}>
            <h2 className="p-h3">Applications by country</h2>
            <Bars rows={group(apps, (a) => a.country).slice(0, 8)} />
          </Card>
          <Card className="gap-2.5" style={{ padding: 22 }}>
            <h2 className="p-h3">Directory records by classification</h2>
            <Bars rows={CLASSIFICATIONS.map((c) => [c, recs.filter((r) => r.cls === c).length] as [string, number])} />
          </Card>
          <Card className="gap-2.5" style={{ padding: 22 }}>
            <h2 className="p-h3">Program records by status awarded</h2>
            <Bars rows={PROGRAM_AWARDS.map((c) => [c, progs.filter((r) => r.award === c).length] as [string, number])} />
          </Card>
          <Card className="gap-2.5" style={{ padding: 22 }}>
            <h2 className="p-h3">Complaints and appeals by status</h2>
            <Bars rows={CASE_STAGES.map((c, i) => [c, cs.filter((x) => x.stage === i).length] as [string, number])} />
          </Card>
        </div>
        <section id="audit" className="flex scroll-mt-4 flex-col rounded border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3.5 pt-5">
            <h2 className="p-h3">Audit log</h2>
            <div className="flex flex-wrap items-center gap-2.5">
              <ListSearch placeholder="Filter by action or office" className="p-input w-60" />
              <a href={`/portal/export/audit${q ? `?q=${encodeURIComponent(q)}` : ""}`} className="p-btn-secondary" style={{ fontSize: 13 }}>
                Export CSV
              </a>
            </div>
          </div>
          <div className="overflow-x-auto border-t border-line">
            <table className="p-table min-w-[680px]">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Office</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((a) => (
                  <tr key={a.id}>
                    <td className="whitespace-nowrap text-muted">{fmtDateTime(a.createdAt)}</td>
                    <td className="whitespace-nowrap font-semibold text-navy">{a.who}</td>
                    <td>{a.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!audit.length && <p className="p-empty">No entries match.</p>}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
              <span>
                Showing {total ? page * PAGE + 1 : 0}–{Math.min(total, (page + 1) * PAGE)} of {total} entries. The audit log is append-only.
              </span>
              <span className="flex gap-4">
                {page > 0 && (
                  <a href={pageHref(page - 1)} className="p-link">
                    ← Newer
                  </a>
                )}
                {(page + 1) * PAGE < total && (
                  <a href={pageHref(page + 1)} className="p-link">
                    Older →
                  </a>
                )}
              </span>
            </div>
          </div>
        </section>
      </ModuleBody>
    </>
  );
}
