import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DirectorySwitch, Eyebrow, PageHero } from "@/components/site/blocks";
import { DirectoryFilters } from "@/components/site/directory-filters";
import { JsonLd } from "@/components/seo/json-ld";
import { SEO } from "@/content/site";
import { distinction, DISTINCTION_GROUPS } from "@/lib/domain";
import { fmtDate, plural } from "@/lib/format";
import { pageGraph, seoFor } from "@/lib/seo";
import { fellowByVerification, publicFellows } from "@/server/queries/public";

const GROUPS: { key: string; label: string; group?: (typeof DISTINCTION_GROUPS)[number] }[] = [
  { key: "", label: "All" },
  { key: "fellowship", label: "Council Fellowship", group: "Council Fellowship" },
  { key: "certification", label: "Professional Certification", group: "Professional Certification" },
  { key: "recognition", label: "Distinguished Recognition", group: "Distinguished Council Recognition" },
];

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const base = seoFor("fellowsDirectory", "/directory/fellows");
  return Object.keys(sp).length ? { ...base, robots: { index: false, follow: true } } : base;
}

export default async function FellowsDirectoryPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = one("q").slice(0, 100);
  const country = one("country");
  const cat = GROUPS.find((c) => c.key === one("cls")) ?? GROUPS[0];

  // A verification number goes straight to its entry.
  const exact = q ? await fellowByVerification(q) : null;
  if (exact) redirect(`/directory/fellows/${exact.slug}`);

  const all = await publicFellows();
  const countries = [...new Set(all.map((r) => r.country))].sort((a, b) => a.localeCompare(b));
  const needle = q.trim().toLowerCase();
  const rows = all.filter(
    (r) =>
      (!needle || `${r.honorific} ${r.name} ${r.affiliation} ${r.country} ${r.designation} ${distinction(r.designation)?.t ?? ""} ${r.verification}`.toLowerCase().includes(needle)) &&
      (!country || r.country === country) &&
      (!cat.group || distinction(r.designation)?.group === cat.group),
  );
  const [title, desc] = SEO.fellowsDirectory;
  const href = (key: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (country) p.set("country", country);
    if (key) p.set("cls", key);
    const s = p.toString();
    return s ? `/directory/fellows?${s}` : "/directory/fellows";
  };
  const looksLikeCode = /^ACCPHE-F-/i.test(q.trim());

  return (
    <>
      <JsonLd data={pageGraph("/directory/fellows", title, desc, [{ name: "Member Institutions", path: "/directory" }, { name: "College of Fellows", path: "/directory/fellows" }])} />
      <PageHero
        crumbs={[{ label: "Member Institutions", href: "/directory" }, { label: "College of Fellows" }]}
        title="College of Fellows Directory"
        lede="The credential verification register of the ACCPHE International College of Fellows & Professional Distinctions: recipients of Council fellowships, professional certification and distinguished recognitions, with their verification numbers and current status."
      />
      <section className="bg-white">
        <div className="wrap flex flex-col gap-6" style={{ paddingTop: "clamp(40px,5vw,56px)", paddingBottom: "clamp(72px,9vw,104px)" }}>
          <DirectorySwitch current="fellows" />
          <DirectoryFilters q={q} country={country} cls={cat.key} countries={countries} label="Search by name, institution, distinction, or verification number" placeholder="e.g. ACCPHE-F-2026-0001" />
          <nav aria-label="Type of distinction" className="flex flex-wrap border-b border-line">
            {GROUPS.map((c) => {
              const on = c.key === cat.key;
              return (
                <Link
                  key={c.key}
                  href={href(c.key)}
                  scroll={false}
                  aria-current={on ? "page" : undefined}
                  className="relative px-[18px] pb-4 pt-3.5 text-navy no-underline transition-colors hover:text-slate"
                  style={{ font: "600 14.5px var(--font-sans)" }}
                >
                  {c.label}
                  {on && <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-navy" />}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-wrap justify-between gap-3 text-muted" style={{ font: "400 14px var(--font-sans)" }}>
            <span role="status" className="font-semibold text-navy">
              {plural(rows.length, "entry", "entries")}
            </span>
            <span>The College’s distinctions are not academic degrees, professional licenses, or institutional accreditation.</span>
          </div>
          <div className="table-wrap">
            <table className="data-table min-w-[820px]">
              <caption className="sr-only">Recipients in the ACCPHE College of Fellows Directory</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Distinction</th>
                  <th scope="col">Institution / country</th>
                  <th scope="col">Conferred</th>
                  <th scope="col">Verification no.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const d = distinction(r.designation);
                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="flex flex-col gap-1">
                          <Link href={`/directory/fellows/${r.slug}`} className="text-navy no-underline hover:underline" style={{ font: "600 16.5px/1.35 var(--font-serif)" }}>
                            {[r.honorific, r.name].filter(Boolean).join(" ")}
                          </Link>
                          {r.position && (
                            <span className="text-muted" style={{ font: "400 13px var(--font-sans)" }}>
                              {r.position}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="inline-block whitespace-nowrap border border-steel px-2.5 py-[5px] text-navy" style={{ font: "700 12.5px var(--font-sans)", letterSpacing: ".04em" }}>
                          {r.designation}
                        </span>
                        <span className="mt-1.5 block" style={{ font: "400 13px/1.4 var(--font-sans)" }}>
                          {d?.t}
                        </span>
                        {r.status !== "Published" && (
                          <span className="mt-2 block text-bad" style={{ font: "700 11px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                            Status: {r.status}
                          </span>
                        )}
                      </td>
                      <td>
                        {r.affiliation || "—"}
                        <span className="block text-muted" style={{ font: "400 13px var(--font-sans)" }}>
                          {r.country}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        {fmtDate(r.effective)}
                        {r.review && (
                          <span className="block text-muted" style={{ font: "400 13px var(--font-sans)" }}>
                            Renewal {fmtDate(r.review)}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap" style={{ font: "600 13.5px var(--font-sans)", letterSpacing: ".02em" }}>
                        {r.verification}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!rows.length && (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span style={{ font: "500 22px/1.3 var(--font-serif)", color: "var(--color-navy)" }}>
                  {looksLikeCode ? "No register entry has this verification number" : all.length ? "No entries match your search" : "No distinctions have been conferred yet"}
                </span>
                <span className="max-w-[560px] text-muted" style={{ font: "400 15px/1.62 var(--font-sans)" }}>
                  If someone uses an ACCPHE fellowship, certification or distinction and does not appear here, contact the Secretariat to verify it.
                </span>
                <div className="pt-2">
                  <Link href="/contact?topic=verification" className="link-arrow">
                    Request verification
                  </Link>
                </div>
              </div>
            )}
          </div>
          <div className="mt-8 grid gap-8" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))" }}>
            <div className="flex flex-col gap-2 border-t-2 border-navy pt-5">
              <span style={{ font: "600 18px var(--font-serif)", color: "var(--color-navy)" }}>Council Fellowship</span>
              <span style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>FACCPHE, SFACCPHE, DFACCPHE and FCLM: selective fellowships recognizing professional excellence and sustained contribution.</span>
            </div>
            <div className="flex flex-col gap-2 border-t-2 border-navy pt-5">
              <span style={{ font: "600 18px var(--font-serif)", color: "var(--color-navy)" }}>Professional Certification</span>
              <span style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>CCHEP: competence demonstrated through formal assessment. Certifications show a renewal date.</span>
            </div>
            <div className="flex flex-col gap-2 border-t-2 border-navy pt-5">
              <span style={{ font: "600 18px var(--font-serif)", color: "var(--color-navy)" }}>Verification numbers</span>
              <span style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>Each recipient has a unique number (ACCPHE-F-YYYY-NNNN). Enter it above to open the official entry.</span>
            </div>
          </div>
        </div>
      </section>
      <section className="tint border-t border-line">
        <div className="wrap flex flex-wrap items-center justify-between gap-6" style={{ paddingTop: "clamp(48px,6vw,72px)", paddingBottom: "clamp(48px,6vw,72px)" }}>
          <div className="flex flex-[1_1_420px] flex-col gap-3">
            <Eyebrow>College of Fellows & Distinctions</Eyebrow>
            <p className="m-0" style={{ font: "400 16px/1.65 var(--font-sans)" }}>
              The College recognizes scholars, educators and Christian leaders through fellowships, professional certification and distinguished recognitions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/fellows" className="btn btn-outline">
              About the College
            </Link>
            <Link href="/fellows/apply" className="btn btn-primary">
              Apply or nominate
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
