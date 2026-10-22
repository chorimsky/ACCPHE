import { SEO } from "@/content/site";
import type { SearchItem } from "@/components/site/search";

const PAGES: [string, string, string][] = [
  ["about", "About the Council", "/about"],
  ["accreditation", "Accreditation", "/accreditation"],
  ["standards", "Standards & Policies", "/standards"],
  ["governance", "Governance", "/governance"],
  ["directory", "Institutional Directory", "/directory"],
  ["news", "News & Insights", "/news"],
  ["apply", "Apply", "/apply"],
  ["contact", "Contact", "/contact"],
  ["privacy", "Privacy Notice", "/privacy"],
  ["accessibility", "Accessibility Statement", "/accessibility"],
  ["terms", "Terms of Use", "/terms"],
];

/** Everything the site search dialog can find. */
export function buildSearchIndex(d: {
  news: { slug: string; title: string; excerpt: string }[];
  standards: { t: string; s: string }[];
  faqs: { q: string; a: string }[];
  governance: { id: string; t: string; intro: string[] }[];
  values: { t: string; d: string }[];
  institutions: { slug: string; name: string; country: string; cls: string; status: string }[];
}): SearchItem[] {
  const { news, standards: STANDARDS, faqs: FAQS, governance: GOVERNANCE, values: VALUES, institutions } = d;
  return [
    ...PAGES.map(([k, t, href]) => ({ kind: "Page", t, d: SEO[k]?.[1] ?? "", href })),
    ...STANDARDS.map((s, i) => ({ kind: `Standard ${i + 1}`, t: s.t, d: s.s, href: `/standards#standard-${i + 1}` })),
    ...FAQS.map((f, i) => ({ kind: "Question", t: f.q, d: f.a, href: `/accreditation#faq-${i + 1}` })),
    ...news.map((a) => ({ kind: "News", t: a.title, d: a.excerpt, href: `/news/${a.slug}` })),
    ...GOVERNANCE.map((g) => ({ kind: "Governance", t: g.t, d: g.intro[0], href: `/governance#${g.id}` })),
    { kind: "Governance", t: "Executive Secretariat", d: "Administration and implementation of policy.", href: "/governance#g-exec" },
    ...VALUES.map((v) => ({ kind: "Value", t: v.t, d: v.d, href: "/about#a-values" })),
    ...institutions.map((r) => ({ kind: "Institution", t: r.name, d: `${r.country} · ${r.cls}${r.status === "Published" ? "" : ` · ${r.status}`}`, href: `/directory/${r.slug}` })),
  ];
}
