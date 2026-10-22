"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useChrome } from "./chrome";

const KEY = "accphe-consent";

/** Privacy notice: the site stores only essential preferences, so this is an acknowledgement, not a cookie wall. */
export function ConsentNotice() {
  const { t } = useChrome();
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read the stored acknowledgement after hydration
      if (localStorage.getItem(KEY) !== "1") setShow(true);
    } catch {}
  }, []);
  if (!show) return null;
  const accept = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setShow(false);
  };
  return (
    <div
      role="region"
      aria-label={t.consentTitle}
      className="fixed bottom-4 left-4 right-4 z-[90] ml-auto flex max-w-[560px] flex-col gap-3 border border-line bg-white px-[22px] py-5"
      style={{ boxShadow: "0 18px 44px rgba(6,18,32,.18)" }}
    >
      <span style={{ font: "600 16px var(--font-serif)", color: "var(--color-navy)" }}>{t.consentTitle}</span>
      <span style={{ font: "400 13.5px/1.6 var(--font-sans)" }}>{t.consentText}</span>
      <div className="flex flex-wrap items-center gap-2.5">
        <button type="button" onClick={accept} className="btn btn-primary" style={{ padding: "10px 16px", font: "600 13.5px var(--font-sans)" }}>
          {t.consentOk}
        </button>
        <Link href="/privacy" onClick={accept} className="link-plain" style={{ font: "600 13.5px var(--font-sans)" }}>
          {t.consentMore}
        </Link>
      </div>
    </div>
  );
}
