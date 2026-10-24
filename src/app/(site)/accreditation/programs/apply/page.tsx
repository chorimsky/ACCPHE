import Link from "next/link";
import { PageHero } from "@/components/site/blocks";
import { ProgramApplicationForm } from "@/components/site/program-form";
import { JsonLd } from "@/components/seo/json-ld";
import { SEO } from "@/content/site";
import { pageGraph, seoFor } from "@/lib/seo";
import { getProgramAccreditation } from "@/server/content";
import { MAX_UPLOAD_LABEL } from "@/server/storage";

export const metadata = seoFor("programApply", "/accreditation/programs/apply");

export default async function ProgramApplyPage() {
  const [title, desc] = SEO.programApply;
  const P = await getProgramAccreditation();
  return (
    <>
      <JsonLd
        data={pageGraph("/accreditation/programs/apply", title, desc, [
          { name: "Accreditation", path: "/accreditation" },
          { name: "Independent Program Accreditation & Recognition", path: "/accreditation/programs" },
          { name: "Apply", path: "/accreditation/programs/apply" },
        ])}
      />
      <PageHero
        crumbs={[{ label: "Accreditation", href: "/accreditation" }, { label: "Program Accreditation", href: "/accreditation/programs" }, { label: "Apply" }]}
        title="Apply for Program Accreditation"
        lede="Submit an individual certificate, diploma, professional development, or training program for independent evaluation against ACCPHE’s program standards."
      />
      <div className="wrap flex flex-wrap items-start" style={{ paddingTop: "clamp(48px,6vw,80px)", paddingBottom: "clamp(72px,9vw,112px)", gap: "clamp(40px,6vw,88px)" }}>
        <aside className="flex flex-[1_1_260px] flex-col gap-[18px]">
          <span className="caps">How it works</span>
          <ol className="m-0 flex list-none flex-col gap-[18px] p-0">
            {P.steps.map((s, i) => (
              <li key={s.t} className="grid grid-cols-[34px_1fr] gap-2" style={{ font: "400 14.5px/1.5 var(--font-sans)" }}>
                <span style={{ font: "500 15px/1.5 var(--font-serif)", color: "var(--color-steel)" }}>{String(i + 1).padStart(2, "0")}</span>
                <span>{s.t}</span>
              </li>
            ))}
          </ol>
          <p className="m-0 mt-1.5 border-t border-line pt-[18px] text-muted" style={{ font: "400 14px/1.6 var(--font-sans)" }}>
            Submitting an application does not guarantee accreditation, recognition, or any particular decision.
          </p>
          <Link href="/accreditation/programs#p-standards" className="link-arrow">
            Read the program standards
          </Link>
          <Link href="/directory/programs" className="link-arrow">
            Directory of approved programs
          </Link>
        </aside>
        <div className="min-w-0 max-w-[820px] flex-[999_1_560px]">
          <ProgramApplicationForm maxLabel={MAX_UPLOAD_LABEL} />
        </div>
      </div>
    </>
  );
}
