import { AsideBox, PageHero } from "@/components/site/blocks";
import { ContactForm } from "@/components/site/contact-form";
import { JsonLd } from "@/components/seo/json-ld";
import { CONTACT_ROUTES, SEO } from "@/content/site";
import { ORG_ID, pageGraph, seoFor } from "@/lib/seo";
import { getSiteContent } from "@/server/queries/public";

export const metadata = seoFor("contact", "/contact");

/** ?topic= preselects the nature of the inquiry from links elsewhere on the site. */
const TOPICS: Record<string, string> = {
  general: "General inquiry",
  membership: "Membership and accreditation",
  programs: "Program accreditation",
  verification: "Status verification",
  ethics: "Standards & Ethics Committee",
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const c = await getSiteContent();
  const [title, desc] = SEO.contact;
  const topic = typeof sp.topic === "string" ? TOPICS[sp.topic] : undefined;
  const contactPoint =
    c.email || c.phone
      ? [{ "@type": "Organization", "@id": ORG_ID, contactPoint: { "@type": "ContactPoint", contactType: "Executive Secretariat", ...(c.email ? { email: c.email } : {}), ...(c.phone ? { telephone: c.phone } : {}) } }]
      : [];
  return (
    <>
      <JsonLd data={pageGraph("/contact", title, desc, [{ name: "Contact", path: "/contact" }], [{ "@type": "ContactPage" }, ...contactPoint])} />
      <PageHero crumbs={[{ label: "Contact" }]} title="Contact the Council" lede="Correspondence is handled by the Executive Secretariat and directed to the appropriate Council body." />
      <div className="wrap flex flex-wrap items-start" style={{ paddingTop: "clamp(48px,6vw,80px)", paddingBottom: "clamp(72px,9vw,112px)", gap: "clamp(40px,6vw,88px)" }}>
        <aside className="flex flex-[1_1_300px] flex-col">
          {(c.email || c.phone || c.address) && (
            <address className="dark mb-8 flex flex-col gap-3 p-6 not-italic">
              <span className="caps text-haze">Executive Secretariat</span>
              {c.email && (
                <a href={`mailto:${c.email}`} className="text-mist hover:text-mist" style={{ font: "500 16px var(--font-sans)" }}>
                  {c.email}
                </a>
              )}
              {c.phone && (
                <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="text-line no-underline hover:text-line" style={{ font: "500 15px var(--font-sans)" }}>
                  {c.phone}
                </a>
              )}
              {c.address && (
                <span className="whitespace-pre-line text-fog" style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>
                  {c.address}
                </span>
              )}
            </address>
          )}
          <h2 className="caps m-0 pb-4">How we can help</h2>
          <dl className="m-0 border-t border-line">
            {CONTACT_ROUTES.map((r) => (
              <div key={r.t} className="flex flex-col gap-1.5 border-b border-line py-[22px]">
                <dt style={{ font: "600 17.5px var(--font-serif)", color: "var(--color-navy)" }}>{r.t}</dt>
                <dd className="m-0" style={{ font: "400 14.5px/1.55 var(--font-sans)" }}>
                  {r.d}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-6">
            <AsideBox title="Applying for accreditation?" text="Use the institutional inquiry form so the Secretariat receives the information it needs." href="/apply" cta="Go to the inquiry form" />
          </div>
        </aside>
        <div className="min-w-0 max-w-[760px] flex-[999_1_520px]">
          <ContactForm routes={CONTACT_ROUTES.map((r) => r.t)} initialRoute={topic ?? CONTACT_ROUTES[0].t} />
        </div>
      </div>
    </>
  );
}
