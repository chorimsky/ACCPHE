import Link from "next/link";
import { Breadcrumbs } from "@/components/site/blocks";
import { JsonLd } from "@/components/seo/json-ld";
import { getPolicy } from "@/server/content";
import { pageGraph } from "@/lib/seo";

type Which = "privacy" | "accessibility" | "terms";

const NAV: [Which, string][] = [
  ["privacy", "Privacy Notice"],
  ["accessibility", "Accessibility Statement"],
  ["terms", "Terms of Use"],
];

export async function PolicyPage({ which }: { which: Which }) {
  const p = await getPolicy(which);
  return (
    <>
      <JsonLd data={pageGraph(`/${which}`, p.title, p.lede, [{ name: p.title, path: `/${which}` }])} />
      <section className="dark">
        <div className="wrap flex flex-col gap-5" style={{ paddingTop: "clamp(48px,6vw,80px)", paddingBottom: "clamp(48px,6vw,72px)" }}>
          <Breadcrumbs crumbs={[{ label: p.title }]} />
          <h1 className="m-0" style={{ font: "500 clamp(36px,4.4vw,54px)/1.1 var(--font-serif)", letterSpacing: "-.01em" }}>
            {p.title}
          </h1>
          <p className="m-0 max-w-[720px] text-fog" style={{ font: "400 clamp(17px,1.5vw,19px)/1.6 var(--font-sans)" }}>
            {p.lede}
          </p>
        </div>
      </section>
      <div className="wrap flex flex-wrap items-start" style={{ paddingTop: "clamp(48px,6vw,72px)", paddingBottom: "clamp(64px,8vw,96px)", gap: "clamp(32px,5vw,72px)" }}>
        <nav aria-label="Policies" className="flex flex-[1_1_220px] flex-col gap-0.5">
          <span className="caps pb-3">Policies</span>
          {NAV.map(([k, label]) => {
            const on = k === which;
            return (
              <Link
                key={k}
                href={`/${k}`}
                aria-current={on ? "page" : undefined}
                className="py-2.5 pl-4 no-underline"
                style={{ borderLeft: `2px solid ${on ? "var(--color-navy)" : "var(--color-line)"}`, font: `${on ? 600 : 500} 14.5px var(--font-sans)`, color: on ? "var(--color-navy)" : "var(--color-muted)" }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex min-w-0 max-w-[760px] flex-[999_1_560px] flex-col">
          {p.sections.map((s) => (
            <section key={s.h} className="flex flex-col gap-2.5 border-t border-line py-7">
              <h2 className="m-0 text-navy" style={{ font: "600 21px/1.3 var(--font-serif)" }}>
                {s.h}
              </h2>
              <p className="m-0" style={{ font: "400 16.5px/1.72 var(--font-sans)", textWrap: "pretty" }}>
                {s.p}
              </p>
            </section>
          ))}
          <p className="m-0 border-t border-line pt-6 text-muted" style={{ font: "400 14px/1.6 var(--font-sans)" }}>
            Questions about this policy may be directed to the Executive Secretariat through the <Link href="/contact">Contact page</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
