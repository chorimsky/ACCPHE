import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHero } from "@/components/site/blocks";
import { JsonLd } from "@/components/seo/json-ld";
import { fmtDate } from "@/lib/format";
import { ORG_ID, pageGraph, pageMetadata } from "@/lib/seo";
import { abs } from "@/lib/site";
import { getProgramAccreditation } from "@/server/content";
import { programBySlug, programHistory } from "@/server/queries/public";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await programBySlug((await params).slug);
  if (!r) return { title: "Program record not found | ACCPHE", robots: { index: false } };
  return pageMetadata(
    `/directory/programs/${r.slug}`,
    `${r.title} — ${r.award} | ACCPHE Approved Programs`,
    `Official ACCPHE record for “${r.title}” offered by ${r.provider} (${r.country}): ${r.award}, verification number ${r.verification}, valid ${fmtDate(r.effective)} to ${fmtDate(r.review)}.`,
  );
}

export default async function ProgramRecordPage({ params }: Props) {
  const r = await programBySlug((await params).slug);
  if (!r) notFound();
  const [history, P] = await Promise.all([programHistory(r.id), getProgramAccreditation()]);
  const changed = r.status !== "Published";
  const rows: [string, string][] = [
    ["Approved program title", r.title],
    ["Education provider", r.provider],
    ["Country", r.country],
    ["Category", r.category || "—"],
    ["Status awarded", r.award],
    ["Current status", changed ? r.status : "Current"],
    ["Verification number", r.verification],
    ["Effective date", fmtDate(r.effective)],
    ["Valid until", r.review ? fmtDate(r.review) : "—"],
    ["Scope", r.scope || "—"],
    ["Conditions", r.conditions || "None recorded"],
    ["Record last updated", fmtDate(r.updatedAt)],
  ];
  const url = abs(`/directory/programs/${r.slug}`);
  const course = {
    "@type": "Course",
    "@id": `${url}#program`,
    name: r.title,
    provider: { "@type": "EducationalOrganization", name: r.provider, address: { "@type": "PostalAddress", addressCountry: r.country } },
    ...(r.category ? { about: r.category } : {}),
    ...(!changed
      ? {
          hasCredential: {
            "@type": "EducationalOccupationalCredential",
            name: `ACCPHE ${r.award}`,
            credentialCategory: r.award === "Accredited Program" ? "Program accreditation" : "Program recognition",
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
      <JsonLd
        data={pageGraph(`/directory/programs/${r.slug}`, r.title, `ACCPHE approved program record: ${r.award}`, [{ name: "Member Institutions", path: "/directory" }, { name: "Approved Programs", path: "/directory/programs" }, { name: r.title }], [course])}
      />
      <PageHero
        crumbs={[{ label: "Member Institutions", href: "/directory" }, { label: "Approved Programs", href: "/directory/programs" }, { label: r.title }]}
        title={r.title}
        lede={`${r.provider} · ${r.country} · ${r.award}${changed ? ` · ${r.status}` : ""}`}
      />
      <section className="bg-white">
        <div className="wrap flex flex-wrap items-start" style={{ gap: "clamp(40px,6vw,88px)", paddingTop: "clamp(48px,6vw,72px)", paddingBottom: "clamp(64px,8vw,96px)" }}>
          <div className="flex min-w-0 max-w-[760px] flex-[999_1_520px] flex-col gap-6">
            {changed ? (
              <p role="note" className="m-0 border border-bad-line bg-bad-bg px-5 py-4 text-bad" style={{ font: "600 15px/1.6 var(--font-sans)" }}>
                Status: {r.status}. This program does not currently hold the status shown. Contact the Secretariat for details.
              </p>
            ) : (
              <p role="note" className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 border border-line bg-mist px-5 py-4 text-navy" style={{ font: "500 15px/1.6 var(--font-sans)" }}>
                <span className="text-good" style={{ font: "700 11px var(--font-sans)", letterSpacing: ".12em" }}>
                  ✓ VERIFIED RECORD
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
                          {h.status === "Published" ? `${h.award} — published in the directory` : `${h.award} — ${h.status}`}
                        </span>
                        {h.note && <span style={{ font: "400 14px/1.55 var(--font-sans)" }}>{h.note}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <p className="small m-0">{P.receiveNote}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/directory/programs" className="btn btn-outline">
                ← Back to approved programs
              </Link>
              <Link href="/contact?topic=verification" className="btn btn-primary">
                Request written verification
              </Link>
            </div>
          </div>
          <aside className="box box-top flex flex-[1_1_300px] flex-col gap-3.5 p-7">
            <span className="tag">Program-level</span>
            <h2 className="m-0 text-navy" style={{ font: "600 22px/1.2 var(--font-serif)" }}>
              What this record means
            </h2>
            {P.disclosure.map((p) => (
              <p key={p} className="m-0" style={{ font: "400 14.5px/1.65 var(--font-sans)" }}>
                {p}
              </p>
            ))}
            <Link href="/accreditation/programs" className="link-arrow">
              About program accreditation
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
