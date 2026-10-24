import Link from "next/link";
import { AsideBox, Eyebrow, PageHero, StatusMatrix } from "@/components/site/blocks";
import { FaqList, Toc } from "@/components/site/interactive";
import { JsonLd } from "@/components/seo/json-ld";
import { PAGE_TOCS, SEO, type TextItem } from "@/content/site";
import { getBlock, getClasses, getFaqs, getProcess } from "@/server/content";
import { faqGraph, pageGraph, seoFor } from "@/lib/seo";

export const metadata = seoFor("accreditation", "/accreditation");

export default async function AccreditationPage() {
  const [title, desc] = SEO.accreditation;
  const [ACCREDITATION_OBJECTIVES, ELIGIBILITY, PROCESS, CLASSES, FAQS] = await Promise.all([
    getBlock<string[]>("accreditation.objectives"),
    getBlock<TextItem[]>("eligibility"),
    getProcess(),
    getClasses(),
    getFaqs(),
  ]);
  const howTo = {
    "@type": "HowTo",
    name: "How to obtain ACCPHE institutional accreditation",
    step: PROCESS.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.t, text: s.d })),
  };
  return (
    <>
      <JsonLd data={pageGraph("/accreditation", title, desc, [{ name: "Accreditation", path: "/accreditation" }], [howTo])} />
      <JsonLd data={faqGraph(FAQS)} />
      <PageHero
        crumbs={[{ label: "Accreditation" }]}
        title="Accreditation and Institutional Quality Assurance"
        lede="Promoting academic quality through independent evaluation — assessing whether an institution satisfies established standards of academic quality, governance, institutional effectiveness, and ethical responsibility."
      >
        <div className="mt-2.5 flex flex-wrap gap-3">
          <Link href="/apply" className="btn btn-light">
            Apply for Accreditation
          </Link>
          <Link href="/standards" className="btn btn-ghost">
            View the Standards
          </Link>
        </div>
      </PageHero>
      <div className="wrap flex items-start" style={{ paddingTop: "clamp(56px,7vw,88px)", paddingBottom: "clamp(72px,9vw,112px)", gap: "clamp(40px,6vw,88px)" }}>
        <Toc items={PAGE_TOCS.accreditation}>
          <div className="mt-8">
            <AsideBox title="Ready to begin?" text="Submit an initial inquiry to the Secretariat." href="/apply" cta="Apply" />
          </div>
        </Toc>
        <div className="flex min-w-0 max-w-[860px] flex-1 flex-col" style={{ gap: "clamp(64px,8vw,96px)" }}>
          <section id="c-objectives" aria-labelledby="c-objectives-h" className="flex flex-col gap-[22px]">
            <Eyebrow>Objectives of Accreditation</Eyebrow>
            <h2 id="c-objectives-h" className="h2-sm">
              What the framework seeks to achieve
            </h2>
            <p className="body-lg">
              The framework evaluates institutions through documented evidence, professional review, and transparent institutional decisions — emphasizing both compliance with established requirements and a sustained
              commitment to improvement.
            </p>
            <ul className="m-0 mt-2 grid list-none gap-x-9 p-0" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))" }}>
              {ACCREDITATION_OBJECTIVES.map((o) => (
                <li key={o} className="flex gap-3.5 border-t border-line py-[15px]" style={{ font: "400 15.5px/1.6 var(--font-sans)" }}>
                  <span aria-hidden="true" className="diamond" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="c-eligibility" aria-labelledby="c-eligibility-h" className="flex flex-col gap-6">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>Institutional Eligibility</Eyebrow>
              <h2 id="c-eligibility-h" className="h2-sm">
                Who may apply?
              </h2>
              <p className="body-lg">
                The framework is intended for eligible Christian and private higher education institutions, subject to the Council’s approved eligibility requirements and applicable national laws. Applicants should
                be prepared to demonstrate:
              </p>
            </div>
            <dl className="hairline-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))" }}>
              {ELIGIBILITY.map((e) => (
                <div key={e.t} className="flex flex-col gap-2 px-7 py-[26px]">
                  <dt className="text-navy" style={{ font: "600 17.5px/1.3 var(--font-serif)" }}>
                    {e.t}
                  </dt>
                  <dd className="m-0" style={{ font: "400 15px/1.62 var(--font-sans)" }}>
                    {e.d}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-col gap-2.5 border border-line bg-mist px-6 py-[22px]">
              <p className="m-0" style={{ font: "400 15.5px/1.65 var(--font-sans)" }}>
                Christian institutions should additionally demonstrate how their stated Christian identity is reflected appropriately in their mission, educational environment, and institutional policies.
              </p>
              <p className="m-0 text-navy" style={{ font: "600 14.5px/1.6 var(--font-sans)" }}>
                Eligibility to apply does not guarantee admission, accreditation, or any particular decision.
              </p>
            </div>
          </section>

          <section id="c-process" aria-labelledby="c-process-h" className="flex flex-col gap-7">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>The Accreditation Process</Eyebrow>
              <h2 id="c-process-h" className="h2-sm">
                The institutional evaluation pathway
              </h2>
            </div>
            <ol className="m-0 flex list-none flex-col p-0">
              {PROCESS.map((s, i) => (
                <li key={s.t} className="grid grid-cols-[52px_1fr] gap-[22px]">
                  <div className="flex flex-col items-center">
                    <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-full bg-navy text-mist" style={{ font: "600 17px var(--font-serif)" }}>
                      {i + 1}
                    </span>
                    {i < PROCESS.length - 1 && <span aria-hidden="true" className="min-h-6 w-px flex-1 bg-line-strong" />}
                  </div>
                  <div className="flex flex-col gap-2 pb-9 pt-[9px]">
                    <h3 className="m-0 text-navy" style={{ font: "600 20px/1.3 var(--font-serif)" }}>
                      {s.t}
                    </h3>
                    <p className="m-0 max-w-[640px]" style={{ font: "400 15.5px/1.68 var(--font-sans)", textWrap: "pretty" }}>
                      {s.d}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="c-classes" aria-labelledby="c-classes-h" className="flex flex-col gap-6">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>Classifications</Eyebrow>
              <h2 id="c-classes-h" className="h2-sm">
                Membership and accreditation classifications
              </h2>
            </div>
            {CLASSES.map((c) => (
              <article key={c.t} className="flex flex-col gap-3.5 border border-line p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="m-0 text-navy" style={{ font: "600 24px/1.2 var(--font-serif)" }}>
                    {c.t}
                  </h3>
                  <span className="tag">{c.kind}</span>
                </div>
                {c.long.map((p) => (
                  <p key={p} className="body">
                    {p}
                  </p>
                ))}
              </article>
            ))}
          </section>

          <StatusMatrix title="Three classifications, clearly distinguished" intro="Use this summary when describing or verifying an institution’s status. Only Accredited Institution status may be described as accreditation." />

          <section id="c-programs" aria-labelledby="c-programs-h" className="flex flex-col gap-5 border border-line p-8" style={{ borderTop: "3px solid var(--color-navy)" }}>
            <Eyebrow>Program-Level Accreditation</Eyebrow>
            <h2 id="c-programs-h" className="h2-sm">
              Independent Program Accreditation &amp; Recognition
            </h2>
            <p className="body-lg">
              Certificate and diploma programs, executive education, continuing professional development, ministry training and other specialized programs can be evaluated individually against eight program
              standards — without the provider necessarily pursuing full institutional accreditation.
            </p>
            <div>
              <Link href="/accreditation/programs" className="btn btn-primary">
                Explore Program Accreditation
              </Link>
            </div>
          </section>

          <section id="c-maintaining" aria-labelledby="c-maintaining-h" className="flex flex-col gap-[22px]">
            <Eyebrow>Maintaining Accreditation</Eyebrow>
            <h2 id="c-maintaining-h" className="h2-sm">
              Accreditation requires continued institutional responsibility
            </h2>
            <p className="body-lg">
              Accredited institutions are expected to maintain compliance with applicable standards, submit required reports, disclose material institutional changes, cooperate with authorized monitoring activities,
              and address identified deficiencies within prescribed periods.
            </p>
            <p className="body-lg">
              The Council may initiate further review when credible information raises concerns about institutional compliance or the accuracy of published institutional information. Any suspension, withdrawal,
              expiration, or other material change in status is reflected promptly in the public directory.
            </p>
          </section>

          <section id="c-faq" aria-labelledby="c-faq-h" className="flex flex-col gap-6">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>Frequently Asked Questions</Eyebrow>
              <h2 id="c-faq-h" className="h2-sm">
                Accreditation questions
              </h2>
            </div>
            <FaqList faqs={FAQS} />
          </section>

          <section aria-labelledby="c-cta-h" className="dark flex flex-wrap items-center justify-between gap-6" style={{ padding: "clamp(32px,5vw,48px)" }}>
            <div className="flex flex-[1_1_360px] flex-col gap-2.5">
              <h2 id="c-cta-h" className="m-0" style={{ font: "500 clamp(24px,2.6vw,30px)/1.14 var(--font-serif)", textWrap: "balance" }}>
                Begin your institutional evaluation
              </h2>
              <p className="m-0 text-fog" style={{ font: "400 15.5px/1.6 var(--font-sans)" }}>
                Submit an initial inquiry. The Secretariat will communicate the appropriate next steps.
              </p>
            </div>
            <Link href="/apply" className="btn btn-light">
              Apply for Accreditation
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
