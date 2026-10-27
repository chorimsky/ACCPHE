import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, cases, programRecords, records, users } from "@/db/schema";
import { ActionButton, NoteComposer } from "@/components/portal/actions";
import { appPill, Back, Card, docPill, ModuleBody, ModuleHeader, Pill, Stepper, type PillTone } from "@/components/portal/ui";
import { AdvanceButton, CheckItem, PickAndRun, SaveSelect, UploadButton } from "@/components/portal/widgets";
import { addApplicationNote, assignReviewer, decide, moveStage, removeReviewer, setOfficer, setRequirementStatus, staffUpload, toggleCheck } from "@/server/actions/applications";
import { appTitle, COMMISSION_QUORUM, trackOf } from "@/lib/domain";
import { fmtDate, fmtRelative } from "@/lib/format";
import { requireModule } from "@/server/auth";
import { applicationDetail, groupFiles, officerOptions } from "@/server/services/applications";
import { UPLOAD_ACCEPT } from "@/server/storage";

export const metadata = { title: "Application" };

const noteTag = (party: string): Record<string, [string, PillTone]> => ({
  system: ["System", "outline"],
  staff: ["Internal note", "soft"],
  message: [`Sent to ${party}`, "navy"],
  institution: [`From ${party}`, "warn"],
});

