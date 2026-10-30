import Link from "next/link";
import { PageHero } from "@/components/site/blocks";
import { FellowApplicationForm } from "@/components/site/fellow-form";
import { JsonLd } from "@/components/seo/json-ld";
import { SEO } from "@/content/site";
import { DISTINCTIONS } from "@/lib/domain";
import { pageGraph, seoFor } from "@/lib/seo";
import { getFellowsPage } from "@/server/content";
import { MAX_UPLOAD_LABEL } from "@/server/storage";

export const metadata = seoFor("fellowsApply", "/fellows/apply");

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function FellowApplyPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const nomination = sp.route === "nomination";
  const sought = typeof sp.distinction === "string" && DISTINCTIONS.some((d) => d.code === sp.distinction) ? sp.distinction : "";
  const [title, desc] = SEO.fellowsApply;
  const F = await getFellowsPage();
  return (
    <>
      <JsonLd
        data={pageGraph("/fellows/apply", title, desc, [
          { name: "College of Fellows & Distinctions", path: "/fellows" },
          { name: "Apply or Nominate", path: "/fellows/apply" },
        ])}
      />
      <PageHero
        crumbs={[{ label: "College of Fellows & Distinctions", href: "/fellows" }, { label: "Apply or Nominate" }]}
        title={nomination ? "Nominate a Distinguished Leader" : "Apply for Recognition"}
        lede="Apply for, or nominate a distinguished individual for, an ACCPHE Council Fellowship, Professional Certification or Distinguished Council Recognition."
      />
      <div className="wrap flex flex-wrap items-start" style={{ paddingTop: "clamp(48px,6vw,80px)", paddingBottom: "clamp(72px,9vw,112px)", gap: "clamp(40px,6vw,88px)" }}>
        <aside className="flex flex-[1_1_260px] flex-col gap-[18px]">
          <span className="caps">How it works</span>
          <ol className="m-0 flex list-none flex-col gap-[18px] p-0">
            {F.steps.map((s, i) => (
              <li key={s.t} className="grid grid-cols-[34px_1fr] gap-2" style={{ font: "400 14.5px/1.5 var(--font-sans)" }}>
                <span style={{ font: "500 15px/1.5 var(--font-serif)", color: "var(--color-steel)" }}>{String(i + 1).padStart(2, "0")}</span>
                <span>{s.t}</span>
              </li>
            ))}
          </ol>
          <p className="m-0 mt-1.5 border-t border-line pt-[18px] text-muted" style={{ font: "400 14px/1.6 var(--font-sans)" }}>
            Recognition is not automatic, and payment of an application or assessment fee does not guarantee approval.
          </p>
          <Link href="/fellows#f-distinctions" className="link-arrow">
            Compare the distinctions
          </Link>
          <Link href="/directory/fellows" className="link-arrow">
            College of Fellows Directory
          </Link>
        </aside>
        <div className="min-w-0 max-w-[820px] flex-[999_1_560px]">
          <FellowApplicationForm key={nomination ? "n" : "a"} maxLabel={MAX_UPLOAD_LABEL} initialRoute={nomination ? "Nomination" : "Application"} initialDistinction={sought} />
        </div>
      </div>
    </>
  );
}
