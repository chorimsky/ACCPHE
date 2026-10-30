import Link from "next/link";
import { AsideBox, Eyebrow, PageHero } from "@/components/site/blocks";
import { Toc } from "@/components/site/interactive";
import { JsonLd } from "@/components/seo/json-ld";
import { SEO } from "@/content/site";
import { getFellowsPage } from "@/server/content";
import { ORG_ID, pageGraph, seoFor } from "@/lib/seo";

export const metadata = seoFor("fellows", "/fellows");

const TOC: [string, string][] = [
  ["f-overview", "Overview"],
  ["f-why", "Why the College matters"],
  ["f-distinctions", "Our distinctions"],
  ["f-eligible", "Who may apply"],
  ["f-value", "The value of belonging"],
  ["f-integrity", "Integrity and standards"],
  ["f-process", "How to apply"],
  ["f-evidence", "Evidence of achievement"],
];

const APPLY = "/fellows/apply";
const NOMINATE = "/fellows/apply?route=nomination";
const REGISTER = "/directory/fellows";
const NUMERALS = ["I", "II", "III"];

export default async function FellowsPage() {
  const [title, desc] = SEO.fellows;
  const F = await getFellowsPage();
  const howTo = {
    "@type": "HowTo",
    name: "How to apply for, or be nominated for, an ACCPHE fellowship, certification or distinction",
    step: F.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.t, text: s.d })),
  };
  const credentials = F.distinctions.map((d) => ({
    "@type": "EducationalOccupationalCredential",
    name: `${d.t} (${d.code})`,
    credentialCategory: d.group === "Professional Certification" ? "certification" : "professional distinction",
    description: d.d,
    recognizedBy: { "@id": ORG_ID },
  }));
  return (
    <>
      <JsonLd data={pageGraph("/fellows", title, desc, [{ name: "College of Fellows & Distinctions", path: "/fellows" }], [howTo, ...credentials])} />
      <PageHero crumbs={[{ label: "College of Fellows & Distinctions" }]} title="ACCPHE International College of Fellows & Professional Distinctions" lede={F.tagline}>
        <div className="mt-2.5 flex flex-wrap gap-3">
          <a href="#f-distinctions" className="btn btn-light">
            Explore Our Distinctions
          </a>
          <Link href={APPLY} className="btn btn-ghost">
            Apply for Recognition
          </Link>
          <Link href={NOMINATE} className="btn btn-ghost">
            Nominate a Distinguished Leader
          </Link>
        </div>
      </PageHero>

      <div className="wrap flex items-start" style={{ paddingTop: "clamp(56px,7vw,88px)", paddingBottom: "clamp(72px,9vw,112px)", gap: "clamp(40px,6vw,88px)" }}>
        <Toc items={TOC}>
          <div className="mt-8 flex flex-col gap-4">
            <AsideBox title="Apply or nominate" text="Seek a fellowship, certification or distinction, or nominate someone." href={APPLY} cta="Apply" />
            <p className="m-0" style={{ font: "400 13.5px/1.55 var(--font-sans)" }}>
              Verify a credential in the <Link href={REGISTER}>College of Fellows Directory</Link>.
            </p>
          </div>
        </Toc>

        <div className="flex min-w-0 max-w-[860px] flex-1 flex-col" style={{ gap: "clamp(64px,8vw,96px)" }}>
          <section id="f-overview" aria-labelledby="f-overview-h" className="flex flex-col gap-[22px]">
            <Eyebrow>College of Fellows & Distinctions</Eyebrow>
            <h2 id="f-overview-h" className="h2-sm">
              {F.kicker}
            </h2>
            <p className="m-0 border-l-2 border-navy py-1 pl-5 text-navy" style={{ font: "500 19px/1.55 var(--font-serif)" }}>
              {F.lead}
            </p>
            {F.intro.map((p) => (
              <p key={p} className="body-lg">
                {p}
              </p>
            ))}
            <p className="m-0 text-navy" style={{ font: "600 16px/1.6 var(--font-sans)" }}>
              {F.introClose}
            </p>
          </section>

          <section id="f-why" aria-labelledby="f-why-h" className="flex flex-col gap-[22px]">
            <Eyebrow>Why It Matters</Eyebrow>
            <h2 id="f-why-h" className="h2-sm">
              Why the ACCPHE College of Fellows matters
            </h2>
            {F.why.map((p, i) => (
              <p key={p} className={i === 1 ? "m-0 border-l-2 border-navy py-1 pl-5 text-navy" : "body-lg"} style={i === 1 ? { font: "500 18px/1.6 var(--font-serif)" } : undefined}>
                {p}
              </p>
            ))}
          </section>

          <section id="f-distinctions" aria-labelledby="f-distinctions-h" className="flex scroll-mt-28 flex-col gap-10">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>Our Fellowship & Professional Distinctions</Eyebrow>
              <h2 id="f-distinctions-h" className="h2-sm">
                Three pathways to recognition
              </h2>
              <p className="body-lg">{F.pathwaysIntro}</p>
            </div>
            {F.groups.map((g, gi) => (
              <section key={g.t} aria-labelledby={`f-group-${gi}`} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2 border-t-2 border-navy pt-5">
                  <span className="caps">Pathway {NUMERALS[gi]}</span>
                  <h3 id={`f-group-${gi}`} className="m-0 text-navy" style={{ font: "500 clamp(24px,2.6vw,30px)/1.15 var(--font-serif)" }}>
                    {g.t}
                  </h3>
                  <p className="m-0 text-steel" style={{ font: "500 16px/1.5 var(--font-serif)", fontStyle: "italic" }}>
                    {g.sub}
                  </p>
                </div>
                {g.d.map((p) => (
                  <p key={p} className="m-0" style={{ font: "400 16px/1.7 var(--font-sans)" }}>
                    {p}
                  </p>
                ))}
                <ul className="hairline-grid m-0 list-none p-0" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))" }}>
                  {F.distinctions
                    .filter((d) => d.group === g.t)
                    .map((d) => (
                      <li key={d.code} className="flex flex-col gap-2 px-7 py-[26px]">
                        <span className="self-start border border-steel px-2.5 py-1 text-navy" style={{ font: "700 12px var(--font-sans)", letterSpacing: ".06em" }}>
                          {d.code}
                        </span>
                        <h4 className="m-0 text-navy" style={{ font: "600 18px/1.3 var(--font-serif)" }}>
                          {d.t}
                        </h4>
                        <p className="m-0" style={{ font: "400 15px/1.62 var(--font-sans)" }}>
                          {d.d}
                        </p>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </section>

          <section id="f-eligible" aria-labelledby="f-eligible-h" className="flex flex-col gap-6">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>Eligibility</Eyebrow>
              <h2 id="f-eligible-h" className="h2-sm">
                Who may apply or be nominated?
              </h2>
              <p className="body-lg">{F.eligibleIntro}</p>
            </div>
            <ul className="m-0 grid list-none gap-x-9 p-0" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))" }}>
              {F.eligible.map((e) => (
                <li key={e} className="flex gap-3.5 border-t border-line py-[15px]" style={{ font: "400 15.5px/1.6 var(--font-sans)" }}>
                  <span aria-hidden="true" className="diamond" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 border border-line bg-mist px-6 py-[18px] text-navy" style={{ font: "600 14.5px/1.6 var(--font-sans)" }}>
              {F.eligibleNotes.map((n) => (
                <p key={n} className="m-0">
                  {n}
                </p>
              ))}
            </div>
          </section>

          <section id="f-value" aria-labelledby="f-value-h" className="flex flex-col gap-6">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>The Value of Belonging</Eyebrow>
              <h2 id="f-value-h" className="h2-sm">
                {F.valueLead}
              </h2>
              <p className="body-lg">{F.valueIntro}</p>
            </div>
            <ul className="hairline-grid m-0 list-none p-0" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))" }}>
              {F.value.map((v) => (
                <li key={v.t} className="flex flex-col gap-2 px-7 py-[26px]">
                  <h3 className="m-0 text-navy" style={{ font: "600 17.5px/1.3 var(--font-serif)" }}>
                    {v.t}
                  </h3>
                  <p className="m-0" style={{ font: "400 15px/1.62 var(--font-sans)" }}>
                    {v.d}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section id="f-integrity" aria-labelledby="f-integrity-h" className="flex flex-col gap-4 border-l-4 border-navy bg-mist" style={{ padding: "clamp(24px,4vw,36px)" }}>
            <Eyebrow>Our Commitment to Integrity and Professional Standards</Eyebrow>
            <h2 id="f-integrity-h" className="sr-only">
              Our commitment to integrity and professional standards
            </h2>
            {F.integrity.map((p, i) => (
              <p key={p} className="m-0" style={{ font: i === 0 ? "500 18px/1.6 var(--font-serif)" : "400 15.5px/1.7 var(--font-sans)", color: i === 0 ? "var(--color-navy)" : undefined, textWrap: "pretty" }}>
                {p}
              </p>
            ))}
          </section>

          <section id="f-process" aria-labelledby="f-process-h" className="flex flex-col gap-7">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>How to Apply or Be Nominated</Eyebrow>
              <h2 id="f-process-h" className="h2-sm">
                A structured review process
              </h2>
              <p className="body-lg">{F.stepsIntro}</p>
            </div>
            <ol className="m-0 flex list-none flex-col p-0">
              {F.steps.map((s, i) => (
                <li key={s.t} className="grid grid-cols-[52px_1fr] gap-[22px]">
                  <div className="flex flex-col items-center">
                    <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-full bg-navy text-mist" style={{ font: "600 17px var(--font-serif)" }}>
                      {i + 1}
                    </span>
                    {i < F.steps.length - 1 && <span aria-hidden="true" className="min-h-6 w-px flex-1 bg-line-strong" />}
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

          <section id="f-evidence" aria-labelledby="f-evidence-h" className="flex flex-col gap-6">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>Evidence of Professional Achievement</Eyebrow>
              <h2 id="f-evidence-h" className="h2-sm">
                Supporting evidence
              </h2>
              <p className="body-lg">{F.evidenceIntro}</p>
            </div>
            <ul className="m-0 flex list-none flex-col p-0">
              {F.evidence.map((r) => (
                <li key={r} className="flex gap-3.5 border-t border-line py-[15px] last:border-b" style={{ font: "400 16px/1.6 var(--font-sans)" }}>
                  <span aria-hidden="true" className="diamond" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <p className="m-0 border border-line bg-mist px-6 py-[18px] text-navy" style={{ font: "600 14.5px/1.6 var(--font-sans)" }}>
              {F.evidenceNote}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-4 border border-line px-6 py-5">
              <span style={{ font: "400 15px/1.6 var(--font-sans)" }}>Recognized individuals and their verification numbers are listed in the College’s register.</span>
              <Link href={REGISTER} className="link-arrow">
                College of Fellows Directory
              </Link>
            </div>
          </section>

          <section aria-labelledby="f-cta-h" className="dark flex flex-col gap-5" style={{ padding: "clamp(32px,5vw,48px)" }}>
            <h2 id="f-cta-h" className="m-0" style={{ font: "500 clamp(24px,2.6vw,30px)/1.18 var(--font-serif)", textWrap: "balance" }}>
              {F.closingLead}
            </h2>
            {F.closing.map((p) => (
              <p key={p} className="m-0 text-fog" style={{ font: "400 15.5px/1.65 var(--font-sans)" }}>
                {p}
              </p>
            ))}
            <p className="m-0" style={{ font: "500 18px/1.4 var(--font-serif)" }}>
              {F.closingTagline}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href="#f-distinctions" className="btn btn-light">
                Explore Fellowship Opportunities
              </a>
              <Link href={`${APPLY}?distinction=CCHEP`} className="btn btn-ghost">
                Apply for Professional Certification
              </Link>
              <Link href={NOMINATE} className="btn btn-ghost">
                Nominate a Distinguished Individual
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
