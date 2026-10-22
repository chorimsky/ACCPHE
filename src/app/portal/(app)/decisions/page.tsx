import Link from "next/link";
import { InfoNote, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { requireModule } from "@/server/auth";
import { deliberations, tallyOf } from "@/server/queries/decisions";

export const metadata = { title: "Decisions" };

export default async function DecisionsPage() {
  const user = await requireModule("decisions");
  const { apps, revs, vts, memberCount } = await deliberations();
  return (
    <>
      <ModuleHeader mod="decisions" />
      <ModuleBody>
        <InfoNote>
          Commission members deliberate on the review record and vote. The Secretariat records the formal decision of the authorized body. Members must recuse themselves where a conflict of interest exists.
        </InfoNote>
        <div className="flex flex-col gap-3.5">
          {apps.map((a) => {
            const rs = revs.filter((r) => r.applicationId === a.id);
            const vs = vts.filter((v) => v.applicationId === a.id);
            const all = rs.flatMap((r) => r.ratings);
            const mine = vs.find((v) => v.voterId === user.id);
            return (
              <Link key={a.id} href={`/portal/decisions/${a.id}`} className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded border border-line bg-white px-6 py-[22px] no-underline hover:border-steel">
                <div className="flex flex-[1_1_300px] flex-col gap-1.5">
                  <span className="text-slate" style={{ font: "600 12px var(--font-sans)" }}>
                    {a.ref} · {a.pathway}
                  </span>
                  <span style={{ font: "600 19px/1.3 var(--font-serif)", color: "var(--color-navy)" }}>{a.name}</span>
                  <span className="text-muted" style={{ font: "400 13px var(--font-sans)" }}>
                    {tallyOf(vs)}
                    {mine ? ` · You: ${mine.vote}` : ""}
                  </span>
                </div>
                {rs.length ? (
                  <div className="flex gap-[18px]">
                    {(
                      [
                        ["met", "Met", "var(--color-good)"],
                        ["partial", "Partial", "var(--color-warn)"],
                        ["not", "Not met", "var(--color-bad)"],
                      ] as const
                    ).map(([k, l, col]) => (
                      <div key={k} className="flex flex-col items-center">
                        <span style={{ font: "500 26px/1 var(--font-serif)", color: col }}>{all.filter((x) => x === k).length}</span>
                        <span className="text-muted" style={{ font: "500 11.5px var(--font-sans)" }}>
                          {l}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-warn" style={{ font: "500 13px var(--font-sans)" }}>
                    Review report pending
                  </span>
                )}
                <span className="text-navy" style={{ font: "600 13px var(--font-sans)" }}>
                  {vs.length} of {memberCount} votes recorded →
                </span>
              </Link>
            );
          })}
          {!apps.length && <div className="rounded border border-line bg-white px-6 py-12 text-center text-muted">No applications are awaiting Commission deliberation.</div>}
        </div>
      </ModuleBody>
    </>
  );
}
