import Link from "next/link";
import { PageHero } from "@/components/site/blocks";
import { InquiryForm } from "@/components/site/inquiry-form";
import { JsonLd } from "@/components/seo/json-ld";
import { FRAMEWORK, SEO } from "@/content/site";
import { INSTITUTION_TYPES } from "@/lib/domain";
import { pageGraph, seoFor } from "@/lib/seo";
import { MAX_UPLOAD_LABEL } from "@/server/storage";

export const metadata = seoFor("apply", "/apply");

export default function ApplyPage() {
  const [title, desc] = SEO.apply;
  return (
    <>
      <JsonLd data={pageGraph("/apply", title, desc, [{ name: "Accreditation", path: "/accreditation" }, { name: "Apply", path: "/apply" }])} />
      <PageHero
        crumbs={[{ label: "Accreditation", href: "/accreditation" }, { label: "Apply" }]}
        title="Begin Your Institutional Evaluation"
        lede="Institutions interested in ACCPHE membership or accreditation are invited to submit an initial inquiry. The Secretariat will review the information provided and communicate the appropriate next steps."
      />
      <div className="wrap flex flex-wrap items-start" style={{ paddingTop: "clamp(48px,6vw,80px)", paddingBottom: "clamp(72px,9vw,112px)", gap: "clamp(40px,6vw,88px)" }}>
        <aside className="flex flex-[1_1_260px] flex-col gap-[18px]">
          <span className="caps">The pathway</span>
          <ol className="m-0 flex list-none flex-col gap-[18px] p-0">
            {FRAMEWORK.map((f) => (
              <li key={f.n} className="grid grid-cols-[34px_1fr] gap-2" style={{ font: "400 14.5px/1.5 var(--font-sans)" }}>
                <span style={{ font: "500 15px/1.5 var(--font-serif)", color: "var(--color-steel)" }}>{f.n}</span>
                <span>{f.t}</span>
              </li>
            ))}
          </ol>
          <p className="m-0 mt-1.5 border-t border-line pt-[18px] text-muted" style={{ font: "400 14px/1.6 var(--font-sans)" }}>
            Submitting an inquiry does not guarantee admission, accreditation, or any particular decision.
          </p>
          <Link href="/accreditation#c-faq" className="link-arrow">
            Read the accreditation FAQ
          </Link>
        </aside>
        <div className="min-w-0 max-w-[820px] flex-[999_1_560px]">
          <InquiryForm types={INSTITUTION_TYPES} maxLabel={MAX_UPLOAD_LABEL} />
        </div>
      </div>
    </>
  );
}
