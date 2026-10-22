import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHero } from "@/components/site/blocks";
import { JsonLd } from "@/components/seo/json-ld";
import { getClasses } from "@/server/content";
import { fmtDate } from "@/lib/format";
import { ORG_ID, pageGraph, pageMetadata } from "@/lib/seo";
import { abs } from "@/lib/site";
import { recordBySlug, recordHistory } from "@/server/queries/public";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await recordBySlug((await params).slug);
  if (!r) return { title: "Record not found | ACCPHE", robots: { index: false } };
  return pageMetadata(`/directory/${r.slug}`, `${r.name} — ${r.cls} | ACCPHE Directory`, `Official ACCPHE directory record for ${r.name} (${r.country}): ${r.cls}, effective ${fmtDate(r.effective)}.`);
}

export default async function RecordPage({ params }: Props) {
  const r = await recordBySlug((await params).slug);
  if (!r) notFound();
  const history = await recordHistory(r.id);
  const cls = (await getClasses()).find((c) => c.t.startsWith(r.cls.split(" ")[0]));
  const changed = r.status !== "Published";
  const rows: [string, string][] = [
    ["Institution", r.name],
    ["Country", r.country],
    ["Classification", r.cls],
    ["Status", changed ? r.status : "Current"],
    ["Effective date", fmtDate(r.effective)],
    ["Expiry or review date", r.review ? fmtDate(r.review) : "—"],
    ["Scope", r.scope || "—"],
    ["Conditions", r.conditions || "None recorded"],
    ["Record last updated", fmtDate(r.updatedAt)],
  ];
  const org = {
    "@type": "EducationalOrganization",
    "@id": `${abs(`/directory/${r.slug}`)}#institution`,
    name: r.name,
    address: { "@type": "PostalAddress", addressCountry: r.country },
    ...(r.cls === "Accredited Institution" && !changed ? { hasCredential: { "@type": "EducationalOccupationalCredential", credentialCategory: "Institutional accreditation", recognizedBy: { "@id": ORG_ID } } } : {}),
    memberOf: r.cls !== "Accredited Institution" && !changed ? { "@type": "ProgramMembership", programName: `ACCPHE ${r.cls}`, hostingOrganization: { "@id": ORG_ID } } : undefined,
  };
  return (
    <>
      <JsonLd data={pageGraph(`/directory/${r.slug}`, r.name, `ACCPHE directory record: ${r.cls}`, [{ name: "Member Institutions", path: "/directory" }, { name: r.name }], [org])} />
      <PageHero crumbs={[{ label: "Member Institutions", href: "/directory" }, { label: r.name }]} title={r.name} lede={`${r.country} · ${r.cls}${changed ? ` · ${r.status}` : ""}`} />
      <section className="bg-white">
        <div className="wrap flex flex-wrap items-start" style={{ gap: "clamp(40px,6vw,88px)", paddingTop: "clamp(48px,6vw,72px)", paddingBottom: "clamp(64px,8vw,96px)" }}>
          <div className="flex min-w-0 max-w-[760px] flex-[999_1_520px] flex-col gap-6">
            {changed && (
              <p role="note" className="m-0 border border-bad-line bg-bad-bg px-5 py-4 text-bad" style={{ font: "600 15px/1.6 var(--font-sans)" }}>
                Status: {r.status}. This institution does not currently hold the classification shown. Contact the Secretariat for details.
              </p>
            )}
            <dl className="m-0 border-b border-line">
              {rows.map(([k, v]) => (
                <div key={k} className="grid gap-2 border-t border-line py-4 min-[620px]:grid-cols-[220px_1fr]">
                  <dt className="caps-sm">{k}</dt>
                  <dd className="m-0 text-navy" style={{ font: "500 16px/1.55 var(--font-sans)", whiteSpace: "pre-line" }}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            {history.length > 0 && (
              <section aria-labelledby="history" className="flex flex-col gap-2">
                <h2 id="history" className="caps m-0">
                  Status history
                </h2>
                <ol className="m-0 list-none border-b border-line p-0">
                  {history.map((h) => (
                    <li key={h.id} className="grid gap-1 border-t border-line py-3 min-[620px]:grid-cols-[220px_1fr]">
                      <span className="text-muted" style={{ font: "500 14px var(--font-sans)" }}>
                        {fmtDate(h.effective)}
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className="text-navy" style={{ font: "600 15px var(--font-sans)" }}>
                          {h.status === "Published" ? `${h.cls} — published in the directory` : `${h.cls} — ${h.status}`}
                        </span>
                        {h.note && <span style={{ font: "400 14px/1.55 var(--font-sans)" }}>{h.note}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <p className="small m-0">
              The official institutional directory is the authoritative public record of ACCPHE status. Membership is not accreditation, and accreditation by a nongovernmental body does not by itself confer legal
              authority to operate or award degrees.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/directory" className="btn btn-outline">
                ← Back to the directory
              </Link>
              <Link href="/contact?topic=verification" className="btn btn-primary">
                Request written verification
              </Link>
            </div>
          </div>
          {cls && (
            <aside className="box box-top flex flex-[1_1_300px] flex-col gap-3.5 p-7">
              <span className="tag">{cls.kind}</span>
              <h2 className="m-0 text-navy" style={{ font: "600 22px/1.2 var(--font-serif)" }}>
                {cls.t}
              </h2>
              {cls.long.map((p) => (
                <p key={p} className="m-0" style={{ font: "400 14.5px/1.65 var(--font-sans)" }}>
                  {p}
                </p>
              ))}
            </aside>
          )}
        </div>
      </section>
    </>
  );
}
