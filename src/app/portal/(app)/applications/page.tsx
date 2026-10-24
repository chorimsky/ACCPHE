import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { applications, users } from "@/db/schema";
import { appPill, KindSwitch, ModuleBody, ModuleHeader, Pill } from "@/components/portal/ui";
import { appTitle, TRACKS } from "@/lib/domain";
import { fmtRelative } from "@/lib/format";
import { requireModule } from "@/server/auth";
import { ListSearch } from "@/components/portal/list-search";

export const metadata = { title: "Applications" };

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireModule("applications");
  const sp = await searchParams;
  const kind = sp.kind === "program" ? "program" : "institution";
  const program = kind === "program";
  const T = TRACKS[kind];
  const q = (sp.q ?? "").trim().toLowerCase();
  const stage = sp.stage !== undefined && /^\d$/.test(sp.stage) ? Number(sp.stage) : null;
  const [everything, staff] = await Promise.all([db.select().from(applications).orderBy(desc(applications.updatedAt)), db.select({ id: users.id, name: users.name }).from(users)]);
  const all = everything.filter((a) => a.kind === kind);
  const officerName = new Map(staff.map((s) => [s.id, s.name]));
  const rows = all.filter((a) => (stage === null || a.stage === stage) && (!q || `${a.name} ${a.programTitle} ${a.ref} ${a.country}`.toLowerCase().includes(q)));
  const href = (over: { stage?: number | null; kind?: string }) => {
    const p = new URLSearchParams();
    const k = over.kind ?? kind;
    if (k === "program") p.set("kind", "program");
    if (sp.q && over.kind === undefined) p.set("q", sp.q);
    const st = over.stage === undefined ? null : over.stage;
    if (st !== null && over.kind === undefined) p.set("stage", String(st));
    const s = p.toString();
    return s ? `/portal/applications?${s}` : "/portal/applications";
  };
  return (
    <>
      <ModuleHeader mod="applications">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page */}
        <a href="/portal/export/applications" className="p-btn-secondary">
          Export CSV
        </a>
        <Link href={program ? "/portal/applications/new?kind=program" : "/portal/applications/new"} className="p-btn">
          {program ? "+ Log a program application" : "+ Log an inquiry"}
        </Link>
        <a href={program ? "/accreditation/programs/apply" : "/apply"} target="_blank" rel="noopener" className="p-btn-secondary">
          {program ? "Public program application ↗" : "Public inquiry form ↗"}
        </a>
      </ModuleHeader>
      <ModuleBody>
        <KindSwitch
          label="Application type"
          items={[
            { href: href({ kind: "institution" }), label: "Institutions", n: everything.filter((a) => a.kind === "institution").length, on: !program },
            { href: href({ kind: "program" }), label: "Programs", n: everything.filter((a) => a.kind === "program").length, on: program },
          ]}
        />
        <section className="flex flex-col rounded border border-line bg-white">
          <div className="flex flex-col gap-3.5 px-5 pt-[18px]">
            <ListSearch placeholder={program ? "Search by program, provider, reference, or country" : "Search by institution, reference, or country"} />
            <nav aria-label="Stage" className="flex gap-1.5 overflow-x-auto pb-3.5" style={{ scrollbarWidth: "none" }}>
              <Link href={href({ stage: null })} scroll={false} className="chip" aria-current={stage === null ? "page" : undefined}>
                All<span>{all.length}</span>
              </Link>
              {T.stages.map((s, i) => (
                <Link key={s} href={href({ stage: i })} scroll={false} className="chip" aria-current={stage === i ? "page" : undefined}>
                  {s}
                  <span>{all.filter((a) => a.stage === i).length}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="overflow-x-auto border-t border-line">
            <table className="p-table min-w-[860px]">
              <thead>
                <tr>
                  <th scope="col">Reference</th>
                  <th scope="col">{program ? "Program" : "Institution"}</th>
                  <th scope="col">{program ? "Category" : "Pathway"}</th>
                  <th scope="col">Stage</th>
                  <th scope="col">Officer</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="relative">
                    <td className="whitespace-nowrap text-slate" style={{ font: "600 13px var(--font-sans)" }}>
                      {a.ref}
                    </td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <Link href={`/portal/applications/${a.id}`} className="text-navy no-underline after:absolute after:inset-0 hover:underline" style={{ font: "600 14.5px var(--font-sans)" }}>
                          {appTitle(a)}
                        </Link>
                        <span className="text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
                          {program ? `${a.name} · ${a.country}` : a.country}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[220px]">{program ? a.programCategory || "—" : a.pathway}</td>
                    <td>
                      <Pill tone={appPill(a)}>{a.decision === "Declined" ? "Declined" : `${a.stage + 1} · ${T.stages[a.stage]}`}</Pill>
                    </td>
                    <td className="max-w-[180px] text-slate" style={{ fontSize: 13 }}>
                      {a.officerId ? (officerName.get(a.officerId) ?? "—") : "Unassigned"}
                    </td>
                    <td className="whitespace-nowrap text-muted">{fmtRelative(a.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <p className="p-empty">No applications match these filters.</p>}
          </div>
        </section>
      </ModuleBody>
    </>
  );
}
