"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { I18N, type Lang } from "@/content/site";
import { Lockup } from "@/components/brand/mark";
import { NAV, isActive } from "@/lib/nav";
import { useChrome } from "./chrome";

function SearchGlyph() {
  return (
    <span aria-hidden="true" style={{ position: "relative", width: 13, height: 13, display: "inline-block" }}>
      <span style={{ position: "absolute", left: 0, top: 0, width: 9, height: 9, border: "1.8px solid currentColor", borderRadius: "50%" }} />
      <span style={{ position: "absolute", left: 9, top: 9, width: 5, height: 1.8, background: "currentColor", transform: "rotate(45deg)", transformOrigin: "0 0" }} />
    </span>
  );
}

export function TopBar() {
  const { t, lang, setLang } = useChrome();
  const link = "text-mist no-underline hover:text-mist hover:underline";
  return (
    <div className="site-topbar" style={{ background: "var(--color-navy-deep)", color: "var(--color-fog)" }}>
      <div className="wrap-wide flex items-center justify-between gap-x-6 gap-y-2 py-[9px]" style={{ font: "400 12.5px/1.4 var(--font-sans)" }}>
        <span className="hidden lg:inline">{t.tagline}</span>
        <div className="flex w-full items-center justify-between gap-[22px] lg:w-auto lg:justify-end">
          <Link href="/directory" className={`${link} hidden md:inline`}>
            {t.verify}
          </Link>
          <Link href="/apply" className={`${link} hidden md:inline`}>
            {t.apply}
          </Link>
          <Link href="/contact" className={`${link} hidden md:inline`}>
            {t.contactCouncil}
          </Link>
          <Link href="/portal/sign-in" className={`${link} inline-flex items-center gap-1.5`}>
            <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-steel" />
            {t.signin}
          </Link>
          <label className="flex items-center gap-2 text-fog md:border-l md:border-rule md:pl-[18px]">
            <span style={{ font: "600 11px var(--font-sans)", letterSpacing: ".12em", textTransform: "uppercase" }}>{t.language}</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              aria-label="Language"
              className="cursor-pointer appearance-none rounded-[2px] border border-rule bg-transparent py-[3px] pl-2 pr-[22px] text-mist"
              style={{
                font: "600 12px var(--font-sans)",
                backgroundImage: "linear-gradient(45deg,transparent 50%,#A9BBCC 50%),linear-gradient(135deg,#A9BBCC 50%,transparent 50%)",
                backgroundPosition: "calc(100% - 11px) 50%,calc(100% - 7px) 50%",
                backgroundSize: "4px 4px,4px 4px",
                backgroundRepeat: "no-repeat",
              }}
            >
              {(Object.keys(I18N) as Lang[]).map((k) => (
                <option key={k} value={k} style={{ color: "#142B45" }}>
                  {I18N[k].label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { t, openSearch } = useChrome();
  const [menu, setMenu] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the mobile menu after navigation
  useEffect(() => setMenu(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line" style={{ background: "rgba(255,255,255,.97)", backdropFilter: "saturate(1.4) blur(10px)" }}>
      <div className="wrap-wide flex h-20 items-center justify-between gap-4">
        <Link href="/" aria-label="ACCPHE — home" className="flex min-w-0 flex-none items-center no-underline">
          <Lockup
            size={46}
            descriptor="Accreditation & Compliance Council for Christian and Private Higher Education"
            descriptorClass="hidden max-w-[230px] sm:block min-[90rem]:hidden"
          />
        </Link>

        <div className="hidden h-full items-center gap-3 min-[90rem]:flex">
          <nav aria-label="Main" className="flex h-full items-stretch">
            {NAV.map((n, i) => {
              const active = isActive(pathname, n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className="relative flex items-center whitespace-nowrap px-[9px] text-navy no-underline transition-colors hover:text-slate"
                  style={{ font: "500 14px var(--font-sans)" }}
                >
                  {t.nav[i] ?? n.label}
                  {active && <span className="absolute bottom-[-1px] left-[9px] right-[9px] h-[3px] bg-navy" />}
                </Link>
              );
            })}
          </nav>
          <button type="button" onClick={openSearch} aria-label="Search the site" className="flex h-10 w-10 items-center justify-center rounded-[2px] border border-line-strong bg-transparent text-navy hover:border-navy">
            <SearchGlyph />
          </button>
          <Link href="/contact" className="btn btn-primary" style={{ padding: "11px 18px", font: "600 14px var(--font-sans)" }}>
            {t.contactUs}
          </Link>
        </div>

        <div className="flex items-center gap-2 min-[90rem]:hidden">
          <button type="button" onClick={openSearch} className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-[2px] border border-line-strong bg-transparent px-3 text-navy hover:border-navy" style={{ font: "600 13.5px var(--font-sans)" }}>
            <SearchGlyph />
            <span className="hidden sm:inline">{t.search}</span>
            <span className="sr-only sm:hidden">{t.search}</span>
          </button>
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            aria-expanded={menu}
            aria-controls="mobile-nav"
            className="flex h-11 items-center gap-2.5 rounded-[2px] border border-line-strong bg-transparent px-3 text-navy sm:px-4"
            style={{ font: "600 14px var(--font-sans)" }}
          >
            <span aria-hidden="true" className="flex flex-col gap-1">
              <span className="h-[1.5px] w-4 bg-navy" />
              <span className="h-[1.5px] w-4 bg-navy" />
              <span className="h-[1.5px] w-4 bg-navy" />
            </span>
            {menu ? t.close : t.menu}
          </button>
        </div>
      </div>

      {menu && (
        <div id="mobile-nav" className="border-t border-line bg-white min-[90rem]:hidden" style={{ boxShadow: "0 16px 32px rgba(20,43,69,.08)" }}>
          <nav aria-label="Main" className="wrap flex flex-col pb-6 pt-2">
            {NAV.map((n, i) => {
              const active = isActive(pathname, n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className="flex items-center justify-between border-b border-line py-4 text-navy no-underline"
                  style={{ font: "500 17px var(--font-serif)" }}
                >
                  {t.nav[i] ?? n.label}
                  {active && <span className="h-2 w-2 rounded-full bg-navy" />}
                </Link>
              );
            })}
            <div className="flex flex-wrap gap-2.5 pt-5">
              <Link href="/contact" className="btn btn-primary">
                {t.contactUs}
              </Link>
              <Link href="/directory" className="btn btn-outline">
                {t.verify}
              </Link>
              <Link href="/apply" className="btn btn-outline">
                {t.apply}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function LangNote() {
  const { t, lang, setLang } = useChrome();
  if (lang === "en" || !t.langNote) return null;
  return (
    <div role="note" className="border-b border-line bg-cloud">
      <div className="wrap flex flex-wrap items-center justify-between gap-3 py-2.5 text-navy" style={{ font: "500 13.5px/1.5 var(--font-sans)" }}>
        <span>{t.langNote}</span>
        <button type="button" onClick={() => setLang("en")} className="link-plain">
          English
        </button>
      </div>
    </div>
  );
}

export function SkipLink() {
  const { t } = useChrome();
  return (
    <a
      href="#main"
      className="absolute left-[-9999px] top-2 z-[200] border-2 border-navy bg-mist px-4 py-2.5 text-navy focus:left-3"
      style={{ font: "600 14px var(--font-sans)" }}
    >
      {t.skip}
    </a>
  );
}
