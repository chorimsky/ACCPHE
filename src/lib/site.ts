/** Public site identity and URLs (safe to import from client and server code). */

export const SITE_URL = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");

/** Indexing is allowed only on the real production site unless forced with SITE_INDEXABLE. */
export const INDEXABLE =
  process.env.SITE_INDEXABLE === "true" ||
  (process.env.SITE_INDEXABLE !== "false" && SITE_URL.startsWith("https://") && process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview");

export const ORG = {
  name: "Accreditation & Compliance Council for Christian and Private Higher Education",
  short: "ACCPHE",
  slogan: "Strengthening Institutions. Advancing Educational Quality.",
  description:
    "ACCPHE is an independent, internationally oriented quality assurance and accreditation council for Christian and private higher education institutions. Standards, accreditation process, governance, and the official directory of member and accredited institutions.",
  keywords: [
    "Christian higher education accreditation",
    "private higher education accreditation",
    "quality assurance council",
    "institutional accreditation standards",
    "accredited Christian universities directory",
    "ACCPHE",
  ],
};

export const abs = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export function slugify(s: string, max = 80): string {
  const slug = s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");
  return slug || "item";
}
