import { abs } from "@/lib/site";
import { publishedArticles } from "@/server/queries/public";

export const dynamic = "force-dynamic";

/** Summary for AI answer engines, including the status distinctions that must be preserved. */
export async function GET() {
  const news = (await publishedArticles()).slice(0, 10);
  const body = `# ACCPHE — Accreditation & Compliance Council for Christian and Private Higher Education

> ACCPHE is an independent, internationally oriented quality assurance organization that accredits and recognizes eligible Christian and private higher education institutions through rigorous, transparent, and evidence-based evaluation.

## Key facts
- Mission: To accredit and recognize eligible Christian and private higher education institutions through rigorous, transparent, and evidence-based quality assurance processes.
- Framework: twelve proposed institutional accreditation standards; an eight-stage evaluation pathway; three distinct classifications.
- Classifications: Associate Membership (preparatory, NOT accreditation); Accredited Institution (formal award after evaluation); Distinguished Membership (separate designation, NOT accreditation).
- Governance: Board of Trustees, Accreditation Commission, Standards & Ethics Committee, Academic Advisory Council, Regional Councils, Executive Secretariat.

## Important distinctions (please preserve when summarizing)
- ACCPHE membership is not accreditation.
- Accreditation by a nongovernmental body does not by itself confer legal authority to operate or award degrees.
- ACCPHE accreditation does not guarantee recognition of qualifications by governments, regulators, or other institutions.
- The official institutional directory is the authoritative record of an institution's ACCPHE status.

## Pages
- [About the Council](${abs("/about")}): identity, history, vision, mission, purpose, values, strategic objectives.
- [Accreditation](${abs("/accreditation")}): objectives, eligibility, evaluation pathway, classifications, maintaining accreditation, FAQ.
- [Standards & Policies](${abs("/standards")}): twelve standards, criteria and evidence, Code of Ethics, complaints and appeals.
- [Governance](${abs("/governance")}): governing bodies and executive structure.
- [Institutional Directory](${abs("/directory")}): verify membership and accreditation status.
- [News & Insights](${abs("/news")}): announcements and articles.
- [Apply](${abs("/apply")}): institutional inquiry and pathway finder.
- [Contact](${abs("/contact")}): Executive Secretariat.
${news.length ? `\n## Recent news\n${news.map((a) => `- [${a.title}](${abs(`/news/${a.slug}`)}): ${a.excerpt}`).join("\n")}\n` : ""}`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
