import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleBody } from "@/components/site/article-body";
import { Breadcrumbs } from "@/components/site/blocks";
import { JsonLd } from "@/components/seo/json-ld";
import { fmtMonth } from "@/lib/format";
import { ORG_ID, pageGraph, pageMetadata } from "@/lib/seo";
import { abs } from "@/lib/site";
import { articleBySlug, publishedArticles } from "@/server/queries/public";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await articleBySlug((await params).slug);
  if (!a) return { title: "Article not found | ACCPHE", robots: { index: false } };
  return pageMetadata(`/news/${a.slug}`, `${a.title} | ACCPHE`, a.excerpt, {
    openGraph: { type: "article", title: a.title, description: a.excerpt, url: abs(`/news/${a.slug}`), publishedTime: a.date, modifiedTime: a.updatedAt.toISOString(), section: a.category, siteName: "ACCPHE" },
  });
}

export default async function ArticlePage({ params }: Props) {
  const a = await articleBySlug((await params).slug);
  if (!a) notFound();
  const hasBody = !!a.body.trim();
  const more = (await publishedArticles()).filter((x) => x.id !== a.id).slice(0, 2);
  const news = {
    "@type": "NewsArticle",
    "@id": `${abs(`/news/${a.slug}`)}#article`,
    headline: a.title,
    description: a.excerpt,
    datePublished: a.date,
    dateModified: a.updatedAt.toISOString(),
    articleSection: a.category,
    inLanguage: "en",
    mainEntityOfPage: abs(`/news/${a.slug}`),
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };
  return (
    <article>
      <JsonLd data={pageGraph(`/news/${a.slug}`, a.title, a.excerpt, [{ name: "News & Insights", path: "/news" }, { name: a.title }], [news])} />
      <header className="dark">
        <div className="mx-auto flex max-w-[960px] flex-col gap-[22px] px-[clamp(20px,4vw,40px)]" style={{ paddingTop: "clamp(48px,6vw,80px)", paddingBottom: "clamp(48px,6vw,72px)" }}>
          <Breadcrumbs crumbs={[{ label: "News & Insights", href: "/news" }, { label: a.title }]} />
          <div className="flex items-center gap-3" style={{ font: "600 12px/1.4 var(--font-sans)", letterSpacing: ".14em", textTransform: "uppercase" }}>
            <span>{a.category}</span>
            <span aria-hidden="true" className="h-[3px] w-[3px] rounded-full bg-steel" />
            <time dateTime={a.date} className="text-haze">
              {fmtMonth(a.date)}
            </time>
          </div>
          <h1 className="m-0" style={{ font: "500 clamp(34px,4.2vw,52px)/1.1 var(--font-serif)", letterSpacing: "-.01em", textWrap: "balance" }}>
            {a.title}
          </h1>
          <p className="m-0 text-fog" style={{ font: "400 clamp(17px,1.5vw,20px)/1.6 var(--font-sans)", textWrap: "pretty" }}>
            {a.excerpt}
          </p>
        </div>
      </header>
      <div className="mx-auto flex max-w-[960px] flex-col gap-[22px] px-[clamp(20px,4vw,40px)]" style={{ paddingTop: "clamp(48px,6vw,72px)", paddingBottom: "clamp(64px,8vw,96px)" }}>
        <ArticleBody text={a.body} />
        {!hasBody && (
          <p className="m-0 max-w-[720px] text-muted" style={{ font: "400 15px/1.6 var(--font-sans)" }}>
            The full text of this announcement will be published here.
          </p>
        )}
        <div className="mt-8 flex max-w-[720px] flex-wrap items-center justify-between gap-4 border-t border-line pt-7">
          <Link href="/news" className="text-navy no-underline hover:text-slate" style={{ font: "600 15px var(--font-sans)" }}>
            ← All news and insights
          </Link>
          <Link href="/contact" className="text-navy" style={{ font: "600 15px var(--font-sans)" }}>
            Media and general inquiries
          </Link>
        </div>
      </div>
      {more.length > 0 && (
        <aside aria-labelledby="more-news" className="tint border-t border-line">
          <div className="mx-auto flex max-w-[960px] flex-col gap-6 px-[clamp(20px,4vw,40px)]" style={{ paddingBlock: "clamp(48px,6vw,72px)" }}>
            <h2 id="more-news" className="eyebrow m-0">
              More from News &amp; Insights
            </h2>
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))" }}>
              {more.map((m) => (
                <Link key={m.id} href={`/news/${m.slug}`} className="box flex flex-col gap-2.5 p-6 no-underline hover:border-steel">
                  <span className="caps-sm">
                    {m.category} · {fmtMonth(m.date)}
                  </span>
                  <span style={{ font: "600 18px/1.3 var(--font-serif)", color: "var(--color-navy)" }}>{m.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      )}
    </article>
  );
}
