import Link from "next/link";
import type { AppKind } from "@/db/schema";
import { MODULES, trackOf, type ModuleKey } from "@/lib/domain";

/** White header bar at the top of each module: title, subtitle and module actions. */
export function ModuleHeader({ mod, title, sub, children }: { mod?: ModuleKey; title?: string; sub?: string; children?: React.ReactNode }) {
  const m = mod ? MODULES[mod] : undefined;
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-white px-[clamp(18px,3vw,36px)] py-5">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-navy" style={{ font: "500 26px/1.15 var(--font-serif)" }}>
          {title ?? m?.title}
        </h1>
        <span className="text-muted" style={{ font: "400 13.5px var(--font-sans)" }}>
          {sub ?? m?.sub}
        </span>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </header>
  );
}

/** Main content column below the header. */
export function ModuleBody({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full max-w-[1400px] flex-col gap-6 px-[clamp(18px,3vw,36px)] pb-12 pt-[clamp(18px,3vw,32px)]">{children}</div>;
}

export function Back({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="p-back">
      ← {children}
    </Link>
  );
}

export function Card({ children, className = "", as: As = "section", ...rest }: { children: React.ReactNode; className?: string; as?: "section" | "div" | "aside" | "article" } & React.HTMLAttributes<HTMLElement>) {
  return (
    <As className={`p-card flex flex-col ${className}`} {...rest}>
      {children}
    </As>
  );
}

export function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-note">
      <span aria-hidden="true" className="info-dot">
        i
      </span>
      <span>{children}</span>
    </div>
  );
}

export type PillTone = "navy" | "soft" | "outline" | "warn" | "bad" | "good";
export function Pill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

/** Horizontal stage tracker (applications and cases). */
export function Stepper({ steps, current, done }: { steps: readonly string[]; current: number; done?: boolean }) {
  return (
    <ol className="m-0 flex list-none overflow-x-auto p-0 pt-1" aria-label="Progress">
      {steps.map((label, i) => {
        const isDone = done || i < current;
        const isCurrent = !done && i === current;
        return (
          <li key={label} className="relative flex flex-[1_0_96px] flex-col items-center gap-2 px-1 text-center" aria-current={isCurrent ? "step" : undefined}>
            <span aria-hidden="true" className="absolute left-0 right-0 top-[13px] h-0.5" style={{ background: isDone ? "var(--color-navy)" : "var(--color-line)" }} />
            {isDone ? (
              <span className="relative grid h-7 w-7 place-items-center rounded-full bg-navy text-mist" style={{ font: "700 12px var(--font-sans)" }}>
                ✓
              </span>
            ) : isCurrent ? (
              <span className="relative grid h-7 w-7 place-items-center rounded-full border-2 border-navy bg-white text-navy" style={{ font: "700 12px var(--font-sans)", boxShadow: "0 0 0 4px rgba(69,98,124,.16)" }}>
                {i + 1}
              </span>
            ) : (
              <span className="relative grid h-7 w-7 place-items-center rounded-full bg-white text-placeholder" style={{ border: "1.5px solid var(--color-line-strong)", font: "600 12px var(--font-sans)" }}>
                {i + 1}
              </span>
            )}
            <span style={{ font: `${isCurrent ? 700 : isDone ? 500 : 400} 12px/1.35 var(--font-sans)`, color: isDone || isCurrent ? "var(--color-navy)" : "var(--color-placeholder)" }}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Underlined tabs with counts that link to filtered views. */
export function Tabs({ items }: { items: { href: string; label: string; n?: number; on: boolean }[] }) {
  return (
    <nav className="p-tabs" aria-label="Filter">
      {items.map((t) => (
        <Link key={t.href} href={t.href} scroll={false} className="p-tab" aria-current={t.on ? "page" : undefined}>
          {t.label}
          {t.n !== undefined && <span className="count">{t.n}</span>}
        </Link>
      ))}
    </nav>
  );
}

/** Segmented switch between record types (e.g. Institutions | Programs). */
export function KindSwitch({ label, items }: { label: string; items: { href: string; label: string; n?: number; on: boolean }[] }) {
  return (
    <nav aria-label={label} className="inline-flex self-start rounded-[3px] border border-line bg-white p-1">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.on ? "page" : undefined}
          className={`rounded-[2px] px-4 py-2 no-underline ${t.on ? "bg-navy text-white" : "text-navy hover:bg-mist"}`}
          style={{ font: "600 13.5px var(--font-sans)" }}
        >
          {t.label}
          {t.n !== undefined && <span className={`ml-2 ${t.on ? "text-fog" : "text-muted"}`}>{t.n}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function Bars({ rows }: { rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="flex flex-col">
      {rows.map(([k, n]) => (
        <div key={k} className="grid grid-cols-[minmax(120px,1fr)_2fr_32px] items-center gap-3 py-1.5">
          <span className="text-navy" style={{ font: "500 13.5px var(--font-sans)" }}>
            {k}
          </span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${(n / max) * 100}%` }} />
          </span>
          <span className="text-right text-navy" style={{ font: "600 13.5px var(--font-sans)" }}>
            {n}
          </span>
        </div>
      ))}
      {!rows.length && <span className="small">No data yet.</span>}
    </div>
  );
}

/** Navy once decided (monitoring), amber at the decision stage. */
export const appPill = (a: { kind: AppKind; stage: number; decision: string }): PillTone => {
  const t = trackOf(a);
  return a.decision === "Declined" ? "bad" : a.stage > t.decisionStage ? "navy" : a.stage === t.decisionStage ? "warn" : "soft";
};
export const recPill = (s: string): PillTone => (s === "Published" ? "navy" : s === "Draft" ? "outline" : s === "Suspended" ? "warn" : "bad");
export const docPill = (s: string): PillTone => (s === "Received" ? "good" : s === "Submitted" ? "warn" : "outline");
export const ratePill = (k: string): PillTone => (k === "met" ? "good" : k === "partial" ? "warn" : k === "not" ? "bad" : "outline");
export const casePill = (stage: number): PillTone => (stage === 4 ? "good" : stage >= 2 ? "warn" : "soft");

export function ContentTabs({ current }: { current: "notices" | "pages" }) {
  return (
    <Tabs
      items={[
        { href: "/portal/content", label: "Notices & contact details", on: current === "notices" },
        { href: "/portal/content/pages", label: "Website pages", on: current === "pages" },
      ]}
    />
  );
}
