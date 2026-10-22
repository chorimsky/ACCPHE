import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, caseNotes, cases } from "@/db/schema";
import Link from "next/link";
import { ActionButton, NoteComposer } from "@/components/portal/actions";
import { Back, Card, casePill, ModuleBody, ModuleHeader, Pill, Stepper } from "@/components/portal/ui";
import { CASE_CLOSED, CASE_STAGES } from "@/lib/domain";
import { fmtDate, fmtRelative } from "@/lib/format";
import { addCaseNote, advanceCase, determineCase } from "@/server/actions/cases";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Case" };

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  await requireModule("cases");
  const { id } = await params;
  const [c] = await db.select().from(cases).where(eq(cases.id, id));
  if (!c) notFound();
  const notes = await db.select().from(caseNotes).where(eq(caseNotes.caseId, id)).orderBy(desc(caseNotes.createdAt));
  const closed = c.stage === CASE_CLOSED;
  const [linked] = c.applicationId ? await db.select({ id: applications.id, ref: applications.ref, name: applications.name }).from(applications).where(eq(applications.id, c.applicationId)) : [];
  return (
    <>
      <ModuleHeader mod="cases" />
      <ModuleBody>
        <Back href="/portal/cases">All cases</Back>
        <Card className="gap-[22px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="p-meta">
                {c.ref} · {c.type} · Received {fmtDate(c.receivedAt)}
              </span>
              <h2 className="m-0 text-navy" style={{ font: "500 25px/1.2 var(--font-serif)" }}>
                {c.subject}
              </h2>
            </div>
            <Pill tone={casePill(c.stage)}>{CASE_STAGES[c.stage]}</Pill>
          </div>
          <Stepper steps={CASE_STAGES} current={c.stage} done={closed} />
        </Card>
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-6">
            <Card className="gap-3">
              <span className="p-eyebrow">Details</span>
              <p className="m-0 whitespace-pre-wrap" style={{ font: "400 15px/1.65 var(--font-sans)" }}>
                {c.details}
              </p>
              {c.stage < CASE_CLOSED - 1 && (
                <div className="pt-2">
                  <ActionButton action={advanceCase.bind(null, c.id)} className="p-btn">
                    Move to {CASE_STAGES[c.stage + 1]} →
                  </ActionButton>
                </div>
              )}
              {c.stage === CASE_CLOSED - 1 && (
                <div className="mt-2 flex flex-col gap-2.5 rounded-[3px] border border-line bg-mist p-[18px]">
                  <span className="text-navy" style={{ font: "600 14px var(--font-sans)" }}>
                    Record the determination
                  </span>
                  <NoteComposer
                    rows={4}
                    placeholder="Outcome, reasons, and any corrective measures…"
                    buttons={[{ label: "Record determination and close", primary: true, run: determineCase.bind(null, c.id) }]}
                  />
                </div>
              )}
              {closed && (
                <div className="mt-2 flex flex-col gap-1.5 rounded-[3px] border border-good-line bg-good-bg p-[18px]">
                  <span className="text-good" style={{ font: "600 13px var(--font-sans)" }}>
                    Determination
                  </span>
                  <p className="m-0 whitespace-pre-wrap" style={{ font: "400 14.5px/1.6 var(--font-sans)", color: "#1F3A2A" }}>
                    {c.determination}
                  </p>
                </div>
              )}
            </Card>
            <Card className="gap-3.5">
              <h3 className="p-h3">Case record</h3>
              <NoteComposer placeholder="Add a note to the case record…" buttons={[{ label: "Add note", run: addCaseNote.bind(null, c.id) }]} />
              <div className="flex flex-col">
                {notes.map((n) => (
                  <div key={n.id} className="flex flex-col gap-1 border-t border-cloud py-[13px]">
                    <div className="flex flex-wrap gap-2.5">
                      <span className="text-navy" style={{ font: "600 13px var(--font-sans)" }}>
                        {n.who}
                      </span>
                      <span className="text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
                        {fmtDate(n.createdAt)} · {fmtRelative(n.createdAt)}
                      </span>
                    </div>
                    <p className="m-0 whitespace-pre-wrap" style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>
                      {n.text}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card as="aside" className="min-w-0 flex-[1_1_300px] gap-1" style={{ padding: 22 }}>
            <h3 className="p-h3">Case information</h3>
            <dl className="m-0 mt-2 flex flex-col">
              {[
                ["Type", c.type],
                ["Submitted by", c.party || "—"],
                ["Contact email", c.partyEmail || "—"],
                ["Concerning", c.institution || "—"],
                ["Handled by", "Standards & Ethics Committee"],
                ["Last updated", fmtDate(c.updatedAt)],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[110px_1fr] gap-2.5 border-t border-cloud py-2.5">
                  <dt className="text-muted" style={{ font: "500 12.5px var(--font-sans)" }}>
                    {k}
                  </dt>
                  <dd className="m-0 text-navy" style={{ font: "500 13.5px var(--font-sans)" }}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            {linked && (
              <p className="m-0 mt-2" style={{ font: "500 13.5px var(--font-sans)" }}>
                Application:{" "}
                <Link href={`/portal/applications/${linked.id}`}>
                  {linked.ref} — {linked.name}
                </Link>
              </p>
            )}
            <p className="m-0 mt-3 text-muted" style={{ font: "400 12.5px/1.55 var(--font-sans)" }}>
              Appeals are reviewed by individuals not responsible for the original decision. Conflicts of interest must be declared before review.
            </p>
          </Card>
        </div>
      </ModuleBody>
    </>
  );
}
