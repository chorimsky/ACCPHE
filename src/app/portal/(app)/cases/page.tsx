import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { casePill, ModuleBody, ModuleHeader, Pill } from "@/components/portal/ui";
import { CASE_STAGES } from "@/lib/domain";
import { fmtDate } from "@/lib/format";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Complaints & appeals" };

export default async function CasesPage() {
  await requireModule("cases");
  const rows = await db.select().from(cases).orderBy(desc(cases.receivedAt));
  return (
    <>
      <ModuleHeader mod="cases">
        <Link href="/portal/cases/new" className="p-btn">
          + Log a case
        </Link>
      </ModuleHeader>
      <ModuleBody>
        <section className="overflow-x-auto rounded border border-line bg-white">
          <table className="p-table min-w-[820px]">
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">Type</th>
                <th scope="col">Subject</th>
                <th scope="col">Received</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="relative">
                  <td className="whitespace-nowrap text-slate" style={{ font: "600 13px var(--font-sans)" }}>
                    {c.ref}
                  </td>
                  <td>{c.type}</td>
                  <td>
                    <div className="flex flex-col gap-0.5">
                      <Link href={`/portal/cases/${c.id}`} className="text-navy no-underline after:absolute after:inset-0 hover:underline" style={{ font: "600 14.5px var(--font-sans)" }}>
                        {c.subject}
                      </Link>
                      <span className="text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
                        {c.institution}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">{fmtDate(c.receivedAt)}</td>
                  <td>
                    <Pill tone={casePill(c.stage)}>{CASE_STAGES[c.stage]}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="p-empty">No cases logged.</p>}
        </section>
      </ModuleBody>
    </>
  );
}
