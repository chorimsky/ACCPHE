import Link from "next/link";
import { InfoNote, ModuleBody, ModuleHeader, Pill } from "@/components/portal/ui";
import { requireModule } from "@/server/auth";
import { myReviews } from "@/server/queries/reviews";

export const metadata = { title: "My reviews" };

export default async function ReviewsPage() {
  const user = await requireModule("reviews");
  const rows = await myReviews(user.id);
  return (
    <>
      <ModuleHeader mod="reviews" />
      <ModuleBody>
        <InfoNote>
          Evaluate each institution against the twelve standards using the evidence provided. Declare any conflict of interest before opening an evaluation. Reports are confidential and are submitted to the
          Secretariat and the Accreditation Commission.
        </InfoNote>
        {rows.length ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,320px),1fr))" }}>
            {rows.map(({ review: r, app: a }) => {
              const rated = r.ratings.filter(Boolean).length;
              const status = r.submittedAt ? "Report submitted" : !r.coiConfirmedAt ? "Declaration required" : rated ? "In progress" : "Not started";
              return (
                <Link
                  key={r.id}
                  href={`/portal/reviews/${r.id}`}
                  className="flex flex-col gap-3 rounded border border-line bg-white p-[22px] no-underline transition-shadow hover:border-steel hover:shadow-[0_8px_20px_rgba(20,43,69,.07)]"
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <span className="text-slate" style={{ font: "600 12px var(--font-sans)" }}>
                      {a.ref}
                    </span>
                    <Pill tone={r.submittedAt ? "good" : rated ? "warn" : "outline"}>{status}</Pill>
                  </div>
                  <span style={{ font: "600 18px/1.3 var(--font-serif)", color: "var(--color-navy)" }}>{a.name}</span>
                  <span className="text-muted" style={{ font: "400 13px var(--font-sans)" }}>
                    {a.country} · {a.pathway}
                  </span>
                  <div className="flex flex-col gap-1.5 pt-1.5">
                    <span className="block h-1.5 overflow-hidden rounded-[3px] bg-cloud">
                      <span className="block h-full bg-navy transition-[width]" style={{ width: `${(rated / 12) * 100}%` }} />
                    </span>
                    <span className="text-slate" style={{ font: "500 12.5px var(--font-sans)" }}>
                      {rated} of 12 standards rated
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded border border-line bg-white px-6 py-12 text-center text-muted">No evaluations are currently assigned to you.</div>
        )}
      </ModuleBody>
    </>
  );
}
