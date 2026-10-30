import { notFound } from "next/navigation";
import { Back, ModuleBody, ModuleHeader, Pill, ratePill } from "@/components/portal/ui";
import { VotePanel } from "@/components/portal/vote-panel";
import { appTitle, awaitingDecision, RATING_LABELS, trackOf } from "@/lib/domain";
import { getStandardTitlesFor } from "@/server/content";
import { fmtDate } from "@/lib/format";
import { requireModule } from "@/server/auth";
import { deliberation, tallyOf } from "@/server/queries/decisions";
import { evidenceFile } from "@/server/queries/reviews";

export const metadata = { title: "Decision" };

export default async function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireModule("decisions");
  const { id } = await params;
  const d = await deliberation(id);
  if (!d || !awaitingDecision(d.app)) notFound();
  const { app, revs, vts, memberCount } = d;
  const mine = vts.find((v) => v.vote.voterId === user.id);
  const [evidence, STANDARD_TITLES] = await Promise.all([evidenceFile(app.id), getStandardTitlesFor(app.kind)]);
  const T = trackOf(app);
  return (
    <>
      <ModuleHeader mod="decisions" />
      <ModuleBody>
        <Back href="/portal/decisions">All decisions</Back>
        <section className="flex flex-col gap-1.5 rounded border border-line bg-white p-6">
          <span className="p-meta">
            {app.ref} · {app.kind === "program" ? `${T.label} · ${app.name}` : app.kind === "fellow" ? `${T.label} · sought: ${app.fellowDesignation}` : app.pathway} · {app.country}
          </span>
          <h2 className="p-h2">{appTitle(app)}</h2>
        </section>
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-6">
            {!revs.length && (
              <section className="rounded border border-line bg-white p-6">
                <h3 className="p-h3">Independent review report</h3>
                <p className="m-0 mt-3 text-warn" style={{ font: "400 14px var(--font-sans)" }}>
                  The review report has not been submitted. Deliberation should await the complete review record.
                </p>
              </section>
            )}
            {revs.map(({ review: r, reviewer }) => {
              const c = (k: string) => r.ratings.filter((x) => x === k).length;
              return (
                <section key={r.id} className="flex flex-col gap-3.5 rounded border border-line bg-white p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="p-h3">Independent review report — {reviewer}</h3>
                    <span className="text-slate" style={{ font: "500 12.5px var(--font-sans)" }}>
                      {c("met")} met · {c("partial")} partially met · {c("not")} not met · {fmtDate(r.submittedAt)}
                    </span>
                  </div>
                  <p className="m-0 border border-line bg-mist px-[18px] py-4 text-navy" style={{ font: "400 15px/1.65 var(--font-serif)" }}>
                    {r.summary}
                  </p>
                  <div className="flex flex-col">
                    {STANDARD_TITLES.map((t, i) => (
                      <div key={t} className="flex flex-col gap-1.5 border-t border-cloud py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-navy" style={{ font: "500 14px/1.4 var(--font-sans)" }}>
                            <span className="mr-2.5 font-semibold text-steel">{i + 1}</span>
                            {t}
                          </span>
                          <Pill tone={ratePill(r.ratings[i])}>{r.ratings[i] ? RATING_LABELS[r.ratings[i] as keyof typeof RATING_LABELS] : "Not rated"}</Pill>
                        </div>
                        {r.comments[i] && (
                          <p className="m-0 pl-6 text-muted" style={{ font: "400 13.5px/1.55 var(--font-sans)" }}>
                            {r.comments[i]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
            <section className="flex flex-col gap-2.5 rounded border border-line bg-white p-[22px]">
              <h3 className="p-h3">Evidence file</h3>
              {evidence.map((e) => (
                <div key={e.id} className="flex flex-wrap items-center justify-between gap-2.5 border-t border-cloud py-2">
                  <span className="text-navy" style={{ font: "500 13px var(--font-sans)" }}>
                    {e.name}
                  </span>
                  <span className="flex flex-wrap gap-3">
                    {e.files.map((f) => (
                      <a key={f.id} href={`/api/files/${f.id}`} style={{ font: "400 12.5px var(--font-sans)" }}>
                        {f.fileName}
                      </a>
                    ))}
                    {!e.files.length && (
                      <span className="text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
                        —
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </section>
          </div>
          <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
            <VotePanel applicationId={app.id} options={T.voteOptions} party={app.kind === "program" ? "this program or its provider" : app.kind === "fellow" ? "this candidate" : "this institution"} myVote={mine?.vote.vote ?? null} />
            <section className="flex flex-col gap-2.5 rounded border border-line bg-white p-[22px]">
              <h3 className="p-h3">Deliberation record</h3>
              <span className="text-slate" style={{ font: "600 12.5px var(--font-sans)" }}>
                {tallyOf(vts.map((v) => v.vote))} · {vts.length} of {memberCount} members
              </span>
              {vts.map((v) => (
                <div key={v.vote.id} className="flex flex-col gap-1 border-t border-cloud py-[11px]">
                  <div className="flex justify-between gap-2">
                    <span className="text-navy" style={{ font: "600 13px var(--font-sans)" }}>
                      {v.voter}
                    </span>
                    <span className="text-muted" style={{ font: "400 12px var(--font-sans)" }}>
                      {fmtDate(v.vote.createdAt)}
                    </span>
                  </div>
                  <span className="text-navy" style={{ font: "500 13.5px var(--font-sans)" }}>
                    {v.vote.vote}
                  </span>
                  {v.vote.note && (
                    <span className="text-muted" style={{ font: "400 13px/1.5 var(--font-sans)" }}>
                      {v.vote.note}
                    </span>
                  )}
                </div>
              ))}
              {!vts.length && (
                <span className="text-muted" style={{ font: "400 13px var(--font-sans)" }}>
                  No votes recorded yet.
                </span>
              )}
            </section>
          </aside>
        </div>
      </ModuleBody>
    </>
  );
}
