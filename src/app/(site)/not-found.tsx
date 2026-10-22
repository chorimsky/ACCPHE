import Link from "next/link";
import type { Metadata } from "next";
import { SearchButton } from "@/components/site/search";
import { NAV } from "@/lib/nav";
import { SEO } from "@/content/site";

export const metadata: Metadata = { title: { absolute: SEO.notfound[0] }, description: SEO.notfound[1], robots: { index: false } };

export default function NotFound() {
  return (
    <section className="bg-white">
      <div className="mx-auto flex max-w-[880px] flex-col items-start gap-[22px]" style={{ padding: "clamp(72px,10vw,128px) clamp(20px,4vw,40px)" }}>
        <span className="eyebrow">Error 404</span>
        <h1 className="m-0 text-navy" style={{ font: "500 clamp(36px,4.4vw,54px)/1.1 var(--font-serif)" }}>
          This page could not be found
        </h1>
        <p className="m-0 max-w-[620px]" style={{ font: "400 18px/1.65 var(--font-sans)" }}>
          The address may be mistyped, or the page may have moved. You can search the site or continue from one of the sections below.
        </p>
        <div className="flex flex-wrap gap-3">
          <SearchButton className="btn btn-primary">Search the site</SearchButton>
          <Link href="/" className="btn btn-outline">
            Go to the homepage
          </Link>
        </div>
        <ul className="hairline-grid mt-6 w-full" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))" }}>
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="block px-5 py-[18px] text-navy no-underline hover:bg-mist" style={{ font: "600 15px var(--font-serif)" }}>
                {n.label} →
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
