import Link from "next/link";
import { Eyebrow, PageHero } from "@/components/site/blocks";
import { StandardsBrowser } from "@/components/site/interactive";
import { JsonLd } from "@/components/seo/json-ld";
import { SEO, type TextItem } from "@/content/site";
import { fmtDate } from "@/lib/format";
import { getBlock, getStandards, standardsLabel } from "@/server/content";
import { pageGraph, seoFor } from "@/lib/seo";

export const metadata = seoFor("standards", "/standards");

const SECTIONS = [
  ["#s-standards", "4.1 Standards"],
  ["#s-evidence", "4.2 Criteria & Evidence"],
  ["#s-ethics", "4.3 Code of Ethics"],
  ["#s-appeals", "4.4 Complaints & Appeals"],
];

export default async function StandardsPage() {
  const [title, desc] = SEO.standards;
  const [STANDARDS, ETHICS, label] = await Promise.all([getStandards(), getBlock<TextItem[]>("ethics"), standardsLabel()]);
  const list = {
    "@type": "ItemList",
    name: `ACCPHE ${label.adjective} Institutional Accreditation Standards`,
    numberOfItems: STANDARDS.length,
    itemListElement: STANDARDS.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: `Standard ${i + 1}. ${s.t}`, description: s.s })),
  };
  return (
    <>
      <JsonLd data={pageGraph("/standards", title, desc, [{ name: "Standards & Policies", path: "/standards" }], [list])} />
      <PageHero
        crumbs={[{ label: "Standards & Policies" }]}
        title="Institutional Accreditation Standards and Quality Assurance Policies"
        lede="A commitment to consistent, transparent, and evidence-based evaluation — applied to Christian and private institutions while recognizing differences in mission, delivery, size, and national regulatory environment."
      />
      <div className="sticky top-20 z-20 border-b border-line bg-white">
        <nav aria-label="Sections" className="wrap flex gap-1 overflow-x-auto">
          {SECTIONS.map(([href, label], i) => (
            <a key={href} href={href} className={`whitespace-nowrap px-3.5 py-4 text-navy no-underline hover:text-slate ${i === 0 ? "-ml-3.5" : ""}`} style={{ font: "600 13.5px var(--font-sans)" }}>
              {label}
            </a>
          ))}
        </nav>
      </div>

      <section id="s-standards" aria-labelledby="s-standards-h" className="scroll-mt-[150px] bg-white">
        <div className="wrap flex flex-col gap-[18px]" style={{ paddingTop: "clamp(56px,7vw,88px)" }}>
          <Eyebrow>Section 4.1 · {label.adjective} Institutional Accreditation Standards</Eyebrow>
          <h2 id="s-standards-h" className="h2">
            {label.adopted ? `Twelve standards adopted by the Council${label.adoptedOn ? ` on ${fmtDate(label.adoptedOn)}` : ""}` : "Twelve standards recommended for formal adoption by the Council"}
          </h2>
          <p className="body-lg max-w-[760px]">
            Institutions seeking accreditation demonstrate compliance through documented policies, operational evidence, institutional performance information, and the results of systematic self-evaluation.
          </p>
        </div>
        <div className="wrap pt-10" style={{ paddingBottom: "clamp(72px,9vw,104px)" }}>
          <StandardsBrowser standards={STANDARDS} adjective={label.adjective} />
        </div>
      </section>

      <section id="s-evidence" aria-labelledby="s-evidence-h" className="tint scroll-mt-[150px] border-t border-line">
        <div className="wrap section flex flex-wrap" style={{ gap: "clamp(40px,6vw,88px)" }}>
          <div className="flex flex-[1_1_320px] flex-col gap-[18px]">
            <Eyebrow>Section 4.2 · Criteria and Evidence</Eyebrow>
            <h2 id="s-evidence-h" className="h2-sm">
              Demonstrating compliance
            </h2>
          </div>
          <div className="flex max-w-[760px] flex-[2_1_520px] flex-col gap-5">
            <p className="body-lg">
              Institutions are expected to demonstrate compliance through reliable and verifiable evidence — institutional policies, governance documents, academic catalogs, faculty records, curriculum documents,
              student assessment results, financial reports, performance data, and quality assurance records.
            </p>
            <p className="body-lg">The evaluation assesses both the existence of appropriate policies and evidence that those policies are implemented effectively.</p>
            <p className="m-0 mt-2 border border-line bg-white px-7 py-[26px] text-navy" style={{ font: "500 clamp(18px,1.7vw,21px)/1.5 var(--font-serif)", textWrap: "pretty" }}>
              Document submission alone does not establish compliance. Review considers the quality, consistency, authenticity, and practical application of the evidence provided.
            </p>
          </div>
        </div>
      </section>

      <section id="s-ethics" aria-labelledby="s-ethics-h" className="scroll-mt-[150px] bg-white">
        <div className="wrap section flex flex-col gap-11">
          <div className="flex max-w-[760px] flex-col gap-[18px]">
            <Eyebrow>Section 4.3 · Code of Ethics</Eyebrow>
            <h2 id="s-ethics-h" className="h2-sm">
              Principles governing the Council’s work
            </h2>
            <p className="body-lg">ACCPHE is committed to promoting ethical conduct and professional responsibility throughout its institutional activities.</p>
          </div>
          <div className="hairline-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,270px),1fr))" }}>
            {ETHICS.map((e) => (
              <div key={e.t} className="flex flex-col gap-2.5 px-[26px] pb-8 pt-7">
                <h3 className="m-0 text-navy" style={{ font: "600 18.5px/1.3 var(--font-serif)" }}>
                  {e.t}
                </h3>
                <p className="m-0" style={{ font: "400 14.5px/1.62 var(--font-sans)", textWrap: "pretty" }}>
                  {e.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="s-appeals" aria-labelledby="s-appeals-h" className="tint scroll-mt-[150px] border-t border-line">
        <div className="wrap section flex flex-col gap-11">
          <div className="flex max-w-[780px] flex-col gap-[18px]">
            <Eyebrow>Section 4.4 · Complaints and Appeals</Eyebrow>
            <h2 id="s-appeals-h" className="h2-sm">
              Fairness, accountability, and due process
            </h2>
            <p className="body-lg">An orderly means of addressing concerns about Council procedures, institutional conduct, accreditation decisions, and potential breaches of established standards.</p>
          </div>
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))" }}>
            <article className="box flex flex-col gap-4" style={{ padding: "clamp(28px,4vw,40px)" }}>
              <span className="caps">For any party</span>
              <h3 className="m-0 text-navy" style={{ font: "600 26px/1.2 var(--font-serif)" }}>
                Complaints
              </h3>
              <p className="m-0" style={{ font: "400 15.5px/1.7 var(--font-sans)" }}>
                Complaints should be submitted in writing and identify the institution or matter concerned, the nature of the alleged breach, relevant supporting information, and the complainant’s contact details.
              </p>
              <p className="m-0" style={{ font: "400 15.5px/1.7 var(--font-sans)" }}>
                The Council assesses whether the complaint falls within its jurisdiction and whether sufficient information exists to warrant further review. Where appropriate, the institution or individual concerned
                is given a fair opportunity to respond.
              </p>
            </article>
            <article className="box flex flex-col gap-4" style={{ padding: "clamp(28px,4vw,40px)" }}>
              <span className="caps">For institutions</span>
              <h3 className="m-0 text-navy" style={{ font: "600 26px/1.2 var(--font-serif)" }}>
                Appeals
              </h3>
              <p className="m-0" style={{ font: "400 15.5px/1.7 var(--font-sans)" }}>
                An institution subject to an appealable accreditation decision may request reconsideration under published procedures, reviewed by authorized individuals who were not responsible for the original
                decision.
              </p>
              <p className="m-0" style={{ font: "400 15.5px/1.7 var(--font-sans)" }}>
                The process identifies permissible grounds, submission requirements, deadlines, review procedures, and the authority responsible for the final determination.
              </p>
            </article>
          </div>
          <div>
            <Link href="/contact?topic=ethics" className="btn btn-primary">
              Contact the Standards &amp; Ethics Committee
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
