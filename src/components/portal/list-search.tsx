"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Search box that filters a server-rendered list through the ?q= parameter. */
export function ListSearch({ placeholder, param = "q", className = "p-input max-w-[440px]" }: { placeholder: string; param?: string; className?: string }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [v, setV] = useState(sp.get(param) ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  return (
    <input
      type="search"
      value={v}
      placeholder={placeholder}
      aria-label={placeholder}
      className={className}
      onChange={(e) => {
        const nv = e.target.value;
        setV(nv);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          const p = new URLSearchParams(sp.toString());
          if (nv.trim()) p.set(param, nv.trim());
          else p.delete(param);
          const s = p.toString();
          router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
        }, 250);
      }}
    />
  );
}
