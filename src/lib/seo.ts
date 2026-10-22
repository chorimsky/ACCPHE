import type { Metadata } from "next";
import { SEO } from "@/content/site";
import { abs, INDEXABLE, ORG, SITE_URL } from "@/lib/site";

export const ORG_ID = `${SITE_URL}/#organization`;
export const SITE_ID = `${SITE_URL}/#website`;

/** Metadata for a public page: title, description, canonical URL, Open Graph and Twitter. */
export function pageMetadata(path: string, title: string, description: string, extra: Partial<Metadata> = {}): Metadata {
  const url = abs(path);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, types: { "application/rss+xml": [{ url: abs("/news/rss.xml"), title: "ACCPHE — News & Insights" }] } },
    openGraph: { type: "website", siteName: "ACCPHE", title, description, url, locale: "en_US", images: [{ url: abs("/opengraph-image"), width: 1200, height: 630, alt: ORG.name }] },
    twitter: { card: "summary_large_image", title, description },
    robots: INDEXABLE ? { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } : { index: false, follow: false },
    ...extra,
  };
}

/** Metadata for one of the fixed pages listed in SEO (content/site.ts). */
export function seoFor(key: keyof typeof SEO & string, path: string) {
  const [title, desc] = SEO[key];
  return pageMetadata(path, title, desc);
}

/** Site-wide graph: Organization, WebSite (with directory search) and the accreditation FAQ. */
export function siteGraph() {
  const sameAs = (process.env.ORG_SAME_AS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: ORG.name,
        alternateName: ORG.short,
        url: SITE_URL,
        logo: abs("/icon"),
        description: ORG.description,
        slogan: ORG.slogan,
        areaServed: "Worldwide",
        knowsAbout: ["Higher education accreditation", "Quality assurance", "Christian higher education", "Private higher education", "Institutional governance", "Academic integrity"],
        ...(sameAs.length ? { sameAs } : {}),
      },
      {
        "@type": "WebSite",
        "@id": SITE_ID,
        url: SITE_URL,
        name: ORG.short,
        publisher: { "@id": ORG_ID },
        inLanguage: "en",
        potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${abs("/directory")}?q={search_term_string}` }, "query-input": "required name=search_term_string" },
      },
    ],
  };
}

export function faqGraph(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${abs("/accreditation")}#faq`,
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

/** WebPage + BreadcrumbList for a page; `extra` adds page-specific nodes (HowTo, ItemList, NewsArticle…). */
export function pageGraph(path: string, name: string, description: string, crumbs: { name: string; path?: string }[], extra: object[] = []) {
  const url = abs(path);
  const items = [{ name: "Home", path: "/" }, ...crumbs];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name,
        description,
        isPartOf: { "@id": SITE_ID },
        about: { "@id": ORG_ID },
        inLanguage: "en",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, ...(c.path ? { item: abs(c.path) } : {}) })),
        },
      },
      ...extra,
    ],
  };
}
