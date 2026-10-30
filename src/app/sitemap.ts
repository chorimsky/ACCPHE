import type { MetadataRoute } from "next";
import { abs } from "@/lib/site";
import { publicFellows, publicPrograms, publicRecords, publishedArticles } from "@/server/queries/public";

export const dynamic = "force-dynamic";

const PAGES: [string, MetadataRoute.Sitemap[number]["changeFrequency"], number][] = [
  ["/", "weekly", 1],
  ["/about", "monthly", 0.8],
  ["/accreditation", "monthly", 0.9],
  ["/accreditation/programs", "monthly", 0.8],
  ["/accreditation/programs/apply", "monthly", 0.6],
  ["/directory/programs", "weekly", 0.8],
  ["/fellows", "monthly", 0.8],
  ["/fellows/apply", "monthly", 0.6],
  ["/directory/fellows", "weekly", 0.8],
  ["/standards", "monthly", 0.9],
  ["/governance", "monthly", 0.7],
  ["/directory", "weekly", 0.9],
  ["/news", "weekly", 0.7],
  ["/apply", "monthly", 0.8],
  ["/contact", "yearly", 0.5],
  ["/privacy", "yearly", 0.2],
  ["/accessibility", "yearly", 0.2],
  ["/terms", "yearly", 0.2],
];

/** Public pages, every published article, and every public institution and program record (added on publication). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, records, programs, fellows] = await Promise.all([publishedArticles(), publicRecords(), publicPrograms(), publicFellows()]);
  return [
    ...PAGES.map(([p, changeFrequency, priority]) => ({ url: abs(p), changeFrequency, priority })),
    ...articles.map((a) => ({ url: abs(`/news/${a.slug}`), lastModified: a.updatedAt, priority: 0.6 })),
    ...records.map((r) => ({ url: abs(`/directory/${r.slug}`), lastModified: r.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...programs.map((r) => ({ url: abs(`/directory/programs/${r.slug}`), lastModified: r.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...fellows.map((r) => ({ url: abs(`/directory/fellows/${r.slug}`), lastModified: r.updatedAt, changeFrequency: "monthly" as const, priority: 0.4 })),
  ];
}