const counts = (ratings: string[]) => ({
  met: ratings.filter((x) => x === "met").length,
  partial: ratings.filter((x) => x === "partial").length,
  not: ratings.filter((x) => x === "not").length,
  rated: ratings.filter(Boolean).length,
});

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireModule("applications");
  const { id } = await params;
  const [exists] = await db.select({ id: applications.id }).from(applications).where(eq(applications.id, id));
  if (!exists) notFound();
  const d = await applicationDetail(id);
  const { app } = d;
  const T = trackOf(app);
  const program = app.kind === "program";
  const NOTE_TAG = noteTag(T.party);
  const [officers, reviewerPool, linkedAccounts, linkedCases, linkedRecord] = await Promise.all([
    officerOptions(),
    db.select({ id: users.id, name: users.name, org: users.org }).from(users).where(and(eq(users.role, "reviewer"), eq(users.status, "active"))).orderBy(asc(users.name)),
    db.select({ name: users.name, email: users.email, status: users.status }).from(users).where(and(eq(users.applicationId, id), eq(users.role, "institution"))),
    db.select({ id: cases.id, ref: cases.ref, type: cases.type, subject: cases.subject, stage: cases.stage }).from(cases).where(eq(cases.applicationId, id)),
    program
      ? db.select({ id: programRecords.id, status: programRecords.status, label: programRecords.verification }).from(programRecords).where(eq(programRecords.applicationId, id))
      : db.select({ id: records.id, status: records.status, label: records.name }).from(records).where(eq(records.applicationId, id)),
  ]);
  const record = linkedRecord[0];
  const recordHref = record ? (program ? `/portal/directory/programs/${record.id}` : `/portal/directory/${record.id}`) : program ? "/portal/directory?kind=programs" : "/portal/directory";
  const declined = app.decision === "Declined";
  const decided = declined || app.stage > T.decisionStage;
  const atDecision = !declined && app.stage === T.decisionStage && !app.decision;
  const canAdvance = !declined && app.stage !== T.decisionStage && app.stage < T.lastStage;
  const checks = T.checks[app.stage] ?? [];
  const got = app.checks[String(app.stage)] ?? [];
  const nDone = checks.filter((_, i) => got[i]).length;
  const byReq = groupFiles(d.files);
  const inquiryFiles = byReq.get("") ?? [];
  const tally = Object.entries(
    d.votes.reduce<Record<string, number>>((m, v) => ({ ...m, [v.vote.vote]: (m[v.vote.vote] ?? 0) + 1 }), {}),
  )
    .map(([k, n]) => `${k}: ${n}`)
    .join(" · ");
  const counted = d.votes.filter((v) => v.vote.vote !== "Recused").length;
  const assigned = new Set(d.reviews.map((r) => r.reviewer.id));
  const info: [string, string][] = [
    ["Reference", app.ref],
    ...(program
      ? ([
          ["Program", app.programTitle],
          ["Category", app.programCategory],
          ["Delivery", app.programDelivery],
          ["Duration", app.programDuration],
          ["Intended learners", app.programLearners],
          ["Provider", app.name],
        ] as [string, string][])
      : []),
    ["Country", app.country],
    [program ? "Provider type" : "Institution type", app.type],
    ["Year established", app.yearEstablished],
    ["Website", app.website],
    ...(program ? [] : ([["Facebook", app.facebook], ["LinkedIn", app.linkedin]] as [string, string][])),
    ["Authorization / registration", app.authRef],
    ["Representative", [app.repName, app.repPosition].filter(Boolean).join(", ")],
    ["Email", app.repEmail],
    ["Telephone", app.repPhone],
    ["Submitted", fmtDate(app.submittedAt)],
    ["Source", app.source === "website" ? "Public inquiry form" : "Logged by the Secretariat"],
  ];

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
      </ModuleHeader>
      <ModuleBody>
        <Back href={program ? "/portal/applications?kind=program" : "/portal/applications"}>{program ? "All program applications" : "All applications"}</Back>
        <Card className="gap-[22px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="p-meta">
                {app.ref} · {program ? T.label : app.pathway}
              </span>
              <h2 className="p-h2">{appTitle(app)}</h2>
              {program && (
                <span className="text-muted" style={{ font: "500 14px var(--font-sans)" }}>
                  {app.name} · {app.country}
                </span>
              )}
            </div>
            <Pill tone={appPill(app)}>{declined ? "Declined" : `Stage ${app.stage + 1} of ${T.stages.length} · ${T.stages[app.stage]}`}</Pill>
          </div>
          <Stepper steps={T.stages} current={app.stage} />
        </Card>

        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-6">
            <Card className="gap-3.5">
              <span className="p-eyebrow">Current stage</span>
              <p className="m-0" style={{ font: "400 15px/1.6 var(--font-sans)" }}>
                {T.desc[app.stage]}
              </p>
              {!declined && app.stage < T.lastStage && checks.length > 0 && (
                <div className="flex flex-col rounded-[3px] border border-line">
                  <div className="flex items-center justify-between gap-2.5 border-b border-line bg-mist px-4 py-3">
                    <span className="text-navy" style={{ font: "600 13px var(--font-sans)" }}>
                      Stage checklist
                    </span>
                    <span className="text-slate" style={{ font: "600 12px var(--font-sans)" }}>
                      {nDone} of {checks.length} complete
                    </span>
                  </div>
                  {checks.map((t, i) => (
                    <CheckItem key={`${app.stage}-${i}`} label={t} checked={!!got[i]} onToggle={toggleCheck.bind(null, app.id, app.stage, i)} />
                  ))}
                </div>
              )}
              {canAdvance && (
                <div className="flex flex-wrap gap-2.5 pt-1.5">
                  <AdvanceButton label={`Advance to ${T.stages[app.stage + 1]} →`} done={nDone} total={checks.length} onAdvance={moveStage.bind(null, app.id, 1)} />
                  {app.stage > 0 && app.stage < T.decisionStage && (
                    <ActionButton action={moveStage.bind(null, app.id, -1)} className="p-btn-secondary">
                      Return to previous stage
                    </ActionButton>
                  )}
                </div>
              )}
              {atDecision && (
                <div className="flex flex-col gap-3 rounded-[3px] border border-line bg-mist p-[18px]">
                  <span className="text-navy" style={{ font: "600 14px var(--font-sans)" }}>
                    Record the decision of the authorized body
                  </span>
                  <span className="text-muted" style={{ font: "400 13px/1.55 var(--font-sans)" }}>
                    {program
                      ? "Awards create a draft program record with a verification number. It becomes public only after verification and publication."
                      : "Awards create a draft directory record. It becomes public only after verification and publication."}
                    {d.votes.length > 0 && ` Commission: ${counted} vote${counted === 1 ? "" : "s"} recorded (quorum ${COMMISSION_QUORUM}).`}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {T.decisions.map((c) => (
                      <ActionButton key={c.value} action={decide.bind(null, app.id, c.value)} confirm={`Record the decision: ${c.value}?`} className="p-btn" pendingLabel="Recording…">
                        {c.label}
                      </ActionButton>
                    ))}
                    <ActionButton action={decide.bind(null, app.id, "Declined")} confirm={`Record that the authorized body has declined ${appTitle(app)}?`} className="p-btn-secondary">
                      Decline
                    </ActionButton>
                  </div>
                  <div>
                    <ActionButton action={moveStage.bind(null, app.id, -1)} className="p-link">
                      ← Return to {T.stages[T.decisionStage - 1].toLowerCase()}
                    </ActionButton>
                  </div>
                </div>
              )}
              {decided && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-line bg-mist px-[18px] py-4">
                  <span className="text-navy" style={{ font: "500 14px/1.5 var(--font-sans)" }}>
                    {declined
                      ? "This application was declined by the authorized body."
                      : app.decision
                        ? `Decision recorded: ${app.decision}.${record ? ` ${program ? `Program record ${record.label}` : "Directory record"} is ${record.status}.` : ""}${record?.status === "Published" ? "" : ` Verify and publish the ${program ? "program" : "directory"} record to make it public.`}`
                        : `This ${T.party === "provider" ? "program" : "institution"} is in the monitoring phase.`}
                  </span>
                  {!declined && (
                    <Link href={recordHref} className="p-btn-secondary">
                      {record ? (program ? "Open the program record" : "Open the directory record") : "Go to directory records"}
                    </Link>
                  )}
                </div>
              )}
            </Card>

            {(app.stage >= T.evaluationStage - 1 || d.reviews.length > 0) && (
              <Card className="gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="p-h3">Independent review</h3>
                  <span className="text-slate" style={{ font: "600 12.5px var(--font-sans)" }}>
                    {d.reviews.length ? `${d.reviews.filter((r) => r.review.submittedAt).length} of ${d.reviews.length} reports submitted` : "No reviewers appointed"}
                  </span>
                </div>
                {d.reviews.map(({ review: r, reviewer }) => {
                  const c = counts(r.ratings);
                  const state = r.conflictDeclaredAt ? "Conflict declared — reassign" : r.submittedAt ? `Report submitted ${fmtDate(r.submittedAt)}` : r.coiConfirmedAt ? `In progress · ${c.rated} of ${r.ratings.length} rated` : "Awaiting conflict-of-interest declaration";
                  return (
                    <div key={r.id} className="flex flex-col gap-1.5 border-t border-cloud py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-navy" style={{ font: "600 14px var(--font-sans)" }}>
                          {reviewer.name}
                          <span className="font-normal text-muted"> · {reviewer.org}</span>
                        </span>
                        <span className="flex items-center gap-3">
                          <Pill tone={r.conflictDeclaredAt ? "bad" : r.submittedAt ? "good" : c.rated ? "warn" : "outline"}>{state}</Pill>
                          {!r.submittedAt && !decided && (
                            <ActionButton action={removeReviewer.bind(null, r.id)} confirm={`Remove ${reviewer.name} from the review team?`} className="p-btn-danger" title="Remove from review team">
                              Remove
                            </ActionButton>
                          )}
                        </span>
                      </div>
                      {r.submittedAt && (
                        <>
                          <span className="text-navy" style={{ font: "500 13.5px var(--font-sans)" }}>
                            {c.met} met · {c.partial} partially met · {c.not} not met
                          </span>
                          <p className="m-0" style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>
                            {r.summary}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
                {!decided && (
                  <div className="border-t border-cloud pt-3">
                    <PickAndRun
                      options={reviewerPool.filter((r) => !assigned.has(r.id)).map((r) => ({ value: r.id, label: `${r.name} — ${r.org}` }))}
                      onRun={assignReviewer.bind(null, app.id)}
                      placeholder={reviewerPool.length ? "Appoint a reviewer…" : "No active reviewers — create accounts in Users & access"}
                      button="Appoint"
                    />
                  </div>
                )}
                {d.votes.length > 0 && (
                  <div className="flex flex-col gap-1.5 border-t border-cloud pt-3">
                    <span className="p-eyebrow">Commission deliberation</span>
                    <span className="text-navy" style={{ font: "600 13.5px var(--font-sans)" }}>
                      {tally}
                    </span>
                    {d.votes.map((v) => (
                      <span key={v.vote.id} className="text-muted" style={{ font: "400 13px/1.5 var(--font-sans)" }}>
                        {v.voter.name} — {v.vote.vote} · {fmtDate(v.vote.createdAt)}
                        {v.vote.note ? ` — “${v.vote.note}”` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            )}

            <Card className="gap-4">
              <h3 className="p-h3">Notes and correspondence</h3>
              <NoteComposer
                placeholder={`Write an internal note or a message to the ${T.party}…`}
                buttons={[
                  { label: "Add internal note", run: addApplicationNote.bind(null, app.id, "staff") },
                  { label: `Send to ${T.party}`, primary: true, run: addApplicationNote.bind(null, app.id, "message") },
                ]}
              />
              <div className="flex flex-col">
                {d.notes.map((n) => {
                  const [tag, tone] = NOTE_TAG[n.kind] ?? ["Note", "outline"];
                  return (
                    <div key={n.id} className="flex flex-col gap-1.5 border-t border-cloud py-3.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Pill tone={tone}>{tag}</Pill>
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
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
            <Card className="gap-3" style={{ padding: 22 }}>
              <h3 className="p-h3">Assigned officer</h3>
              <SaveSelect
                label="Assigned officer"
                value={app.officerId ?? ""}
                options={[{ value: "", label: "Unassigned" }, ...officers.map((o) => ({ value: o.id, label: o.position ? `${o.name} — ${o.position}` : o.name }))]}
                onSave={setOfficer.bind(null, app.id)}
              />
            </Card>

            <Card className="gap-3" style={{ padding: 22 }}>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="p-h3">Documents</h3>
                <span className="text-slate" style={{ font: "600 12px var(--font-sans)" }}>
                  {d.reqs.filter((r) => r.status === "Received").length} of {d.reqs.length} received
                </span>
              </div>
              <div className="flex flex-col">
                {d.reqs.map((r) => {
                  const fs = byReq.get(r.id) ?? [];
                  return (
                    <div key={r.id} className="flex flex-col gap-1.5 border-t border-cloud py-[11px]">
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="text-navy" style={{ font: "500 13.5px/1.4 var(--font-sans)" }}>
                          {r.name}
                        </span>
                        <Pill tone={docPill(r.status)}>{r.status}</Pill>
                      </div>
                      {fs.map((f) => (
                        <a key={f.id} href={`/api/files/${f.id}`} className="truncate" style={{ font: "400 12.5px var(--font-sans)" }}>
                          {f.fileName} <span className="text-muted no-underline">· {f.uploadedByLabel}</span>
                        </a>
                      ))}
                      {!fs.length && (
                        <span className="text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
                          No file submitted
                        </span>
                      )}
                      <div className="flex flex-wrap items-center justify-end gap-3">
                        {!decided && <UploadButton onUpload={staffUpload.bind(null, r.id)} label="File a document" accept={UPLOAD_ACCEPT} />}
                        <ActionButton action={setRequirementStatus.bind(null, r.id, r.status === "Received" ? "Outstanding" : "Received")} className="p-link">
                          {r.status === "Received" ? "Mark outstanding" : "Mark received"}
                        </ActionButton>
                      </div>
                    </div>
                  );
                })}
                {inquiryFiles.length > 0 && (
                  <div className="flex flex-col gap-1.5 border-t border-cloud py-[11px]">
                    <span className="text-navy" style={{ font: "500 13.5px/1.4 var(--font-sans)" }}>
                      Submitted with the inquiry
                    </span>
                    {inquiryFiles.map((f) => (
                      <a key={f.id} href={`/api/files/${f.id}`} className="truncate" style={{ font: "400 12.5px var(--font-sans)" }}>
                        {f.fileName}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="gap-2.5" style={{ padding: 22 }}>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="p-h3">{program ? "Program and provider" : "Institution details"}</h3>
                <Link href={`/portal/applications/${app.id}/edit`} className="p-link">
                  Edit
                </Link>
              </div>
              <dl className="m-0 flex flex-col">
                {info.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[130px_1fr] gap-2.5 border-t border-cloud py-[9px]">
                    <dt className="text-muted" style={{ font: "500 12.5px var(--font-sans)" }}>
                      {k}
                    </dt>
                    <dd className="m-0 break-words text-navy" style={{ font: "500 13.5px/1.45 var(--font-sans)" }}>
                      {v || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
              <span className="p-eyebrow">{program ? "Program description and objectives" : "Institutional profile"}</span>
              <p className="m-0 whitespace-pre-wrap" style={{ font: "400 13.5px/1.6 var(--font-sans)" }}>
                {app.profile || "—"}
              </p>
              {linkedCases.length > 0 && (
                <>
                  <span className="p-eyebrow pt-1">Complaints &amp; appeals</span>
                  {linkedCases.map((c) => (
                    <a key={c.id} href={`/portal/cases/${c.id}`} style={{ font: "500 13.5px/1.5 var(--font-sans)" }}>
                      {c.ref} · {c.type}: {c.subject}
                    </a>
                  ))}
                </>
              )}
              <span className="p-eyebrow pt-1">Portal access</span>
              <p className="m-0" style={{ font: "400 13.5px/1.6 var(--font-sans)" }}>
                {linkedAccounts.length ? linkedAccounts.map((u) => `${u.name} <${u.email}>${u.status !== "active" ? ` (${u.status})` : ""}`).join(", ") : "No representative account is linked yet. Messages are emailed to the representative address."}
              </p>
            </Card>
          </div>
        </div>
      </ModuleBody>
    </>
  );
}
