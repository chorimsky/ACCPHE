"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChrome } from "./chrome";

export type SearchItem = { kind: string; t: string; d: string; href: string };

/** Site search over pages, standards, FAQs, news, governance bodies and values (prototype behaviour). */
export function SearchDialog({ index }: { index: SearchItem[] }) {
  const { searchOpen, closeSearch, t } = useChrome();
  const router = useRouter();
  const [sq, setSq] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!searchOpen) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the dialog each time it opens
    setSq("");
    setCursor(0);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = "";
      lastFocus.current?.focus?.();
    };
  }, [searchOpen]);

  const results = useMemo(() => {
    const q = sq.trim().toLowerCase();
    if (!q) {
      return [index.find((r) => r.href === "/accreditation"), index.find((r) => r.href === "/standards"), index.find((r) => r.href === "/directory"), index.find((r) => r.kind === "Question"), index.find((r) => r.kind === "Standard 1")].filter(
        (x): x is SearchItem => !!x,
      );
    }
    const words = q.split(/\s+/).filter(Boolean);
    return index
      .map((r) => {
        const tt = r.t.toLowerCase();
        const dd = r.d.toLowerCase();
        let sc = 0;
        for (const w of words) {
          if (tt.includes(w)) sc += 3;
          else if (dd.includes(w)) sc += 1;
          else return null;
        }
        return { r, sc };
      })
      .filter((x): x is { r: SearchItem; sc: number } => !!x)
      .sort((a, b) => b.sc - a.sc)
      .slice(0, 10)
      .map((x) => x.r);
  }, [sq, index]);

  if (!searchOpen) return null;

  const go = (href: string) => {
    closeSearch();
    router.push(href);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-[150] flex items-start justify-center px-4 pb-4"
      style={{ background: "rgba(14,34,54,.72)", backdropFilter: "blur(3px)", paddingTop: "clamp(16px,8vh,96px)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeSearch();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") closeSearch();
        else if (e.key === "ArrowDown") {
          e.preventDefault();
          setCursor((c) => Math.min(results.length - 1, c + 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setCursor((c) => Math.max(0, c - 1));
        } else if (e.key === "Enter" && results[cursor] && (e.target as HTMLElement).tagName === "INPUT") {
          e.preventDefault();
          go(results[cursor].href);
        } else if (e.key === "Tab") {
          // keep focus inside the dialog
          const els = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("input,button"));
          const i = els.indexOf(document.activeElement as HTMLElement);
          if (e.shiftKey && i <= 0) {
            e.preventDefault();
            els[els.length - 1]?.focus();
          } else if (!e.shiftKey && i === els.length - 1) {
            e.preventDefault();
            els[0]?.focus();
          }
        }
      }}
    >
      <div className="flex w-full max-w-[760px] flex-col bg-white" style={{ maxHeight: "calc(100vh - 120px)", boxShadow: "0 30px 80px rgba(6,18,32,.4)" }}>
        <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
          <input
            ref={inputRef}
            value={sq}
            onChange={(e) => {
              setSq(e.target.value);
              setCursor(0);
            }}
            placeholder={t.searchPh}
            aria-label="Search"
            aria-controls="search-results"
            className="min-w-0 flex-1 border-0 bg-transparent text-navy outline-none"
            style={{ font: "400 20px var(--font-serif)" }}
          />
          <button type="button" onClick={closeSearch} className="rounded-[2px] border border-line bg-transparent px-2.5 py-1.5 text-slate hover:border-navy hover:text-navy" style={{ font: "600 12.5px var(--font-sans)" }}>
            Esc
          </button>
        </div>
        <div id="search-results" className="overflow-y-auto pb-3 pt-2">
          {!sq.trim() && <div className="caps-sm px-[22px] pb-1.5 pt-3.5">Suggested</div>}
          {results.map((r, i) => (
            <button
              key={`${r.kind}-${r.href}-${r.t}`}
              type="button"
              onClick={() => go(r.href)}
              onMouseEnter={() => setCursor(i)}
              className="flex w-full flex-col gap-1 border-0 border-t border-cloud px-[22px] py-3.5 text-left"
              style={{ background: i === cursor ? "var(--color-mist)" : "transparent" }}
            >
              <span className="flex items-center gap-2.5">
                <span className="border border-line px-[7px] py-0.5 text-slate" style={{ font: "600 10.5px var(--font-sans)", letterSpacing: ".12em", textTransform: "uppercase" }}>
                  {r.kind}
                </span>
                <span style={{ font: "600 16px/1.35 var(--font-serif)", color: "var(--color-navy)" }}>{r.t}</span>
              </span>
              <span className="line-clamp-2 text-muted" style={{ font: "400 13.5px/1.5 var(--font-sans)" }}>
                {r.d}
              </span>
            </button>
          ))}
          {!!sq.trim() && !results.length && (
            <p className="m-0 px-[22px] py-7 text-muted" style={{ font: "400 15px var(--font-sans)" }}>
              No results. Try “eligibility”, “appeals”, or an institution name in the{" "}
              <button type="button" className="link-plain" onClick={() => go(`/directory?q=${encodeURIComponent(sq.trim())}`)}>
                directory
              </button>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function SearchButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const { openSearch } = useChrome();
  return (
    <button type="button" onClick={openSearch} className={className}>
      {children}
    </button>
  );
}
