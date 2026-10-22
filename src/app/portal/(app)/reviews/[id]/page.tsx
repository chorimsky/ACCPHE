import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, reviews } from "@/db/schema";
import { CoiDeclaration, ReviewEditor } from "@/components/portal/review-editor";
import { Back, docPill, ModuleBody, ModuleHeader, Pill, ratePill } from "@/components/portal/ui";
import { EVALUATION_STAGE, RATING_LABELS } from "@/lib/domain";
import { getStandardTitles } from "@/server/content";
import { fmtDate } from "@/lib/format";
import { requireModule } from "@/server/auth";
import { evidenceFile } from "@/server/queries/reviews";

export const metadata = { title: "Review" };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireModule("reviews");
  const { id } = await params;
  const [row] = await db
    .select({ review: reviews, app: applications })
    .from(reviews)
    .innerJoin(applications, eq(applications.id, reviews.applicationId))
    .where(and(eq(reviews.id, id), eq(reviews.reviewerId, user.id)));
  if (!row || row.review.conflictDeclaredAt) notFound();
  const { review: r, app: a } = row;
  const [evidence, STANDARD_TITLES] = await Promise.all([evidenceFile(a.id), getStandardTitles()]);
  const c = (k: string) => r.ratings.filter((x) => x === k).length;
  const rated = r.ratings.filter(Boolean).length;
  const editable = !!r.coiConfirmedAt && !r.submittedAt;
  return (
    <>
      <ModuleHeader mod="reviews" />
      <ModuleBody>
        <Back href="/portal/reviews">My reviews</Back>
        <section className="flex flex-wrap items-end justify-between gap-4 rounded border border-line bg-white p-6">
          <div className="flex flex-col gap-1.5">
            <span className="p-meta">
              {a.ref} · {a.pathway} · {a.country}
            </span>
            <h2 className="p-h2">{a.name}</h2>
          </div>
          <div className="flex min-w-[220px] flex-col gap-1.5">
            <span className="text-navy" style={{ font: "600 12.5px var(--font-sans)" }}>
              {rated} of 12 rated
            </span>
            <span className="block h-1.5 overflow-hidden rounded-[3px] bg-cloud">
              <span className="block h-full bg-navy" style={{ width: `${(rated / 12) * 100}%` }} />
            </span>
            <span className="text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
              {c("met")} met · {c("partial")} partially met · {c("not")} not met
            </span>
          </div>
        </section>

        {!r.coiConfirmedAt && <CoiDeclaration reviewId={r.id} />}
        {r.coiConfirmedAt && a.stage < EVALUATION_STAGE && !r.submittedAt && (
          <div className="p-note">
            <span aria-hidden="true" className="info-dot">
              i
            </span>
            <span>You can prepare your ratings now. The report can be submitted once the application reaches the independent evaluation stage.</span>
          </div>
        )}
        {editable && <ReviewEditor reviewId={r.id} ratings={r.ratings} comments={r.comments} summary={r.summary} titles={STANDARD_TITLES} />}
        {r.submittedAt && (
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-3">
              {STANDARD_TITLES.map((t, i) => (
                <section key={t} className="flex flex-col gap-3 rounded border border-line bg-white px-[22px] py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-baseline gap-3">
                      <span className="w-[26px]" style={{ font: "500 20px/1 var(--font-serif)", color: "var(--color-steel)" }}>
                        {i + 1}
                      </span>
                      <span className="text-navy" style={{ font: "600 15.5px/1.35 var(--font-serif)" }}>
                        {t}
                      </span>
                    </div>
                    <Pill tone={ratePill(r.ratings[i])}>{r.ratings[i] ? RATING_LABELS[r.ratings[i] as keyof typeof RATING_LABELS] : "Not rated"}</Pill>
                  </div>
                  {r.comments[i] && (
                    <p className="m-0 pl-[38px]" style={{ font: "400 14px/1.6 var(--font-sans)" }}>
                      {r.comments[i]}
                    </p>
                  )}
                </section>
              ))}
            </div>
            <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-3 rounded border border-line bg-white p-[22px]">
              <h3 className="p-h3">Summary and recommendation</h3>
              <p className="m-0 whitespace-pre-wrap" style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>
                {r.summary}
              </p>
              <span className="pill pill-good self-start">Submitted {fmtDate(r.submittedAt)}</span>
            </aside>
          </div>
        )}

        {r.coiConfirmedAt && (
          <section className="flex max-w-[860px] flex-col gap-2.5 rounded border border-line bg-white p-[22px]">
            <h3 className="p-h3">Evidence file</h3>
            {evidence.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2.5 border-t border-cloud py-[9px]">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-navy" style={{ font: "500 13px/1.35 var(--font-sans)" }}>
                    {e.name}
                  </span>
                  {e.files.length ? (
                    e.files.map((f) => (
                      <a key={f.id} href={`/api/files/${f.id}`} style={{ font: "400 12px var(--font-sans)" }}>
                        {f.fileName}
                      </a>
                    ))
                  ) : (
                    <span className="text-muted" style={{ font: "400 12px var(--font-sans)" }}>
                      Not yet submitted
                    </span>
                  )}
                </div>
                <Pill tone={docPill(e.status)}>{e.status}</Pill>
              </div>
            ))}
            <span className="text-muted" style={{ font: "400 12.5px/1.5 var(--font-sans)" }}>
              Institutional profile: {a.profile || "—"}
            </span>
          </section>
        )}
      </ModuleBody>
    </>
  );
}
