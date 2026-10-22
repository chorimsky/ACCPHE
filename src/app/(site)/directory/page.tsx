import Link from "next/link";
import type { Metadata } from "next";
import { Eyebrow, PageHero, StatusMatrix } from "@/components/site/blocks";
import { DirectoryFilters } from "@/components/site/directory-filters";
import { JsonLd } from "@/components/seo/json-ld";
import { SEO } from "@/content/site";
import { getClasses } from "@/server/content";
import { fmtDate, fmtMonth, plural, reviewLine } from "@/lib/format";
import { pageGraph, seoFor } from "@/lib/seo";
import { publicRecords, recentDevelopments } from "@/server/queries/public";
import type { Classification } from "@/db/schema";

const CATS: { key: string; label: string; cls?: Classification }[] = [
  { key: "", label: "All" },
  { key: "associate", label: "Associate Members", cls: "Associate Member" },
  { key: "accredited", label: "Accredited Institutions", cls: "Accredited Institution" },
  { key: "distinguished", label: "Distinguished Members", cls: "Distinguished Member" },
];

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const sp = await searchParams;
  const base = seoFor("directory", "/directory");
  // Filtered views are useful to visitors but should not compete with the main directory page in search results.
  return Object.keys(sp).length ? { ...base, robots: { index: false, follow: true } } : base;
}

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = one("q").slice(0, 100);
  const country = one("country");
  const cat = CATS.find((c) => c.key === one("cls")) ?? CATS[0];

  const [all, developments, CLASSES] = await Promise.all([publicRecords(), recentDevelopments(), getClasses()]);
  const countries = [...new Set(all.map((r) => r.country))].sort((a, b) => a.localeCompare(b));
  const needle = q.trim().toLowerCase();
  const rows = all.filter(
    (r) => (!needle || r.name.toLowerCase().includes(needle) || r.country.toLowerCase().includes(needle)) && (!country || r.country === country) && (!cat.cls || r.cls === cat.cls),
  );
  const [title, desc] = SEO.directory;
  const href = (key: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (country) p.set("country", country);
    if (key) p.set("cls", key);
    const s = p.toString();
    return s ? `/directory?${s}` : "/directory";
  };

  return (
    <>
      <JsonLd data={pageGraph("/directory", title, desc, [{ name: "Member Institutions", path: "/directory" }])} />
      <PageHero
        crumbs={[{ label: "Member Institutions" }]}
        title="Institutional Directory and Status Verification"
        lede="A transparent public record of institutions participating in the Council’s membership and accreditation framework — including classifications, accreditation awards, effective dates, and status changes."
      />
      <section className="bg-white">
        <div className="wrap flex flex-col gap-6" style={{ paddingTop: "clamp(40px,5vw,56px)", paddingBottom: "clamp(72px,9vw,104px)" }}>
          <DirectoryFilters q={q} country={country} cls={cat.key} countries={countries} />
          <nav aria-label="Classification" className="flex flex-wrap border-b border-line">
            {CATS.map((c) => {
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
              {plural(rows.length, "record")}
            </span>
            <span>Records are published only after formal approval and verification.</span>
          </div>
          <div className="table-wrap">
            <table className="data-table min-w-[780px]">
              <caption className="sr-only">Institutions in the ACCPHE directory</caption>
              <thead>
                <tr>
                  <th scope="col">Institution</th>
                  <th scope="col">Country</th>
                  <th scope="col">Classification</th>
                  <th scope="col">Effective date</th>
                  <th scope="col">Review / conditions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex flex-col gap-1">
                        <Link href={`/directory/${r.slug}`} className="text-navy no-underline hover:underline" style={{ font: "600 16.5px var(--font-serif)" }}>
                          {r.name}
                        </Link>
                        <span className="text-good" style={{ font: "600 10.5px var(--font-sans)", letterSpacing: ".12em" }}>
                          ✓ VERIFIED RECORD
                        </span>
                      </div>
                    </td>
                    <td>{r.country}</td>
                    <td>
                      <span className="inline-block whitespace-nowrap border border-steel px-2.5 py-[5px] text-navy" style={{ font: "600 12.5px var(--font-sans)" }}>
                        {r.cls}
                      </span>
                      {r.status !== "Published" && (
                        <span className="mt-2 block text-bad" style={{ font: "700 11px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                          Status: {r.status}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap">{fmtDate(r.effective)}</td>
                    <td>{reviewLine(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span style={{ font: "500 22px/1.3 var(--font-serif)", color: "var(--color-navy)" }}>No published records match your search</span>
                <span className="max-w-[540px] text-muted" style={{ font: "400 15px/1.62 var(--font-sans)" }}>
                  If an institution claims ACCPHE membership or accreditation and does not appear here, please contact the Secretariat to verify its status.
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
            {CLASSES.map((c) => (
              <div key={c.t} className="flex flex-col gap-2 border-t-2 border-navy pt-5">
                <span style={{ font: "600 18px var(--font-serif)", color: "var(--color-navy)" }}>{c.plural}</span>
                <span style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>{c.note}</span>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <StatusMatrix title="How to read a directory record" intro="Every record identifies the institution, its classification, and the effective date. Membership and accreditation are recorded separately." />
          </div>
        </div>
      </section>
      <section aria-labelledby="developments" className="tint border-t border-line">
        <div className="wrap flex flex-wrap" style={{ gap: "40px clamp(40px,6vw,88px)", paddingTop: "clamp(56px,7vw,88px)", paddingBottom: "clamp(64px,8vw,96px)" }}>
          <div className="flex flex-[1_1_320px] flex-col gap-4">
            <Eyebrow>Updated monthly</Eyebrow>
            <h2 id="developments" className="m-0 text-navy" style={{ font: "500 clamp(26px,2.8vw,34px)/1.14 var(--font-serif)", textWrap: "balance" }}>
              Membership developments
            </h2>
            <p className="m-0" style={{ font: "400 15.5px/1.65 var(--font-sans)" }}>
              Institutions newly admitted to membership, institutions awarded accreditation, and other official developments. Each entry identifies the institution, country, status, and effective date.
            </p>
          </div>
          <div className="box flex flex-[2_1_480px] flex-col gap-2.5 self-start p-8">
            {developments.length ? (
              groupByMonth(developments).map(([month, items]) => (
                <div key={month} className="flex flex-col gap-1 border-t border-cloud pt-4 first:border-t-0 first:pt-0">
                  <h3 className="caps m-0 pb-1">{month}</h3>
                  {items.map(({ event: e, record: r }) => (
                    <div key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2">
                      <span className="flex flex-col gap-0.5">
                        <Link href={`/directory/${r.slug}`} className="text-navy no-underline hover:underline" style={{ font: "500 18px/1.35 var(--font-serif)" }}>
                          {r.name}
                        </Link>
                        <span className="text-muted" style={{ font: "400 13.5px var(--font-sans)" }}>
                          {r.country} · {e.status === "Published" ? `${e.cls} — admitted to the directory` : `${e.cls} — ${e.status.toLowerCase()}`}
                        </span>
                      </span>
                      <span className="caps-sm">Effective {fmtDate(e.effective)}</span>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <>
                <span className="caps">{fmtMonth(new Date())}</span>
                <span style={{ font: "500 19px/1.4 var(--font-serif)", color: "var(--color-navy)" }}>No developments have been published for this period.</span>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function groupByMonth<T extends { event: { createdAt: Date } }>(rows: T[]): [string, T[]][] {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = fmtMonth(r.event.createdAt);
    m.set(k, [...(m.get(k) ?? []), r]);
  }
  return [...m.entries()];
}
