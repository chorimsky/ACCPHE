import Link from "next/link";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { applicationNotes, applications, complianceSubmissions, files, requirements, users } from "@/db/schema";
import { NoteComposer } from "@/components/portal/actions";
import { ComplianceForm } from "@/components/portal/compliance-form";
import { docPill, ModuleBody, ModuleHeader, Pill } from "@/components/portal/ui";
import { UploadButton } from "@/components/portal/widgets";
import { appTitle, distinctionLabel, trackOf } from "@/lib/domain";
import { fmtDate } from "@/lib/format";
import { sendInstitutionMessage, uploadDocument } from "@/server/actions/institution";
import { requireModule } from "@/server/auth";
import { UPLOAD_ACCEPT } from "@/server/storage";

export const metadata = { title: "My application" };

export default async function MyApplicationPage() {
  const user = await requireModule("myapp");
  const [app] = user.applicationId ? await db.select().from(applications).where(eq(applications.id, user.applicationId)) : [];
  if (!app) {
    return (
      <>
        <ModuleHeader mod="myapp" />
        <ModuleBody>
          <div className="rounded border border-line bg-white px-6 py-12 text-center">
            <p className="m-0 text-navy" style={{ font: "500 19px var(--font-serif)" }}>
              Your account is not yet linked to an application.
            </p>
            <p className="m-0 mt-2 text-muted" style={{ font: "400 14px/1.6 var(--font-sans)" }}>
              The Secretariat links representative accounts to their application after verification. If you have not yet applied, use the <Link href="/apply">institutional inquiry form</Link> or the{" "}
              <Link href="/accreditation/programs/apply">program accreditation application</Link>.
            </p>
          </div>
        </ModuleBody>
      </>
    );
  }
  const [reqs, fs, thread, compliance, officer] = await Promise.all([
    db.select().from(requirements).where(eq(requirements.applicationId, app.id)).orderBy(asc(requirements.position)),
    db.select().from(files).where(eq(files.applicationId, app.id)).orderBy(asc(files.createdAt)),
    db.select().from(applicationNotes).where(and(eq(applicationNotes.applicationId, app.id), ne(applicationNotes.kind, "staff"))).orderBy(desc(applicationNotes.createdAt)),
    db.select().from(complianceSubmissions).where(eq(complianceSubmissions.applicationId, app.id)).orderBy(desc(complianceSubmissions.createdAt)),
    app.officerId ? db.select({ name: users.name, position: users.position }).from(users).where(eq(users.id, app.officerId)) : Promise.resolve([]),
  ]);
  const T = trackOf(app);
  const program = app.kind === "program";
  const fellow = app.kind === "fellow";
  const declined = app.decision === "Declined";
  const decided = app.stage > T.decisionStage && !declined;
  const accredited = app.stage === T.lastStage && !declined;
  const progress = declined ? 100 : (app.stage / T.lastStage) * 100;
  return (
    <>
      <ModuleHeader mod="myapp" />
      <ModuleBody>
        <section className="dark relative flex flex-col gap-5 overflow-hidden rounded p-7">
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-haze" style={{ font: "600 12.5px var(--font-sans)" }}>
                {app.ref} · {program ? T.label : fellow ? `${T.label} · ${distinctionLabel(app.fellowDesignation)}` : app.pathway} · Submitted {fmtDate(app.submittedAt)}
              </span>
              <h2 className="m-0" style={{ font: "500 clamp(24px,2.6vw,30px)/1.15 var(--font-serif)" }}>
                {appTitle(app)}
              </h2>
              {program && (
                <span className="text-fog" style={{ font: "500 14px var(--font-sans)" }}>
                  {app.name}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-haze" style={{ font: "600 12px var(--font-sans)" }}>
                {declined ? "Declined" : `Stage ${app.stage + 1} of ${T.stages.length}`}
              </span>
              <span style={{ font: "500 18px var(--font-serif)" }}>{declined ? "Application declined" : T.stages[app.stage]}</span>
            </div>
          </div>
          <div className="h-1 overflow-hidden rounded-sm bg-rule" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Progress through the pathway">
            <div className="h-full bg-mist transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-start gap-3.5 rounded-[3px] bg-navy-hover px-[18px] py-4">
            <span className="whitespace-nowrap pt-0.5 text-haze" style={{ font: "600 11px var(--font-sans)", letterSpacing: ".12em", textTransform: "uppercase" }}>
              Next step
            </span>
            <span style={{ font: "500 14.5px/1.55 var(--font-sans)" }}>
              {declined ? (fellow ? "The recognition body has not conferred the distinction. Contact the Secretariat for information on the appeals procedure." : "The authorized body has declined this application. Contact the Secretariat for information on the appeals procedure.") : T.actions[app.stage]}
            </span>
          </div>
          <span className="text-haze" style={{ font: "400 12.5px var(--font-sans)" }}>
            Responsible officer: {officer[0] ? `${officer[0].name}${officer[0].position ? `, ${officer[0].position}` : ""}` : "To be assigned"}
          </span>
        </section>

        <div className="flex flex-wrap items-start gap-6">
          <section className="flex min-w-0 flex-[1_1_340px] flex-col gap-1 rounded border border-line bg-white p-6">
            <h3 className="p-h3">Evaluation pathway</h3>
            <ol className="m-0 mt-3.5 flex list-none flex-col p-0">
              {T.stages.map((s, i) => {
                const done = i < app.stage || (accredited && i === T.lastStage);
                const current = !done && i === app.stage && !declined;
                return (
                  <li key={s} className="grid grid-cols-[30px_1fr] gap-3.5" aria-current={current ? "step" : undefined}>
                    <div className="flex flex-col items-center">
                      {done ? (
                        <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-navy text-mist" style={{ font: "700 11px var(--font-sans)" }}>
                          ✓
                        </span>
                      ) : current ? (
                        <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full border-2 border-navy text-navy" style={{ font: "700 11px var(--font-sans)", boxShadow: "0 0 0 4px rgba(69,98,124,.16)" }}>
                          {i + 1}
                        </span>
                      ) : (
                        <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full text-placeholder" style={{ border: "1.5px solid var(--color-line-strong)", font: "600 11px var(--font-sans)" }}>
                          {i + 1}
                        </span>
                      )}
                      {i < T.stages.length - 1 && <span aria-hidden="true" className="min-h-3.5 w-px flex-1 bg-line" />}
                    </div>
                    <div className="flex flex-col gap-1 pb-[18px] pt-[3px]">
                      <span style={{ font: `${current ? 700 : done ? 500 : 400} 14px var(--font-sans)`, color: current || done ? "var(--color-navy)" : "var(--color-placeholder)" }}>{s}</span>
                      {current && <span style={{ font: "400 13px/1.55 var(--font-sans)" }}>{T.desc[i]}</span>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <div className="flex min-w-0 flex-[1.4_1_420px] flex-col gap-6">
            <section className="flex flex-col gap-3 rounded border border-line bg-white p-6">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="p-h3">Required documents</h3>
                <span className="text-slate" style={{ font: "600 12px var(--font-sans)" }}>
                  {reqs.filter((r) => r.status === "Received").length} of {reqs.length} received
                </span>
              </div>
              <div className="flex flex-col">
                {reqs.map((r) => {
                  const mine = fs.filter((f) => f.requirementId === r.id);
                  return (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-cloud py-[13px]">
                      <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-[3px]">
                        <span className="text-navy" style={{ font: "500 14px/1.4 var(--font-sans)" }}>
                          {r.name}
                        </span>
                        {mine.map((f) => (
                          <a key={f.id} href={`/api/files/${f.id}`} className="truncate" style={{ font: "400 12.5px var(--font-sans)" }}>
                            {f.fileName}
                          </a>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <Pill tone={docPill(r.status)}>{r.status}</Pill>
                        {r.status !== "Received" && !declined && <UploadButton onUpload={uploadDocument.bind(null, r.id)} accept={UPLOAD_ACCEPT} />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <span className="text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
                PDF preferred · Word, Excel and images accepted · up to 4 MB per file.
              </span>
            </section>

            {decided && fellow && (
              <section className="flex flex-col gap-1.5 rounded border border-line bg-white p-6">
                <h3 className="p-h3">Continued professional standing</h3>
                <span className="text-muted" style={{ font: "400 13.5px/1.55 var(--font-sans)" }}>
                  Recognized individuals remain subject to the College’s professional conduct requirements. Certification holders must also satisfy renewal and continuing professional development requirements. Write
                  to the Secretariat below about any matter affecting your standing.
                </span>
              </section>
            )}
            {decided && !fellow && (
              <section className="flex flex-col gap-3.5 rounded border border-line bg-white p-6">
                <div className="flex flex-col gap-1">
                  <h3 className="p-h3">{program ? "Ongoing quality assurance" : "Maintaining accreditation"}</h3>
                  <span className="text-muted" style={{ font: "400 13.5px/1.55 var(--font-sans)" }}>
                    {program
                      ? "Submit periodic reports and disclose substantive changes to the approved program. Submissions are recorded and reviewed by the Secretariat."
                      : "Submit required reports and disclose material institutional changes. Submissions are recorded and reviewed by the Secretariat."}
                  </span>
                </div>
                <ComplianceForm />
                {compliance.map((c) => (
                  <div key={c.id} className="flex justify-between gap-3 border-t border-cloud py-2.5" style={{ font: "400 13.5px var(--font-sans)" }}>
                    <span>
                      <strong className="text-navy">{c.type}</strong> — {c.text.length > 240 ? `${c.text.slice(0, 240)}…` : c.text}
                    </span>
                    <span className="whitespace-nowrap text-muted">{fmtDate(c.createdAt)}</span>
                  </div>
                ))}
              </section>
            )}

            <section className="flex flex-col gap-3.5 rounded border border-line bg-white p-6">
              <h3 className="p-h3">Correspondence with the Secretariat</h3>
              <div className="flex max-h-[380px] flex-col gap-2.5 overflow-y-auto pr-1">
                {thread.map((n) =>
                  n.kind === "institution" ? (
                    <div key={n.id} className="flex max-w-[85%] flex-col gap-1 self-end rounded bg-navy px-3.5 py-3 text-mist">
                      <span className="text-haze" style={{ font: "600 11.5px var(--font-sans)" }}>
                        {program || fellow ? "You" : "Your institution"} · {fmtDate(n.createdAt)}
                      </span>
                      <span className="whitespace-pre-wrap" style={{ font: "400 14px/1.55 var(--font-sans)" }}>
                        {n.text}
                      </span>
                    </div>
                  ) : (
                    <div key={n.id} className="flex max-w-[85%] flex-col gap-1 self-start rounded border border-line bg-portal px-3.5 py-3">
                      <span className="text-slate" style={{ font: "600 11.5px var(--font-sans)" }}>
                        {n.kind === "system" ? "Status update" : n.who} · {fmtDate(n.createdAt)}
                      </span>
                      <span className="whitespace-pre-wrap" style={{ font: "400 14px/1.55 var(--font-sans)" }}>
                        {n.text}
                      </span>
                    </div>
                  ),
                )}
              </div>
              <NoteComposer placeholder="Write to the Secretariat…" buttons={[{ label: "Send message", primary: true, run: sendInstitutionMessage }]} />
            </section>
            <p className="m-0 text-muted" style={{ font: "400 12.5px/1.6 var(--font-sans)" }}>
              {fellow
                ? "Submitting an application does not guarantee recognition. The College’s distinctions are recognition issued by ACCPHE within its own professional framework; they are not academic degrees, professional licenses, governmental endorsements, or institutional accreditation."
                : program
                ? "Participation in the review does not constitute accreditation. Program accreditation applies only to the approved program, not to the provider or its other offerings."
                : "Participation in the evaluation pathway does not constitute accreditation. Institutions must represent their status accurately at every stage."}
            </p>
          </div>
        </div>
      </ModuleBody>
    </>
  );
}
