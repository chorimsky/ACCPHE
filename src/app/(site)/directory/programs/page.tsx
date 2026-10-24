import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DirectorySwitch, Eyebrow, PageHero } from "@/components/site/blocks";
import { DirectoryFilters } from "@/components/site/directory-filters";
import { JsonLd } from "@/components/seo/json-ld";
import { SEO } from "@/content/site";
import { fmtDate, plural } from "@/lib/format";
import { pageGraph, seoFor } from "@/lib/seo";
import { programByVerification, publicPrograms } from "@/server/queries/public";
import type { ProgramAward } from "@/db/schema";

const AWARDS: { key: string; label: string; award?: ProgramAward }[] = [
  { key: "", label: "All" },
  { key: "accredited", label: "Accredited Programs", award: "Accredited Program" },
  { key: "recognized", label: "Recognized Programs", award: "Recognized Program" },
];

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const base = seoFor("programDirectory", "/directory/programs");
  return Object.keys(sp).length ? { ...base, robots: { index: false, follow: true } } : base;
}

export default async function ProgramDirectoryPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = one("q").slice(0, 100);
  const country = one("country");
  const cat = AWARDS.find((c) => c.key === one("cls")) ?? AWARDS[0];

  // A verification number goes straight to its record.
  const exact = q ? await programByVerification(q) : null;
  if (exact) redirect(`/directory/programs/${exact.slug}`);

  const all = await publicPrograms();
  const countries = [...new Set(all.map((r) => r.country))].sort((a, b) => a.localeCompare(b));
  const needle = q.trim().toLowerCase();
  const rows = all.filter(
    (r) =>
      (!needle || `${r.title} ${r.provider} ${r.country} ${r.category} ${r.verification}`.toLowerCase().includes(needle)) &&
      (!country || r.country === country) &&
      (!cat.award || r.award === cat.award),
  );
  const [title, desc] = SEO.programDirectory;
  const href = (key: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (country) p.set("country", country);
    if (key) p.set("cls", key);
    const s = p.toString();
    return s ? `/directory/programs?${s}` : "/directory/programs";
  };
  const looksLikeCode = /^ACCPHE-P-/i.test(q.trim());

  return (
    <>
      <JsonLd data={pageGraph("/directory/programs", title, desc, [{ name: "Member Institutions", path: "/directory" }, { name: "Approved Programs", path: "/directory/programs" }])} />
      <PageHero
        crumbs={[{ label: "Member Institutions", href: "/directory" }, { label: "Approved Programs" }]}
        title="Directory of Approved Programs"
        lede="Programs that have received ACCPHE program-level accreditation or recognition, with their approved title, provider, scope, validity period, and unique verification number."
      />
      <section className="bg-white">
        <div className="wrap flex flex-col gap-6" style={{ paddingTop: "clamp(40px,5vw,56px)", paddingBottom: "clamp(72px,9vw,104px)" }}>
          <DirectorySwitch current="programs" />
          <DirectoryFilters q={q} country={country} cls={cat.key} countries={countries} label="Search by program, provider, or verification number" placeholder="e.g. ACCPHE-P-2026-0001" />
          <nav aria-label="Status awarded" className="flex flex-wrap border-b border-line">
            {AWARDS.map((c) => {
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
              {plural(rows.length, "program")}
            </span>
            <span>Accreditation applies only to the approved program, not to the provider or its other offerings.</span>
          </div>
          <div className="table-wrap">
            <table className="data-table min-w-[820px]">
              <caption className="sr-only">Programs in the ACCPHE directory of approved programs</caption>
              <thead>
                <tr>
                  <th scope="col">Program</th>
                  <th scope="col">Provider</th>
                  <th scope="col">Status</th>
                  <th scope="col">Valid</th>
                  <th scope="col">Verification no.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex flex-col gap-1">
                        <Link href={`/directory/programs/${r.slug}`} className="text-navy no-underline hover:underline" style={{ font: "600 16.5px/1.35 var(--font-serif)" }}>
                          {r.title}
                        </Link>
                        {r.category && (
                          <span className="text-muted" style={{ font: "400 13px var(--font-sans)" }}>
                            {r.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {r.provider}
                      <span className="block text-muted" style={{ font: "400 13px var(--font-sans)" }}>
                        {r.country}
                      </span>
                    </td>
                    <td>
                      <span className="inline-block whitespace-nowrap border border-steel px-2.5 py-[5px] text-navy" style={{ font: "600 12.5px var(--font-sans)" }}>
                        {r.award}
                      </span>
                      {r.status !== "Published" && (
                        <span className="mt-2 block text-bad" style={{ font: "700 11px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                          Status: {r.status}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      {fmtDate(r.effective)} – {fmtDate(r.review)}
                    </td>
                    <td className="whitespace-nowrap" style={{ font: "600 13.5px var(--font-sans)", letterSpacing: ".02em" }}>
                      {r.verification}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span style={{ font: "500 22px/1.3 var(--font-serif)", color: "var(--color-navy)" }}>
                  {looksLikeCode ? "No approved program has this verification number" : all.length ? "No approved programs match your search" : "No programs have been published yet"}
                </span>
                <span className="max-w-[560px] text-muted" style={{ font: "400 15px/1.62 var(--font-sans)" }}>
                  If a provider claims ACCPHE program accreditation or recognition and the program does not appear here, contact the Secretariat to verify its status.
                </span>
                <div className="pt-2">
                  <Link href="/contact?topic=verification" className="link-arrow">
                    Request status verification
                  </Link>
                </div>
              </div>
            )}
          </div>
          <div className="mt-8 grid gap-8" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))" }}>
            <div className="flex flex-col gap-2 border-t-2 border-navy pt-5">
              <span style={{ font: "600 18px var(--font-serif)", color: "var(--color-navy)" }}>Accredited Programs</span>
              <span style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>Programs that satisfied ACCPHE’s program evaluation standards and received formal program-level accreditation.</span>
            </div>
            <div className="flex flex-col gap-2 border-t-2 border-navy pt-5">
              <span style={{ font: "600 18px var(--font-serif)", color: "var(--color-navy)" }}>Recognized Programs</span>
              <span style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>Programs granted formal recognition within the scope of the Council’s independent quality assurance framework.</span>
            </div>
            <div className="flex flex-col gap-2 border-t-2 border-navy pt-5">
              <span style={{ font: "600 18px var(--font-serif)", color: "var(--color-navy)" }}>Verification numbers</span>
              <span style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>Each approved program has a unique number (ACCPHE-P-YYYY-NNNN). Enter it above to open the official record.</span>
            </div>
          </div>
        </div>
      </section>
      <section className="tint border-t border-line">
        <div className="wrap flex flex-wrap items-center justify-between gap-6" style={{ paddingTop: "clamp(48px,6vw,72px)", paddingBottom: "clamp(48px,6vw,72px)" }}>
          <div className="flex flex-[1_1_420px] flex-col gap-3">
            <Eyebrow>Independent Program Accreditation</Eyebrow>
            <p className="m-0" style={{ font: "400 16px/1.65 var(--font-sans)" }}>
              Program accreditation evaluates an individual program against eight standards, without the provider necessarily pursuing full institutional accreditation.
            </p>
          </div>
          <Link href="/accreditation/programs" className="btn btn-outline">
            About program accreditation
          </Link>
        </div>
      </section>
    </>
  );
}
