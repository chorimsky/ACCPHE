import { ChromeProvider } from "@/components/site/chrome";
import { ConsentNotice } from "@/components/site/consent";
import { SiteFooter } from "@/components/site/footer";
import { LangNote, SiteHeader, SkipLink, TopBar } from "@/components/site/header";
import { SearchDialog } from "@/components/site/search";
import { JsonLd } from "@/components/seo/json-ld";
import { buildSearchIndex } from "@/lib/search-index";
import { siteGraph } from "@/lib/seo";
import { getBlock, getFaqs, getGovernance, getSocial, getStandards } from "@/server/content";
import { getSiteContent, publicPrograms, publicRecords, publishedArticles } from "@/server/queries/public";

/**
 * Every public page reads portal-managed content (banner, CMS texts, articles, directory) from the database, so the
 * site renders per request: scheduled articles appear on their date, record changes reach every page's search index,
 * and builds never query the production database.
 */
export const dynamic = "force-dynamic";

/** Public website shell. Content managed in the portal (banner, status notice) is read on every request. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [content, news, standards, faqs, governance, values, institutions, programs, social] = await Promise.all([
    getSiteContent(),
    publishedArticles(),
    getStandards(),
    getFaqs(),
    getGovernance(),
    getBlock<{ t: string; d: string }[]>("values"),
    publicRecords(),
    publicPrograms(),
    getSocial(),
  ]);
  return (
    <ChromeProvider>
      <JsonLd data={siteGraph(social.map((l) => l.url))} />
      <div className="flex min-h-screen flex-col">
        <SkipLink />
        {content.bannerOn && content.bannerText && (
          <div role="region" aria-label="Announcement" className="bg-slate text-mist">
            <p className="wrap m-0 py-[11px] text-center" style={{ font: "500 13.5px/1.5 var(--font-sans)" }}>
              {content.bannerText}
            </p>
          </div>
        )}
        <TopBar />
        <SiteHeader />
        <LangNote />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        {content.notice && (
          <aside aria-label="Status notice" className="bg-line">
            <div className="wrap flex items-start gap-3.5 py-5">
              <span aria-hidden="true" className="info-dot mt-px" style={{ width: 22, height: 22, fontSize: 12 }}>
                i
              </span>
              <p className="m-0 max-w-[1000px] text-navy" style={{ font: "400 13.5px/1.62 var(--font-sans)" }}>
                <strong className="font-bold">Status notice.</strong> {content.notice}
              </p>
            </div>
          </aside>
        )}
        <SiteFooter social={social} />
      </div>
      <SearchDialog index={buildSearchIndex({ news, standards, faqs, governance, values, institutions, programs })} />
      <ConsentNotice />
    </ChromeProvider>
  );
}
