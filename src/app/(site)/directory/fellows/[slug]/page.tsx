import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHero } from "@/components/site/blocks";
import { JsonLd } from "@/components/seo/json-ld";
import { distinction } from "@/lib/domain";
import { fmtDate } from "@/lib/format";
import { ORG_ID, pageGraph, pageMetadata } from "@/lib/seo";
import { abs } from "@/lib/site";
import { getFellowsPage } from "@/server/content";
import { fellowBySlug, fellowHistory } from "@/server/queries/public";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await fellowBySlug((await params).slug);
  if (!r) return { title: "Register entry not found | ACCPHE", robots: { index: false } };
  const d = distinction(r.designation);
  return pageMetadata(
    `/directory/fellows/${r.slug}`,
    `${r.name}, ${r.designation} — ${d?.t ?? ""} | ACCPHE College of Fellows`,
    `Official ACCPHE College of Fellows register entry for ${r.name} (${r.country}): ${d?.t ?? r.designation} (${r.designation}), conferred ${fmtDate(r.effective)}, verification number ${r.verification}.`,
  );
}

export default async function FellowRecordPage({ params }: Props) {
  const r = await fellowBySlug((await params).slug);
  if (!r) notFound();
  const [history, F] = await Promise.all([fellowHistory(r.id), getFellowsPage()]);
  const d = distinction(r.designation);
  const changed = r.status !== "Published";
  const fullName = [r.honorific, r.name].filter(Boolean).join(" ");
  const rows: [string, string][] = [
    ["Name", fullName],
    ["Distinction", d ? `${d.t} (${d.code})` : r.designation],
    ["Pathway", d?.group ?? "—"],
    ["Authorized designation", `${r.name}, ${r.designation}`],
    ["Current status", changed ? r.status : "Current"],
    ["Verification number", r.verification],
    ["Position", r.position || "—"],
    ["Institution or organization", r.affiliation || "—"],
    ["Country", r.country],
    ["Date conferred", fmtDate(r.effective)],
    ...(r.review ? ([["Renewal due", fmtDate(r.review)]] as [string, string][]) : []),
    ...(r.citation ? ([["Citation", r.citation]] as [string, string][]) : []),
    ["Entry last updated", fmtDate(r.updatedAt)],
  ];
  const url = abs(`/directory/fellows/${r.slug}`);
  const person = {
    "@type": "Person",
    "@id": `${url}#person`,
    name: r.name,
    ...(r.honorific ? { honorificPrefix: r.honorific } : {}),
    ...(r.position ? { jobTitle: r.position } : {}),
    ...(r.affiliation ? { affiliation: { "@type": "Organization", name: r.affiliation } } : {}),
    address: { "@type": "PostalAddress", addressCountry: r.country },
    ...(!changed
      ? {
          hasCredential: {
            "@type": "EducationalOccupationalCredential",
            name: d ? `${d.t} (${d.code})` : r.designation,
            credentialCategory: d?.group === "Professional Certification" ? "certification" : "professional distinction",
            identifier: r.verification,
            validFrom: r.effective,
            ...(r.review ? { validUntil: r.review } : {}),
            recognizedBy: { "@id": ORG_ID },
          },
        }
      : {}),
  };
  return (
    <>
      <JsonLd data={pageGraph(`/directory/fellows/${r.slug}`, fullName, `ACCPHE College of Fellows: ${d?.t ?? r.designation}`, [{ name: "Member Institutions", path: "/directory" }, { name: "College of Fellows", path: "/directory/fellows" }, { name: r.name }], [person])} />
      <PageHero
        crumbs={[{ label: "Member Institutions", href: "/directory" }, { label: "College of Fellows", href: "/directory/fellows" }, { label: r.name }]}
        title={`${fullName}, ${r.designation}`}
        lede={`${d?.t ?? r.designation} · ${r.country}${changed ? ` · ${r.status}` : ""}`}
      />
      <section className="bg-white">
        <div className="wrap flex flex-wrap items-start" style={{ gap: "clamp(40px,6vw,88px)", paddingTop: "clamp(48px,6vw,72px)", paddingBottom: "clamp(64px,8vw,96px)" }}>
          <div className="flex min-w-0 max-w-[760px] flex-[999_1_520px] flex-col gap-6">
            {changed ? (
              <p role="note" className="m-0 border border-bad-line bg-bad-bg px-5 py-4 text-bad" style={{ font: "600 15px/1.6 var(--font-sans)" }}>
                Status: {r.status}. This person does not currently hold the distinction shown. Contact the Secretariat for details.
              </p>
            ) : (
              <p role="note" className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 border border-line bg-mist px-5 py-4 text-navy" style={{ font: "500 15px/1.6 var(--font-sans)" }}>
                <span className="text-good" style={{ font: "700 11px var(--font-sans)", letterSpacing: ".12em" }}>
                  ✓ VERIFIED CREDENTIAL
                </span>
                <span>
                  Verification number <strong>{r.verification}</strong>
                </span>
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
                          {h.status === "Published" ? `${h.designation} — entered in the register` : `${h.designation} — ${h.status}`}
                        </span>
                        {h.note && <span style={{ font: "400 14px/1.55 var(--font-sans)" }}>{h.note}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <div className="flex flex-wrap gap-3">
              <Link href="/directory/fellows" className="btn btn-outline">
                ← Back to the College of Fellows Directory
              </Link>
              <Link href="/contact?topic=verification" className="btn btn-primary">
                Request written verification
              </Link>
            </div>
          </div>
          <aside className="box box-top flex flex-[1_1_300px] flex-col gap-3.5 p-7">
            <span className="tag">{d?.group ?? "College of Fellows"}</span>
            <h2 className="m-0 text-navy" style={{ font: "600 22px/1.2 var(--font-serif)" }}>
              {d?.t ?? "What this entry means"}
            </h2>
            {d && (
              <p className="m-0" style={{ font: "400 14.5px/1.65 var(--font-sans)" }}>
                {F.distinctions.find((x) => x.code === d.code)?.d}
              </p>
            )}
            <p className="m-0" style={{ font: "400 14.5px/1.65 var(--font-sans)" }}>
              {F.integrity[F.integrity.length - 1]}
            </p>
            <Link href="/fellows" className="link-arrow">
              About the College of Fellows
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
