import Link from "next/link";
import { Ornament } from "@/components/brand/mark";

export type Crumb = { label: string; href?: string };

/** Dark page hero with breadcrumb, title and lede (all inner pages). */
export function PageHero({ crumbs, title, lede, children }: { crumbs: Crumb[]; title: string; lede?: string; children?: React.ReactNode }) {
  return (
    <section className="dark relative overflow-hidden">
      <Ornament size={620} className="hidden md:block" style={{ right: -210, top: "50%", transform: "translateY(-50%)" }} />
      <div className="wrap relative flex flex-col gap-[22px]" style={{ paddingTop: "clamp(56px,7vw,88px)", paddingBottom: "clamp(56px,7vw,80px)" }}>
        <Breadcrumbs crumbs={crumbs} />
        <h1 className="h1-page">{title}</h1>
        {lede && <p className="lede-dark">{lede}</p>}
        {children}
      </div>
    </section>
  );
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...crumbs];
  return (
    <nav aria-label="Breadcrumb">
      <ol className="m-0 flex list-none flex-wrap items-center gap-2.5 p-0 text-haze" style={{ font: "400 13.5px var(--font-sans)" }}>
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {last || !c.href ? (
                <span aria-current={last ? "page" : undefined} className={last ? "text-mist" : undefined}>
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="text-line no-underline hover:text-line hover:underline">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Eyebrow({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return <div className={dark ? "eyebrow on-dark" : "eyebrow"}>{children}</div>;
}

const MATRIX: [string, string, string, string][] = [
  ["Supported by a formal Council decision", "y", "y", "y"],
  ["Published in the official directory", "y", "y", "y"],
  ["Evaluated against the twelve accreditation standards", "n:Preparatory", "y", "n:Separate designation"],
  ["May be described as accreditation", "n", "y", "n"],
  ["Confers legal authority to award degrees", "n", "n", "n"],
  ["Guarantees recognition of qualifications", "n", "n", "n"],
];

/** "Status at a glance" comparison of the three classifications. */
export function StatusMatrix({ title, intro }: { title: string; intro: string }) {
  return (
    <section aria-labelledby="status-matrix" className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-2.5">
        <Eyebrow>Status at a glance</Eyebrow>
        <h3 id="status-matrix" className="m-0 text-navy" style={{ font: "500 clamp(24px,2.4vw,30px)/1.2 var(--font-serif)", textWrap: "balance" }}>
          {title}
        </h3>
        <p className="m-0 max-w-[680px]" style={{ font: "400 15.5px/1.65 var(--font-sans)" }}>
          {intro}
        </p>
      </div>
      <div className="table-wrap">
        <table className="w-full min-w-[640px] border-collapse" style={{ font: "400 14.5px/1.45 var(--font-sans)" }}>
          <thead>
            <tr className="bg-navy text-left text-mist">
              <th scope="col" className="w-[40%] px-5 py-4 text-haze" style={{ font: "600 12px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                What the status means
              </th>
              {["Associate Member", "Accredited Institution", "Distinguished Member"].map((h) => (
                <th key={h} scope="col" className="px-3.5 py-4" style={{ font: "600 15px var(--font-serif)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX.map(([q, ...cells]) => (
              <tr key={q}>
                <th scope="row" className="border-t border-line px-5 py-[15px] text-left text-navy" style={{ font: "500 14.5px/1.45 var(--font-sans)" }}>
                  {q}
                </th>
                {cells.map((x, i) => {
                  const yes = x[0] === "y";
                  const label = x.includes(":") ? x.split(":")[1] : yes ? "Yes" : "No";
                  return (
                    <td key={i} className="border-l border-t border-l-cloud border-t-line px-3.5 py-[15px]">
                      {yes ? (
                        <span className="inline-flex items-center gap-2 text-navy" style={{ font: "600 14px var(--font-sans)" }}>
                          <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full bg-navy text-mist" style={{ font: "700 11px var(--font-sans)" }}>
                            ✓
                          </span>
                          {label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-muted" style={{ font: "500 14px var(--font-sans)" }}>
                          <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full text-placeholder" style={{ border: "1.5px solid var(--color-line-strong)", font: "600 12px var(--font-sans)" }}>
                            –
                          </span>
                          {label}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Small call-to-action box used in sidebars. */
export function AsideBox({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col gap-2.5 border border-line bg-mist p-[22px]">
      <span style={{ font: "600 16px/1.3 var(--font-serif)", color: "var(--color-navy)" }}>{title}</span>
      <span style={{ font: "400 13.5px/1.55 var(--font-sans)" }}>{text}</span>
      <Link href={href} className="link-arrow">
        {cta}
      </Link>
    </div>
  );
}

/** Switch between the public directories (institutions, approved programs, College of Fellows). */
export function DirectorySwitch({ current }: { current: "institutions" | "programs" | "fellows" }) {
  const items = [
    { key: "institutions", href: "/directory", label: "Institutions" },
    { key: "programs", href: "/directory/programs", label: "Approved programs" },
    { key: "fellows", href: "/directory/fellows", label: "College of Fellows" },
  ] as const;
  return (
    <nav aria-label="Directory" className="inline-flex max-w-full flex-wrap self-start border border-line bg-white p-1">
      {items.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          aria-current={i.key === current ? "page" : undefined}
          className={`px-5 py-2.5 no-underline ${i.key === current ? "bg-navy text-mist" : "text-navy hover:bg-mist"}`}
          style={{ font: "600 14px var(--font-sans)" }}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
