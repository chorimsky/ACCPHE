import Link from "next/link";
import { AsideBox, Eyebrow, PageHero } from "@/components/site/blocks";
import { Toc } from "@/components/site/interactive";
import { JsonLd } from "@/components/seo/json-ld";
import { SEO } from "@/content/site";
import { getProgramAccreditation } from "@/server/content";
import { pageGraph, seoFor } from "@/lib/seo";

export const metadata = seoFor("programs", "/accreditation/programs");

const TOC: [string, string][] = [
  ["p-overview", "Overview"],
  ["p-what", "What it is"],
  ["p-eligible", "Eligible programs"],
  ["p-independence", "Institutional independence"],
  ["p-standards", "Evaluation standards"],
  ["p-process", "How it works"],
  ["p-receive", "What programs receive"],
  ["p-disclosure", "Disclosure"],
];

const ENQUIRE = "/contact?topic=programs";

export default async function ProgramAccreditationPage() {
  const [title, desc] = SEO.programs;
  const P = await getProgramAccreditation();
  const howTo = {
    "@type": "HowTo",
    name: "How to obtain ACCPHE independent program accreditation",
    step: P.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.t, text: s.d })),
  };
  const crumbs = [
    { name: "Accreditation", path: "/accreditation" },
    { name: "Independent Program Accreditation & Recognition", path: "/accreditation/programs" },
  ];
  return (
    <>
      <JsonLd data={pageGraph("/accreditation/programs", title, desc, crumbs, [howTo])} />
      <PageHero crumbs={[{ label: "Accreditation", href: "/accreditation" }, { label: "Independent Program Accreditation" }]} title="Independent Program Accreditation & Recognition" lede={P.tagline}>
        <div className="mt-2.5 flex flex-wrap gap-3">
          <Link href={ENQUIRE} className="btn btn-light">
            Enquire About Program Review
          </Link>
          <a href="#p-standards" className="btn btn-ghost">
            View the Program Standards
          </a>
        </div>
      </PageHero>

      <div className="wrap flex items-start" style={{ paddingTop: "clamp(56px,7vw,88px)", paddingBottom: "clamp(72px,9vw,112px)", gap: "clamp(40px,6vw,88px)" }}>
        <Toc items={TOC}>
          <div className="mt-8">
            <AsideBox title="Have a program in mind?" text="Tell the Secretariat about the program you would like reviewed." href={ENQUIRE} cta="Enquire" />
          </div>
        </Toc>

        <div className="flex min-w-0 max-w-[860px] flex-1 flex-col" style={{ gap: "clamp(64px,8vw,96px)" }}>
          <section id="p-overview" aria-labelledby="p-overview-h" className="flex flex-col gap-[22px]">
            <Eyebrow>Program-Level Quality Assurance</Eyebrow>
            <h2 id="p-overview-h" className="h2-sm">
              Excellence beyond institutional size or status
            </h2>
            {P.intro.map((p) => (
              <p key={p} className="body-lg">
                {p}
              </p>
            ))}
          </section>

          <section id="p-what" aria-labelledby="p-what-h" className="flex flex-col gap-[22px]">
            <Eyebrow>Definition</Eyebrow>
            <h2 id="p-what-h" className="h2-sm">
              What is Independent Program Accreditation?
            </h2>
            {P.what.map((p, i) => (
              <p key={p} className={i === 1 ? "m-0 border-l-2 border-navy py-1 pl-5 text-navy" : "body-lg"} style={i === 1 ? { font: "500 18px/1.6 var(--font-serif)" } : undefined}>
                {p}
              </p>
            ))}
          </section>

          <section id="p-eligible" aria-labelledby="p-eligible-h" className="flex flex-col gap-6">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>Programs Eligible for Review</Eyebrow>
              <h2 id="p-eligible-h" className="h2-sm">
                A broad range of educational initiatives
              </h2>
            </div>
            <ul className="m-0 grid list-none gap-x-9 p-0" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))" }}>
              {P.eligible.map((e) => (
                <li key={e} className="flex gap-3.5 border-t border-line py-[15px]" style={{ font: "400 15.5px/1.6 var(--font-sans)" }}>
                  <span aria-hidden="true" className="diamond" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
            <p className="m-0 border border-line bg-mist px-6 py-[18px] text-navy" style={{ font: "600 14.5px/1.6 var(--font-sans)" }}>
              {P.eligibleNote}
            </p>
          </section>

          <section id="p-independence" aria-labelledby="p-independence-h" className="flex flex-col gap-[22px]">
            <Eyebrow>Our Commitment to Institutional Independence</Eyebrow>
            <h2 id="p-independence-h" className="h2-sm">
              Preserving the diversity of education providers
            </h2>
            {P.independence.map((p) => (
              <p key={p} className="body-lg">
                {p}
              </p>
            ))}
          </section>

          <section id="p-standards" aria-labelledby="p-standards-h" className="flex flex-col gap-6">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>Our Program Evaluation Standards</Eyebrow>
              <h2 id="p-standards-h" className="h2-sm">
                {P.standards.length === 8 ? "Eight principal areas of evaluation" : "Principal areas of evaluation"}
              </h2>
              <p className="body-lg">Programs are evaluated against a structured quality assurance framework encompassing {P.standards.length} principal areas.</p>
            </div>
            <ol className="hairline-grid m-0 list-none p-0" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))" }}>
              {P.standards.map((s, i) => (
                <li key={s.t} className="flex flex-col gap-2 px-7 py-[26px]">
                  <span className="caps">Area {String(i + 1).padStart(2, "0")}</span>
                  <h3 className="m-0 text-navy" style={{ font: "600 17.5px/1.3 var(--font-serif)" }}>
                    {s.t}
                  </h3>
                  <p className="m-0" style={{ font: "400 15px/1.62 var(--font-sans)" }}>
                    {s.d}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section id="p-process" aria-labelledby="p-process-h" className="flex flex-col gap-7">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>How Program Accreditation Works</Eyebrow>
              <h2 id="p-process-h" className="h2-sm">
                From application to ongoing quality assurance
              </h2>
            </div>
            <ol className="m-0 flex list-none flex-col p-0">
              {P.steps.map((s, i) => (
                <li key={s.t} className="grid grid-cols-[52px_1fr] gap-[22px]">
                  <div className="flex flex-col items-center">
                    <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-full bg-navy text-mist" style={{ font: "600 17px var(--font-serif)" }}>
                      {i + 1}
                    </span>
                    {i < P.steps.length - 1 && <span aria-hidden="true" className="min-h-6 w-px flex-1 bg-line-strong" />}
                  </div>
                  <div className="flex flex-col gap-2 pb-9 pt-[9px]">
                    <h3 className="m-0 text-navy" style={{ font: "600 20px/1.3 var(--font-serif)" }}>
                      <span className="sr-only">Step {i + 1}: </span>
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

          <section id="p-receive" aria-labelledby="p-receive-h" className="flex flex-col gap-6">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>What Accredited Programs Receive</Eyebrow>
              <h2 id="p-receive-h" className="h2-sm">
                Formal recognition and verifiable status
              </h2>
              <p className="body-lg">{P.receiveIntro}</p>
            </div>
            <ul className="m-0 flex list-none flex-col p-0">
              {P.receive.map((r) => (
                <li key={r} className="flex gap-3.5 border-t border-line py-[15px] last:border-b" style={{ font: "400 16px/1.6 var(--font-sans)" }}>
                  <span aria-hidden="true" className="diamond" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <p className="m-0 border border-line bg-mist px-6 py-[18px] text-navy" style={{ font: "600 14.5px/1.6 var(--font-sans)" }}>
              {P.receiveNote}
            </p>
          </section>

          <section id="p-disclosure" aria-labelledby="p-disclosure-h" className="flex flex-col gap-4 border-l-4 border-navy bg-mist" style={{ padding: "clamp(24px,4vw,36px)" }}>
            <Eyebrow>Important Accreditation Disclosure</Eyebrow>
            <h2 id="p-disclosure-h" className="sr-only">
              Important accreditation disclosure
            </h2>
            {P.disclosure.map((p) => (
              <p key={p} className="m-0" style={{ font: "400 15.5px/1.7 var(--font-sans)", textWrap: "pretty" }}>
                {p}
              </p>
            ))}
          </section>

          <section aria-labelledby="p-cta-h" className="dark flex flex-wrap items-center justify-between gap-6" style={{ padding: "clamp(32px,5vw,48px)" }}>
            <div className="flex flex-[1_1_360px] flex-col gap-2.5">
              <h2 id="p-cta-h" className="m-0" style={{ font: "500 clamp(24px,2.6vw,30px)/1.14 var(--font-serif)", textWrap: "balance" }}>
                Submit a program for independent review
              </h2>
              <p className="m-0 text-fog" style={{ font: "400 15.5px/1.6 var(--font-sans)" }}>
                Describe the program, its learners and its delivery model. The Secretariat will advise on eligibility and the next steps.
              </p>
            </div>
            <Link href={ENQUIRE} className="btn btn-light">
              Enquire About Program Review
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
