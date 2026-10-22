import type { MetadataRoute } from "next";
import { abs, INDEXABLE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) return { rules: [{ userAgent: "*", disallow: "/" }] };
  const rules = { allow: "/", disallow: ["/portal", "/api"] };
  return {
    rules: [
      { userAgent: "*", ...rules },
      // AI and answer-engine crawlers are welcome to index public pages.
      ...["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"].map((userAgent) => ({ userAgent, ...rules })),
    ],
    sitemap: abs("/sitemap.xml"),
    host: abs("/"),
  };
}
