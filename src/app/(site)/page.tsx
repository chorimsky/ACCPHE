import Link from "next/link";
import { Mark, Ornament } from "@/components/brand/mark";
import { Eyebrow } from "@/components/site/blocks";
import { JsonLd } from "@/components/seo/json-ld";
import { FRAMEWORK, SEO } from "@/content/site";
import { getBlock, getClasses, getFaqs, getPillars, getVmp } from "@/server/content";
import { fmtMonth } from "@/lib/format";
import { faqGraph, pageGraph, seoFor } from "@/lib/seo";
import { publishedArticles } from "@/server/queries/public";

export const metadata = seoFor("home", "/");

const FACTS = [
  { n: "12", t: "Institutional accreditation standards" },
  { n: "8", t: "Stages in the evaluation pathway" },
  { n: "3", t: "Distinct institutional classifications" },
  { n: "6", t: "Bodies in the governance framework" },
];

export default async function HomePage() {
  const [allNews, hero, welcome, VMP, PILLARS, CLASSES, GOVERNING_BODIES] = await Promise.all([
    publishedArticles(),
    getBlock<{ eyebrow: string; title: string; lede: string }>("home.hero"),
    getBlock<{ title: string; paragraphs: string[]; quote: string }>("home.welcome"),
    getVmp(),
    getPillars(),
    getClasses(),
    getBlock<{ t: string; r: string }[]>("bodies"),
  ]);
  const news = allNews.slice(0, 3);
  const [title, desc] = SEO.home;
  return (
    <>
      <JsonLd data={pageGraph("/", title, desc, [])} />
      <JsonLd data={faqGraph(await getFaqs())} />

      <section className="dark relative overflow-hidden">
        <Ornament size={880} cross={false} className="hidden md:block" style={{ right: -120, top: 40 }} />
        <div className="wrap relative flex flex-wrap items-end gap-14" style={{ paddingTop: "clamp(72px,10vw,128px)", paddingBottom: "clamp(56px,6vw,72px)" }}>
          <div className="flex flex-[999_1_560px] flex-col gap-7">
            <Eyebrow dark>{hero.eyebrow}</Eyebrow>
            <h1 className="h1-hero">{hero.title}</h1>
            <p className="m-0 max-w-[620px] text-fog" style={{ font: "400 clamp(17px,1.5vw,20px)/1.6 var(--font-sans)", textWrap: "pretty" }}>
              {hero.lede}
            </p>
            <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/accreditation" className="btn btn-light">
                Explore the Accreditation Process
              </Link>
              <Link href="/about" className="btn btn-ghost">
                About the Council
              </Link>
            </div>
          </div>
          <form role="search" action="/directory" method="get" className="flex max-w-[440px] flex-[1_1_340px] flex-col gap-4 rounded-[2px] bg-white p-8 text-navy" style={{ boxShadow: "0 24px 48px rgba(6,18,32,.28)" }}>
            <div className="flex items-center justify-between gap-3">
              <span className="caps">Status verification</span>
              <span className="border border-line bg-mist px-2 py-1 text-navy" style={{ font: "600 11px var(--font-sans)", letterSpacing: ".06em" }}>
                Official record
              </span>
            </div>
            <span style={{ font: "500 26px/1.2 var(--font-serif)" }}>Verify an institution</span>
            <span className="text-slate" style={{ font: "400 14.5px/1.55 var(--font-sans)" }}>
              Search the official directory for current membership and accreditation records, including effective dates and conditions.
            </span>
            <label className="field">
              Institution name or country
              <input name="q" placeholder="Start typing…" className="input" autoComplete="off" />
            </label>
            <button type="submit" className="btn btn-primary w-full">
              Search the Directory
            </button>
          </form>
        </div>
        <div className="wrap relative" style={{ paddingBottom: "clamp(48px,6vw,72px)" }}>
          <dl className="m-0 grid border-t border-rule" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))" }}>
            {FACTS.map((f) => (
              <div key={f.n} className="flex items-baseline gap-4 pr-6 pt-[26px]">
                <dt style={{ font: "500 40px/1 var(--font-serif)" }}>{f.n}</dt>
                <dd className="m-0 max-w-[170px] text-haze" style={{ font: "400 14px/1.45 var(--font-sans)" }}>
                  {f.t}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-white">
        <div className="wrap section flex flex-wrap items-center" style={{ gap: "clamp(40px,6vw,88px)" }}>
          <div className="flex max-w-[640px] flex-[1.25_1_480px] flex-col gap-[22px]">
            <Eyebrow>Welcome to ACCPHE</Eyebrow>
            <h2 className="h2">{welcome.title}</h2>
            {welcome.paragraphs.map((p) => (
              <p key={p} className="body-lg">
                {p}
              </p>
            ))}
            <div className="pt-2">
              <Link href="/about" className="link-arrow">
                Read about the Council
              </Link>
            </div>
          </div>
          <figure className="dark relative m-0 flex min-h-[420px] flex-[1_1_380px] flex-col justify-between gap-10 overflow-hidden" style={{ padding: "clamp(32px,4vw,52px)" }}>
            <Ornament size={460} cross={false} style={{ right: -190, top: -190 }} />
            <div className="relative flex items-center gap-3.5">
              <Mark size={52} tone="light" />
              <span className="caps text-haze">Guiding conviction</span>
            </div>
            <blockquote className="relative m-0" style={{ font: "400 clamp(22px,2.2vw,28px)/1.42 var(--font-serif)", letterSpacing: "-.005em", textWrap: "pretty" }}>
              “{welcome.quote}”
            </blockquote>
            <figcaption className="relative grid grid-cols-[auto_auto_auto] justify-between gap-x-4 border-t border-rule pt-5">
              {[
                ["Quality", "Academic standards"],
                ["Integrity", "Ethical governance"],
                ["Improvement", "Continuous review"],
              ].map(([a, b]) => (
                <div key={a} className="flex flex-col gap-1">
                  <span style={{ font: "500 clamp(17px,1.7vw,22px)/1.1 var(--font-serif)" }}>{a}</span>
                  <span className="text-haze" style={{ font: "400 12.5px/1.4 var(--font-sans)" }}>
                    {b}
                  </span>
                </div>
              ))}
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="tint border-y border-line">
        <div className="wrap grid gap-x-12" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))" }}>
          {VMP.map((v) => (
            <div key={v.t} className="-mt-px flex flex-col gap-4 border-t-[3px] border-navy pb-[60px] pt-14">
              <h2 className="caps m-0">Our {v.t}</h2>
              <p className="m-0 text-navy" style={{ font: "400 19px/1.55 var(--font-serif)", textWrap: "pretty" }}>
                {v.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="wrap section flex flex-col gap-14">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex max-w-[680px] flex-col gap-[18px]">
              <Eyebrow>Core Pillars</Eyebrow>
              <h2 className="h2">Four commitments that guide the Council’s work</h2>
            </div>
            <p className="m-0 max-w-[420px] text-slate" style={{ font: "400 16px/1.65 var(--font-sans)" }}>
              Each pillar informs the standards, evaluation practice, and professional guidance the Council provides.
            </p>
          </div>
          <div className="hairline-grid grid-cols-1 min-[620px]:grid-cols-2 min-[1100px]:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.t} className="flex flex-col gap-4 px-[30px] pb-10 pt-9">
                <span style={{ font: "500 15px var(--font-serif)", color: "var(--color-steel)", letterSpacing: ".06em" }}>{p.n}</span>
                <h3 className="h3-serif">{p.t}</h3>
                <p className="m-0" style={{ font: "400 15px/1.68 var(--font-sans)", textWrap: "pretty" }}>
                  {p.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dark on-dark relative overflow-hidden">
        <div className="wrap section flex flex-wrap" style={{ gap: "clamp(40px,6vw,88px)" }}>
          <div className="flex flex-[1_1_360px] flex-col gap-[22px]">
            <Eyebrow dark>Accreditation and Institutional Development</Eyebrow>
            <h2 className="h2">A structured approach to quality assurance</h2>
            <p className="body-lg">
              Accreditation evaluates an institution’s academic operations, governance, educational resources, and quality assurance practices against established standards — through self-assessment, independent
              review, transparent decision-making, and continuous improvement.
            </p>
            <p className="m-0 border border-rule px-5 py-[18px] text-line" style={{ font: "500 14.5px/1.6 var(--font-sans)" }}>
              Membership alone does not constitute accreditation or establish an institution’s legal authority to award academic degrees.
            </p>
            <div className="pt-1.5">
              <Link href="/accreditation" className="btn btn-light">
                Explore the Accreditation Process
              </Link>
            </div>
          </div>
          <ol className="m-0 flex flex-[1_1_460px] list-none flex-col border-b border-rule p-0">
            {FRAMEWORK.map((f) => (
              <li key={f.n} className="grid grid-cols-[64px_1fr] items-baseline gap-4 border-t border-rule py-[26px]">
                <span style={{ font: "500 30px/1 var(--font-serif)", color: "var(--color-steel)" }}>{f.n}</span>
                <span style={{ font: "400 clamp(17px,1.5vw,19px)/1.45 var(--font-sans)" }}>{f.t}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="tint">
        <div className="wrap section flex flex-col gap-[52px]">
          <div className="flex max-w-[780px] flex-col gap-[18px]">
            <Eyebrow>Membership and Accreditation Categories</Eyebrow>
            <h2 className="h2">Recognizing institutional development and achievement</h2>
            <p className="body-lg">
              The Council’s framework provides three distinct classifications. Each is published separately in the official directory and must be represented accurately by participating institutions.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[1000px]:grid-cols-3 min-[1000px]:gap-6">
            {CLASSES.map((c) => (
              <article key={c.t} className="box box-top flex flex-col gap-4 px-8 pb-8 pt-9">
                <span className="tag">{c.kind}</span>
                <h3 className="m-0 text-navy" style={{ font: "600 25px/1.18 var(--font-serif)" }}>
                  {c.t}
                </h3>
                <p className="body">{c.short}</p>
                <p className="m-0 mt-auto border-t border-line pt-[18px] text-slate" style={{ font: "600 13.5px/1.55 var(--font-sans)" }}>
                  {c.note}
                </p>
              </article>
            ))}
          </div>
          <div>
            <Link href="/accreditation#c-process" className="link-arrow">
              How classifications are awarded
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="wrap section flex flex-wrap" style={{ gap: "clamp(40px,6vw,88px)" }}>
          <div className="flex flex-[1_1_380px] flex-col gap-[22px]">
            <Eyebrow>Institutional Governance</Eyebrow>
            <h2 className="h2">Built on independence, accountability, and professional judgment</h2>
            <p className="body-lg">
              Effective quality assurance depends on the integrity of the body responsible for administering it. Each governing body has defined responsibilities supporting oversight, independent academic
              evaluation, ethical conduct, and effective administration.
            </p>
            <div className="pt-1.5">
              <Link href="/governance" className="link-arrow">
                Explore our governance structure
              </Link>
            </div>
          </div>
          <ul className="hairline-grid flex-[1.1_1_440px] self-start" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,230px),1fr))" }}>
            {GOVERNING_BODIES.map((b) => (
              <li key={b.t} className="flex flex-col gap-2 px-[26px] pb-[26px] pt-6">
                <span style={{ font: "600 18px/1.3 var(--font-serif)", color: "var(--color-navy)" }}>{b.t}</span>
                <span className="text-muted" style={{ font: "400 14px/1.55 var(--font-sans)" }}>
                  {b.r}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="tint border-t border-line">
        <div className="wrap section flex flex-col gap-11">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-[18px]">
              <Eyebrow>Latest Announcements</Eyebrow>
              <h2 className="h2">News &amp; Insights</h2>
            </div>
            <Link href="/news" className="link-arrow">
              All news and insights
            </Link>
          </div>
          {news.length ? (
            <div className="grid grid-cols-1 gap-4 min-[1000px]:grid-cols-3 min-[1000px]:gap-6">
              {news.map((a) => (
                <article key={a.id} className="box flex flex-col gap-3.5 px-[30px] py-8 transition-shadow hover:border-steel hover:shadow-[0_12px_28px_rgba(20,43,69,.08)]">
                  <div className="flex items-center gap-2.5" style={{ font: "600 11.5px/1.4 var(--font-sans)", letterSpacing: ".12em", textTransform: "uppercase" }}>
                    <span className="text-navy">{a.category}</span>
                    <span aria-hidden="true" className="h-[3px] w-[3px] rounded-full bg-steel" />
                    <time dateTime={a.date} className="text-muted">
                      {fmtMonth(a.date)}
                    </time>
                  </div>
                  <h3 className="m-0 text-navy" style={{ font: "600 22px/1.28 var(--font-serif)", textWrap: "pretty" }}>
                    <Link href={`/news/${a.slug}`} className="text-navy no-underline hover:underline">
                      {a.title}
                    </Link>
                  </h3>
                  <p className="m-0" style={{ font: "400 15px/1.65 var(--font-sans)", textWrap: "pretty" }}>
                    {a.excerpt}
                  </p>
                  <div className="mt-auto pt-1.5">
                    <Link href={`/news/${a.slug}`} className="link-arrow" style={{ fontSize: 14.5 }} aria-label={`Read article: ${a.title}`}>
                      Read article
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="m-0 text-muted" style={{ font: "500 19px var(--font-serif)" }}>
              Announcements will be published here.
            </p>
          )}
        </div>
      </section>

      <section className="bg-white">
        <div className="wrap" style={{ paddingBlock: "clamp(64px,8vw,96px)" }}>
          <div className="flex flex-wrap items-center justify-between gap-8 border border-line" style={{ padding: "clamp(32px,5vw,56px)" }}>
            <div className="flex max-w-[720px] flex-[1_1_520px] flex-col gap-4">
              <h2 className="m-0 text-navy" style={{ font: "500 clamp(28px,3vw,38px)/1.14 var(--font-serif)", textWrap: "balance" }}>
                Committed to institutional excellence?
              </h2>
              <p className="body-lg">
                Whether your institution is preparing for accreditation, strengthening its internal quality assurance systems, or seeking guidance on institutional development, ACCPHE welcomes inquiries from
                eligible Christian and private higher education institutions.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/apply" className="btn btn-primary">
                Submit an Institutional Inquiry
              </Link>
              <Link href="/contact" className="btn btn-outline">
                Contact the Council
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
