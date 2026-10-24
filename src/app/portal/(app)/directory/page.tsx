import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { programRecords, RECORD_STATUS, records } from "@/db/schema";
import { ActionButton } from "@/components/portal/actions";
import { InfoNote, KindSwitch, ModuleBody, ModuleHeader, Pill, recPill, Tabs } from "@/components/portal/ui";
import { fmtDate } from "@/lib/format";
import { togglePublish } from "@/server/actions/directory";
import { toggleProgramPublish } from "@/server/actions/programs";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Directory records" };

const Verified = ({ ok }: { ok: boolean }) =>
  ok ? (
    <span className="text-good" style={{ font: "600 12.5px var(--font-sans)" }}>
      ✓ Verified
    </span>
  ) : (
    <span className="text-warn" style={{ font: "500 12.5px var(--font-sans)" }}>
      Not verified
    </span>
  );

export default async function DirectoryRecordsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireModule("directory");
  const sp = await searchParams;
  const programs = sp.kind === "programs";
  const base = programs ? "/portal/directory?kind=programs" : "/portal/directory";
  const tab = RECORD_STATUS.find((s) => s === sp.status) ?? "All";
  const [institutionRows, programRows] = await Promise.all([db.select().from(records).orderBy(desc(records.updatedAt)), db.select().from(programRecords).orderBy(desc(programRecords.updatedAt))]);
  const all: { status: string }[] = programs ? programRows : institutionRows;
  const keep = (r: { status: string }) => tab === "All" || r.status === tab;
  const statusHref = (t: string) => (t === "All" ? base : `${base}${programs ? "&" : "?"}status=${t}`);

  return (
    <>
      <ModuleHeader mod="directory">
        <a href={programs ? "/portal/export/programs" : "/portal/export/directory"} className="p-btn-secondary">
          Export CSV
        </a>
        <Link href={programs ? "/portal/directory/programs/new" : "/portal/directory/new"} className="p-btn">
          {programs ? "+ New program record" : "+ New record"}
        </Link>
      </ModuleHeader>
      <ModuleBody>
        <KindSwitch
          label="Record type"
          items={[
            { href: "/portal/directory", label: "Institutions", n: institutionRows.length, on: !programs },
            { href: "/portal/directory?kind=programs", label: "Programs", n: programRows.length, on: programs },
          ]}
        />
        <InfoNote>
          {programs ? (
            <>
              Program records form the public <strong className="text-navy">directory of approved programs</strong>. Each has a unique verification number. Only Published records (or verified records that are
              Suspended, Withdrawn or Expired) are public, and publishing requires confirmation that a formal decision has been verified. Accreditation applies only to the approved program.
            </>
          ) : (
            <>
              Only <strong className="text-navy">Published</strong> records appear in the public directory (a verified record that is Suspended, Withdrawn or Expired is shown with its status). Publishing requires
              confirmation that a formal decision has been verified. Membership and accreditation are recorded as distinct classifications.
            </>
          )}
        </InfoNote>
        <section className="flex flex-col rounded border border-line bg-white">
          <div className="px-5 pt-1.5">
            <Tabs items={["All", ...RECORD_STATUS].map((t) => ({ href: statusHref(t), label: t, n: t === "All" ? all.length : all.filter((r) => r.status === t).length, on: t === tab }))} />
          </div>
          <div className="overflow-x-auto">
            {programs ? (
              <table className="p-table min-w-[860px]">
                <thead>
                  <tr>
                    <th scope="col">Program</th>
                    <th scope="col">Status awarded</th>
                    <th scope="col">Verification no.</th>
                    <th scope="col">Effective / valid until</th>
                    <th scope="col">Verification</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {programRows.filter(keep).map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <Link href={`/portal/directory/programs/${r.id}`} className="text-navy no-underline hover:underline" style={{ font: "600 14.5px var(--font-sans)" }}>
                            {r.title}
                          </Link>
                          <span className="text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
                            {r.provider} · {r.country}
                          </span>
                        </div>
                      </td>
                      <td>{r.award}</td>
                      <td className="whitespace-nowrap" style={{ font: "500 13px var(--font-sans)" }}>
                        {r.verification}
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-navy">{fmtDate(r.effective)}</span>
                          <span className="text-muted" style={{ fontSize: 12.5 }}>
                            Valid until {fmtDate(r.review)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Verified ok={r.verified} />
                      </td>
                      <td>
                        <Pill tone={recPill(r.status)}>{r.status}</Pill>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-4">
                          <Link href={`/portal/directory/programs/${r.id}`} className="p-link">
                            Edit
                          </Link>
                          {r.status === "Published" && (
                            <a href={`/directory/programs/${r.slug}`} target="_blank" rel="noopener" className="p-link">
                              View ↗
                            </a>
                          )}
                          {(r.status === "Published" || r.status === "Draft") && (
                            <ActionButton action={toggleProgramPublish.bind(null, r.id)} className="p-link" confirm={r.status === "Published" ? `Remove ${r.title} from the public directory?` : undefined}>
                              {r.status === "Published" ? "Unpublish" : "Publish"}
                            </ActionButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="p-table min-w-[760px]">
                <thead>
                  <tr>
                    <th scope="col">Institution</th>
                    <th scope="col">Classification</th>
                    <th scope="col">Effective / review</th>
                    <th scope="col">Verification</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {institutionRows.filter(keep).map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <Link href={`/portal/directory/${r.id}`} className="text-navy no-underline hover:underline" style={{ font: "600 14.5px var(--font-sans)" }}>
                            {r.name}
                          </Link>
                          <span className="text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
                            {r.country}
                          </span>
                        </div>
                      </td>
                      <td>{r.cls}</td>
                      <td className="whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-navy">{fmtDate(r.effective)}</span>
                          <span className="text-muted" style={{ fontSize: 12.5 }}>
                            Review {fmtDate(r.review)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Verified ok={r.verified} />
                      </td>
                      <td>
                        <Pill tone={recPill(r.status)}>{r.status}</Pill>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-4">
                          <Link href={`/portal/directory/${r.id}`} className="p-link">
                            Edit
                          </Link>
                          {r.status === "Published" && (
                            <a href={`/directory/${r.slug}`} target="_blank" rel="noopener" className="p-link">
                              View ↗
                            </a>
                          )}
                          {(r.status === "Published" || r.status === "Draft") && (
                            <ActionButton action={togglePublish.bind(null, r.id)} className="p-link" confirm={r.status === "Published" ? `Remove ${r.name} from the public directory?` : undefined}>
                              {r.status === "Published" ? "Unpublish" : "Publish"}
                            </ActionButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!all.filter(keep).length && <p className="p-empty">No records in this view.</p>}
          </div>
        </section>
      </ModuleBody>
    </>
  );
}
