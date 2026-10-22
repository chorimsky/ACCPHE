import { Eyebrow, PageHero } from "@/components/site/blocks";
import { Toc } from "@/components/site/interactive";
import { JsonLd } from "@/components/seo/json-ld";
import { PAGE_TOCS, SEO, type TextItem } from "@/content/site";
import { getBlock, getVmp } from "@/server/content";
import { pageGraph, seoFor } from "@/lib/seo";

export const metadata = seoFor("about", "/about");

export default async function AboutPage() {
  const [title, desc] = SEO.about;
  const [intro, welcome, VMP, VALUES, OBJECTIVES] = await Promise.all([
    getBlock<{ title: string; paragraphs: string[]; history: string[]; commitmentLead: string; commitmentBody: string }>("about.intro"),
    getBlock<{ quote: string }>("home.welcome"),
    getVmp(),
    getBlock<TextItem[]>("values"),
    getBlock<string[]>("objectives"),
  ]);
  return (
    <>
      <JsonLd data={pageGraph("/about", title, desc, [{ name: "About Us", path: "/about" }])} />
      <PageHero
        crumbs={[{ label: "About Us" }]}
        title="About the Council"
        lede="An independent, internationally oriented quality assurance organization dedicated to advancing academic excellence, institutional integrity, and responsible governance in Christian and private higher education."
      />
      <div className="wrap flex items-start" style={{ paddingTop: "clamp(56px,7vw,88px)", paddingBottom: "clamp(72px,9vw,112px)", gap: "clamp(40px,6vw,88px)" }}>
        <Toc items={PAGE_TOCS.about} />
        <div className="flex min-w-0 max-w-[820px] flex-1 flex-col" style={{ gap: "clamp(64px,8vw,96px)" }}>
          <section id="a-intro" aria-labelledby="a-intro-h" className="flex flex-col gap-[22px]">
            <Eyebrow>Who we are</Eyebrow>
            <h2 id="a-intro-h" className="h2-sm">
              {intro.title}
            </h2>
            {intro.paragraphs.map((p) => (
              <p key={p} className="body-lg">
                {p}
              </p>
            ))}
            <blockquote className="relative m-0 mt-4 border-t border-line pl-7 pt-8 text-navy" style={{ font: "400 clamp(21px,2vw,25px)/1.48 var(--font-serif)", textWrap: "pretty" }}>
              <span aria-hidden="true" className="absolute left-0 top-6" style={{ font: "500 48px/1 var(--font-serif)", color: "var(--color-steel)" }}>
                “
              </span>
              {welcome.quote}
            </blockquote>
          </section>

          <section id="a-history" aria-labelledby="a-history-h" className="flex flex-col gap-[22px]">
            <Eyebrow>Our Institutional History</Eyebrow>
            <h2 id="a-history-h" className="h2-sm">
              Background and development
            </h2>
            {intro.history.map((p) => (
              <p key={p} className="body-lg">
                {p}
              </p>
            ))}
          </section>

          <section id="a-vmp" aria-label="Vision, mission and purpose" className="flex flex-col">
            {VMP.map((v) => (
              <div key={v.t} className="flex flex-wrap gap-x-10 gap-y-3 border-t border-line py-9">
                <h2 className="caps m-0 flex-[0_0_130px]" style={{ lineHeight: 2.2 }}>
                  Our {v.t}
                </h2>
                <p className="m-0 flex-[1_1_400px] text-navy" style={{ font: "400 clamp(19px,1.8vw,22px)/1.5 var(--font-serif)", textWrap: "pretty" }}>
                  {v.d}
                </p>
              </div>
            ))}
          </section>

          <section id="a-values" aria-labelledby="a-values-h" className="flex flex-col gap-8">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>Our Core Values</Eyebrow>
              <h2 id="a-values-h" className="h2-sm">
                Principles that shape every evaluation
              </h2>
            </div>
            <div className="hairline-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))" }}>
              {VALUES.map((v) => (
                <div key={v.t} className="flex flex-col gap-2.5 px-7 pb-8 pt-7">
                  <h3 className="m-0 text-navy" style={{ font: "600 19px/1.3 var(--font-serif)" }}>
                    {v.t}
                  </h3>
                  <p className="m-0" style={{ font: "400 15px/1.65 var(--font-sans)", textWrap: "pretty" }}>
                    {v.d}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="a-objectives" aria-labelledby="a-objectives-h" className="flex flex-col gap-7">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>Our Strategic Objectives</Eyebrow>
              <h2 id="a-objectives-h" className="h2-sm">
                ACCPHE’s institutional objectives
              </h2>
            </div>
            <ol className="m-0 flex list-none flex-col border-b border-line p-0">
              {OBJECTIVES.map((o, i) => (
                <li key={o} className="grid grid-cols-[52px_1fr] gap-3 border-t border-line py-[18px]" style={{ font: "400 16.5px/1.6 var(--font-sans)" }}>
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ textWrap: "pretty" }}>{o}</span>
                </li>
              ))}
            </ol>
          </section>

          <section id="a-commitment" aria-labelledby="a-commitment-h" className="dark flex flex-col gap-[18px]" style={{ padding: "clamp(32px,5vw,48px)" }}>
            <Eyebrow dark>Our Commitment to Responsible Accreditation</Eyebrow>
            <p id="a-commitment-h" className="m-0" style={{ font: "500 clamp(21px,2vw,25px)/1.42 var(--font-serif)", textWrap: "pretty" }}>
              {intro.commitmentLead}
            </p>
            <p className="m-0 text-fog" style={{ font: "400 16px/1.7 var(--font-sans)", textWrap: "pretty" }}>
              {intro.commitmentBody}
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
