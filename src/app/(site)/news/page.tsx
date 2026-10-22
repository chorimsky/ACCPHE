import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/site/blocks";
import { JsonLd } from "@/components/seo/json-ld";
import { SEO } from "@/content/site";
import { ARTICLE_CATEGORIES } from "@/db/schema";
import { fmtMonth } from "@/lib/format";
import { pageGraph, seoFor } from "@/lib/seo";
import { abs, slugify } from "@/lib/site";
import { publishedArticles } from "@/server/queries/public";

/** Website filter: the five public categories in the prototype, plus Accreditation used by the portal. */
const CATS = ["All", "Announcements", "Accreditation", "Standards", "Quality Assurance", "Governance", "Christian Higher Education"] as const;

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const sp = await searchParams;
  const base = seoFor("news", "/news");
  return sp.category ? { ...base, robots: { index: false, follow: true } } : base;
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const catKey = typeof sp.category === "string" ? sp.category : "";
  const cat = ARTICLE_CATEGORIES.find((c) => slugify(c) === catKey) ?? "All";
  const all = await publishedArticles();
  const list = all.filter((a) => cat === "All" || a.category === cat);
  const [title, desc] = SEO.news;
  const used = new Set(all.map((a) => a.category));
  return (
    <>
      <JsonLd
        data={pageGraph("/news", title, desc, [{ name: "News & Insights", path: "/news" }], [
          { "@type": "ItemList", name: "News & Insights", itemListElement: all.slice(0, 20).map((a, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/news/${a.slug}`), name: a.title })) },
        ])}
      />
      <PageHero
        crumbs={[{ label: "News & Insights" }]}
        title="News & Insights"
        lede="Articles on accreditation, academic excellence, institutional governance, quality assurance, Christian higher education, and developments within the Council."
      />
      <section className="bg-white">
        <div className="wrap flex flex-col gap-9" style={{ paddingTop: "clamp(40px,5vw,56px)", paddingBottom: "clamp(72px,9vw,104px)" }}>
          <nav aria-label="Categories" className="flex flex-wrap gap-2">
            {CATS.filter((c) => c === "All" || c !== "Accreditation" || used.has(c)).map((c) => {
              const on = c === cat;
              return (
                <Link
                  key={c}
                  href={c === "All" ? "/news" : `/news?category=${slugify(c)}`}
                  scroll={false}
                  aria-current={on ? "page" : undefined}
                  className="rounded-full border px-4 py-2.5 no-underline transition-colors"
                  style={{
                    font: "600 13.5px var(--font-sans)",
                    background: on ? "var(--color-navy)" : "transparent",
                    color: on ? "var(--color-mist)" : "var(--color-navy)",
                    borderColor: on ? "var(--color-navy)" : "var(--color-line-strong)",
                  }}
                >
                  {c}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-col border-t border-navy">
            {list.map((a) => (
              <article key={a.id} className="flex flex-wrap border-b border-line py-10" style={{ gap: "14px clamp(32px,5vw,72px)" }}>
                <div className="flex flex-[0_0_200px] flex-col gap-2" style={{ font: "600 11.5px/1.4 var(--font-sans)", letterSpacing: ".12em", textTransform: "uppercase" }}>
                  <span className="text-navy">{a.category}</span>
                  <time dateTime={a.date} className="text-muted">
                    {fmtMonth(a.date)}
                  </time>
                </div>
                <div className="flex max-w-[780px] flex-[1_1_480px] flex-col gap-3">
                  <h2 className="m-0" style={{ font: "500 clamp(23px,2.3vw,28px)/1.22 var(--font-serif)", textWrap: "pretty" }}>
                    <Link href={`/news/${a.slug}`} className="text-navy no-underline hover:underline" style={{ textUnderlineOffset: 4 }}>
                      {a.title}
                    </Link>
                  </h2>
                  <p className="m-0" style={{ font: "400 16.5px/1.68 var(--font-sans)", textWrap: "pretty" }}>
                    {a.excerpt}
                  </p>
                  <Link href={`/news/${a.slug}`} className="link-arrow mt-1" style={{ fontSize: 14.5 }} aria-label={`Read article: ${a.title}`}>
                    Read article
                  </Link>
                </div>
              </article>
            ))}
            {!list.length && (
              <p className="m-0 py-14 text-muted" style={{ font: "500 20px var(--font-serif)" }}>
                No articles have been published in this category yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
