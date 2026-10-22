"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mark } from "@/components/brand/mark";
import { signOut } from "@/server/actions/auth";

export type NavItem = { href: string; label: string; count: number };

const isOn = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

function SignOutButton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <form action={signOut}>
      <button type="submit" className={className} style={style}>
        Sign out
      </button>
    </form>
  );
}

/** Dark module sidebar (wide screens) and top bar with scrolling module tabs (narrow screens). */
export function PortalNav({ items, who, roleLabel, initials }: { items: NavItem[]; who: string; roleLabel: string; initials: string }) {
  const pathname = usePathname();
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 flex-none flex-col bg-navy text-line min-[940px]:flex">
        <div className="flex items-center gap-3 border-b border-rule-deep px-[22px] pb-5 pt-[22px]">
          <Mark size={40} tone="light" />
          <div className="flex flex-col gap-[3px]">
            <span style={{ font: "600 17px/1 var(--font-serif)", color: "var(--color-mist)", letterSpacing: ".08em" }}>ACCPHE</span>
            <span className="text-haze" style={{ font: "500 11px var(--font-sans)" }}>
              Portal
            </span>
          </div>
        </div>
        <nav aria-label="Modules" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
          {items.map((n) => {
            const on = isOn(pathname, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? "page" : undefined}
                className="flex items-center justify-between gap-2 rounded-[3px] px-3 py-2.5 no-underline"
                style={on ? { background: "var(--color-mist)", color: "var(--color-navy)", font: "600 14px var(--font-sans)" } : { color: "var(--color-line)", font: "500 14px var(--font-sans)" }}
              >
                <span>{n.label}</span>
                {n.count > 0 && (
                  <span className="rounded-full px-[7px] py-0.5" style={{ font: "700 11px var(--font-sans)", background: on ? "var(--color-navy)" : "var(--color-rule)", color: "var(--color-mist)" }}>
                    {n.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-3 border-t border-rule-deep px-4 pb-[18px] pt-3.5">
          <div className="flex justify-between gap-2" style={{ font: "500 13px var(--font-sans)" }}>
            <Link href="/portal/account" className="text-fog no-underline hover:text-white" aria-current={isOn(pathname, "/portal/account") ? "page" : undefined}>
              Account settings
            </Link>
            <a href="/" target="_blank" rel="noopener" className="text-fog no-underline hover:text-white">
              Public website ↗
            </a>
          </div>
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full bg-rule text-mist" style={{ font: "600 12.5px var(--font-sans)" }}>
              {initials}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-mist" style={{ font: "600 13px var(--font-sans)" }}>
                {who}
              </span>
              <span className="text-haze" style={{ font: "400 12px var(--font-sans)" }}>
                {roleLabel}
              </span>
            </div>
            <SignOutButton className="rounded-[3px] border border-rule bg-transparent px-2 py-1.5 text-fog hover:border-steel hover:text-white" style={{ font: "600 12px var(--font-sans)" }} />
          </div>
        </div>
      </aside>

      <div className="bg-navy text-mist min-[940px]:hidden">
        <div className="flex items-center justify-between gap-3 px-[18px] py-3.5">
          <div className="flex items-center gap-2.5">
            <Mark size={34} tone="light" />
            <span style={{ font: "600 16px var(--font-serif)", letterSpacing: ".08em" }}>ACCPHE</span>
          </div>
          <div className="flex gap-2">
            <Link href="/portal/account" className="rounded-[3px] border border-rule px-2.5 py-[7px] text-mist no-underline" style={{ font: "600 12.5px var(--font-sans)" }}>
              Account
            </Link>
            <SignOutButton className="rounded-[3px] border border-rule bg-transparent px-2.5 py-[7px] text-mist" style={{ font: "600 12.5px var(--font-sans)" }} />
          </div>
        </div>
        <nav aria-label="Modules" className="flex gap-1 overflow-x-auto px-3 pb-3" style={{ scrollbarWidth: "none" }}>
          {items.map((n) => {
            const on = isOn(pathname, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? "page" : undefined}
                className="whitespace-nowrap rounded-[3px] px-3 py-2 no-underline"
                style={on ? { background: "var(--color-mist)", color: "var(--color-navy)", font: "600 13px var(--font-sans)" } : { color: "var(--color-line)", font: "500 13px var(--font-sans)" }}
              >
                {n.label}
                {n.count > 0 ? ` (${n.count})` : ""}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
