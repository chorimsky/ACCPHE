"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lockup } from "@/components/brand/mark";
import { useChrome } from "./chrome";

const COLS = [
  [
    { label: "About Us", href: "/about" },
    { label: "Governance", href: "/governance" },
    { label: "News & Insights", href: "/news" },
    { label: "Contact", href: "/contact" },
  ],
  [
    { label: "Accreditation Process", href: "/accreditation" },
    { label: "Standards & Policies", href: "/standards" },
    { label: "Apply for Accreditation", href: "/apply" },
    { label: "Member Institutions", href: "/directory" },
  ],
  [
    { label: "Verify an Institution", href: "/directory" },
    { label: "Code of Ethics", href: "/standards#s-ethics" },
    { label: "Complaints & Appeals", href: "/standards#s-appeals" },
    { label: "Accreditation FAQ", href: "/accreditation#c-faq" },
    { label: "Staff & Institution Portal", href: "/portal/sign-in" },
  ],
];

/** Verify-an-institution search used in the hero and the footer. */
export function VerifyForm({ variant }: { variant: "footer" }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      action="/directory"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/directory?q=${encodeURIComponent(q.trim())}` : "/directory");
      }}
      className="flex flex-[0_1_380px] flex-col gap-2.5"
      data-variant={variant}
    >
      <span className="caps" style={{ color: "var(--color-steel)" }}>
        Verify an institution
      </span>
      <div className="flex">
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Institution name or country"
          aria-label="Institution name or country"
          className="h-[46px] min-w-0 flex-1 rounded-l-[2px] border border-r-0 border-rule bg-navy px-3.5 text-mist outline-none focus:border-steel"
          style={{ font: "400 14.5px var(--font-sans)" }}
        />
        <button type="submit" className="flex h-[46px] items-center rounded-r-[2px] border-0 bg-mist px-[18px] text-navy hover:bg-line" style={{ font: "600 14px var(--font-sans)" }}>
          Search
        </button>
      </div>
    </form>
  );
}

export function SiteFooter() {
  const { t } = useChrome();
  return (
    <footer style={{ background: "var(--color-navy-deep)", color: "var(--color-fog)" }}>
      <div className="wrap flex flex-col gap-11 pb-12" style={{ paddingTop: "clamp(56px,7vw,80px)" }}>
        <div className="flex flex-wrap items-start justify-between gap-10">
          <div className="flex max-w-[460px] flex-[1_1_360px] flex-col gap-[18px]">
            <Lockup tone="light" size={48} />
            <span style={{ font: "400 14.5px/1.62 var(--font-sans)" }}>
              Accreditation &amp; Compliance Council for Christian and Private Higher Education. Strengthening institutions. Advancing educational quality.
            </span>
            <div className="pt-1">
              <Link href="/contact" className="btn btn-ghost">
                {t.contactUs}
              </Link>
            </div>
          </div>
          <VerifyForm variant="footer" />
        </div>
        <div className="grid gap-x-8 gap-y-9 border-t pt-10" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,190px),1fr))", borderColor: "var(--color-rule-deep)" }}>
          {COLS.map((links, i) => (
            <nav key={i} aria-label={t.foot[i]} className="flex flex-col gap-[13px]">
              <span className="caps pb-1" style={{ color: "var(--color-steel)" }}>
                {t.foot[i]}
              </span>
              {links.map((l) => (
                <Link key={l.label} href={l.href} className="text-line no-underline hover:text-white hover:underline" style={{ font: "400 14.5px/1.4 var(--font-sans)" }}>
                  {l.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
      </div>
      <div className="wrap">
        <figure className="m-0 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2.5 border-t py-7" style={{ borderColor: "var(--color-rule-deep)" }}>
          <blockquote className="m-0 max-w-[760px] text-line" style={{ font: "italic 400 clamp(17px,1.6vw,20px)/1.5 var(--font-serif)" }}>
            “Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding.”
          </blockquote>
          <figcaption className="caps" style={{ color: "var(--color-steel)" }}>
            Proverbs 4:7
          </figcaption>
        </figure>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t pb-8 pt-6" style={{ borderColor: "var(--color-rule-deep)", font: "400 13px var(--font-sans)", color: "var(--color-steel)" }}>
          <span>© {new Date().getFullYear()} ACCPHE. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-[22px]">
            <Link href="/privacy" className="text-haze no-underline hover:text-white">
              Privacy
            </Link>
            <Link href="/accessibility" className="text-haze no-underline hover:text-white">
              Accessibility
            </Link>
            <Link href="/terms" className="text-haze no-underline hover:text-white">
              Terms of use
            </Link>
            <a href="#top" className="border border-rule px-3 py-[7px] text-line no-underline hover:border-steel hover:text-line">
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
