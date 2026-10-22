"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { I18N, type Chrome, type Lang } from "@/content/site";

/**
 * Site chrome state: the visitor's navigation language (stored on the device) and the search dialog.
 * Only navigation and interface labels are translated; official texts are published in English.
 */
type Ctx = { lang: Lang; t: Chrome; setLang: (l: Lang) => void; searchOpen: boolean; openSearch: () => void; closeSearch: () => void };

const ChromeContext = createContext<Ctx | null>(null);

const LANG_KEY = "accphe-lang";

export function ChromeProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY) as Lang | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read the stored preference after hydration
      if (saved && saved in I18N && saved !== "en") setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {}
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      const editable = /INPUT|TEXTAREA|SELECT/.test(tag) || (e.target as HTMLElement | null)?.isContentEditable;
      if ((e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) && !editable) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ lang, t: I18N[lang], setLang, searchOpen, openSearch: () => setSearchOpen(true), closeSearch: () => setSearchOpen(false) }),
    [lang, setLang, searchOpen],
  );
  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>;
}

export function useChrome(): Ctx {
  const c = useContext(ChromeContext);
  if (!c) throw new Error("useChrome must be used inside ChromeProvider");
  return c;
}

/** A translated interface label, for use inside server components. */
export function T({ k }: { k: Exclude<keyof Chrome, "nav" | "foot"> }) {
  return <>{useChrome().t[k]}</>;
}
