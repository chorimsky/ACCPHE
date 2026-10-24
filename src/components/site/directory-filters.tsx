"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Search box and country filter for the directory. Works as a plain GET form without JavaScript; with JavaScript
 * the results update as you type and the address stays shareable.
 */
export function DirectoryFilters({
  q,
  country,
  cls,
  countries,
  label = "Search by institution name",
  placeholder = "Institution name",
}: {
  q: string;
  country: string;
  cls: string;
  countries: string[];
  label?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = (next: { q?: string; country?: string }) => {
    const p = new URLSearchParams();
    const nq = next.q ?? query;
    const nc = next.country ?? country;
    if (nq.trim()) p.set("q", nq.trim());
    if (nc) p.set("country", nc);
    if (cls) p.set("cls", cls);
    const s = p.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <form
      role="search"
      method="get"
      action={pathname}
      onSubmit={(e) => {
        e.preventDefault();
        push({});
      }}
      className="flex flex-wrap items-end gap-4 border border-line bg-mist p-7"
    >
      {cls && <input type="hidden" name="cls" value={cls} />}
      <label className="field flex-[3_1_300px]">
        {label}
        <input
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (timer.current) clearTimeout(timer.current);
            const v = e.target.value;
            timer.current = setTimeout(() => push({ q: v }), 250);
          }}
          placeholder={placeholder}
          className="input"
          autoComplete="off"
        />
      </label>
      <label className="field flex-[1_1_220px]">
        Country
        <select name="country" value={country} onChange={(e) => push({ country: e.target.value })} className="select">
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <noscript>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </noscript>
    </form>
  );
}
