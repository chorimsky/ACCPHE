import { plainText } from "@/components/site/article-body";
import { abs } from "@/lib/site";
import { articleBySlug, publishedArticles } from "@/server/queries/public";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

/** RSS 2.0 feed of News & Insights. */
export async function GET() {
  const list = (await publishedArticles()).slice(0, 30);
  const items = await Promise.all(
    list.map(async (a) => {
      const full = await articleBySlug(a.slug);
      const url = abs(`/news/${a.slug}`);
      return `<item><title>${esc(a.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(`${a.date}T09:00:00Z`).toUTCString()}</pubDate><category>${esc(a.category)}</category><description>${esc(a.excerpt)}</description>${full?.body ? `<content:encoded><![CDATA[${plainText(full.body).replace(/]]>/g, "]]]]><![CDATA[>")}]]></content:encoded>` : ""}</item>`;
    }),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
<title>ACCPHE — News &amp; Insights</title><link>${abs("/news")}</link><atom:link href="${abs("/news/rss.xml")}" rel="self" type="application/rss+xml"/>
<description>Announcements and insights from the Accreditation &amp; Compliance Council for Christian and Private Higher Education.</description><language>en</language>
${items.join("\n")}
</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=900" } });
}
