import { Eyebrow, PageHero } from "@/components/site/blocks";
import { JsonLd } from "@/components/seo/json-ld";
import { SEO, type TextItem } from "@/content/site";
import { getBlock, getGovernance } from "@/server/content";
import { ORG_ID, pageGraph, seoFor } from "@/lib/seo";

export const metadata = seoFor("governance", "/governance");

const CHART = [
  { t: "Accreditation Commission", r: "Evaluation & decisions", id: "g-commission" },
  { t: "Standards & Ethics Committee", r: "Ethics, complaints & appeals", id: "g-ethics" },
  { t: "Academic Advisory Council", r: "Academic advice", id: "g-advisory" },
  { t: "Regional Councils", r: "Regional engagement", id: "g-regional" },
  { t: "Executive Secretariat", r: "Administration", id: "g-exec" },
];

export default async function GovernancePage() {
  const [title, desc] = SEO.governance;
  const [GOVERNANCE, EXECUTIVE] = await Promise.all([getGovernance(), getBlock<TextItem[]>("executive")]);
  const org = {
    "@type": "Organization",
    "@id": ORG_ID,
    subOrganization: ["Board of Trustees", "Accreditation Commission", "Standards & Ethics Committee", "Academic Advisory Council", "Regional Councils", "Executive Secretariat"].map((n) => ({ "@type": "Organization", name: n })),
  };
  return (
    <>
      <JsonLd data={pageGraph("/governance", title, desc, [{ name: "Governance", path: "/governance" }], [org])} />
      <PageHero
        crumbs={[{ label: "Governance" }]}
        title="Institutional Governance"
        lede="Governance built on independence, accountability, and professional judgment. Effective quality assurance depends on the integrity of the body responsible for administering it."
      />

      <section aria-labelledby="g-chart" className="tint border-b border-line">
        <div className="wrap flex flex-col items-center" style={{ paddingBlock: "clamp(56px,7vw,88px)" }}>
          <div className="flex self-stretch justify-center pb-8">
            <h2 id="g-chart" className="eyebrow m-0">
              Governance Structure
            </h2>
          </div>
          <a href="#g-board" className="flex min-w-[280px] flex-col gap-[5px] bg-navy px-11 py-[22px] text-center text-mist no-underline transition-colors hover:bg-slate hover:text-mist">
            <span style={{ font: "600 21px var(--font-serif)" }}>Board of Trustees</span>
            <span className="text-fog" style={{ font: "400 13px var(--font-sans)" }}>
              Highest governing authority
            </span>
          </a>
          <span aria-hidden="true" className="h-9 w-px bg-steel" />
          <ul className="m-0 hidden w-full list-none grid-cols-5 p-0 min-[980px]:grid">
            {CHART.map((c, i) => (
              <li key={c.id} className="relative flex flex-col items-center px-[7px]">
                <span aria-hidden="true" className="absolute top-0 h-px bg-steel" style={{ left: i === 0 ? "50%" : 0, right: i === CHART.length - 1 ? "50%" : 0 }} />
                <span aria-hidden="true" className="h-8 w-px bg-steel" />
                <a
                  href={`#${c.id}`}
                  className="flex min-h-[104px] w-full flex-1 flex-col justify-center gap-1.5 border border-line-strong bg-white px-3.5 py-5 text-center no-underline transition-shadow hover:border-navy hover:shadow-[0_8px_20px_rgba(20,43,69,.08)]"
                >
                  <span style={{ font: "600 16px/1.3 var(--font-serif)", color: "var(--color-navy)" }}>{c.t}</span>
                  <span className="text-muted" style={{ font: "400 12.5px/1.4 var(--font-sans)" }}>
                    {c.r}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <ul className="m-0 flex w-full max-w-[520px] list-none flex-col gap-2.5 border-l border-steel p-0 pl-6 min-[980px]:hidden">
            {CHART.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`} className="flex flex-col gap-1 border border-line-strong bg-white px-[18px] py-4 no-underline">
                  <span style={{ font: "600 16px/1.3 var(--font-serif)", color: "var(--color-navy)" }}>{c.t}</span>
                  <span className="text-muted" style={{ font: "400 13px var(--font-sans)" }}>
                    {c.r}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="wrap flex flex-col pb-6" style={{ paddingTop: "clamp(8px,2vw,24px)" }}>
        {GOVERNANCE.map((g) => (
          <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="flex flex-wrap border-t border-line first:border-t-0" style={{ gap: "28px clamp(40px,6vw,88px)", padding: "clamp(48px,6vw,72px) 0" }}>
            <div className="flex flex-[1_1_340px] flex-col gap-4">
              <Eyebrow>{g.kicker}</Eyebrow>
              <h2 id={`${g.id}-h`} className="h2-sm">
                {g.t}
              </h2>
              {g.intro.map((p) => (
                <p key={p} className="m-0" style={{ font: "400 16.5px/1.7 var(--font-sans)", textWrap: "pretty" }}>
                  {p}
                </p>
              ))}
            </div>
            <div className="flex flex-[1.35_1_440px] flex-col">
              <h3 className="m-0 pb-3 text-navy" style={{ font: "600 12px/1.4 var(--font-sans)", letterSpacing: ".12em", textTransform: "uppercase" }}>
                Principal responsibilities
              </h3>
              <ol className="m-0 list-none p-0">
                {g.items.map((it, i) => (
                  <li key={it} className="grid grid-cols-[40px_1fr] gap-2.5 border-t border-line py-3.5" style={{ font: "400 15.5px/1.6 var(--font-sans)" }}>
                    <span style={{ font: "500 15px/1.6 var(--font-serif)", color: "var(--color-steel)" }}>{String(i + 1).padStart(2, "0")}</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ol>
              {g.foot && (
                <p className="m-0 mt-[18px] border border-line bg-mist px-5 py-[18px]" style={{ font: "400 14.5px/1.62 var(--font-sans)" }}>
                  {g.foot}
                </p>
              )}
            </div>
          </section>
        ))}
      </div>

      <section id="g-exec" aria-labelledby="g-exec-h" className="dark on-dark">
        <div className="wrap section flex flex-col gap-11">
          <div className="flex max-w-[760px] flex-col gap-[18px]">
            <Eyebrow dark>Executive Secretariat</Eyebrow>
            <h2 id="g-exec-h" className="h2-sm">
              Executive structure
            </h2>
          </div>
          <div className="grid gap-px p-px" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))" }}>
            {EXECUTIVE.map((e) => (
              <div key={e.t} className="flex flex-col gap-2.5 bg-navy px-7 py-[30px]" style={{ boxShadow: "0 0 0 1px var(--color-rule)" }}>
                <h3 className="m-0" style={{ font: "600 19px/1.3 var(--font-serif)" }}>
                  {e.t}
                </h3>
                <p className="m-0 text-fog" style={{ font: "400 15px/1.62 var(--font-sans)", textWrap: "pretty" }}>
                  {e.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
