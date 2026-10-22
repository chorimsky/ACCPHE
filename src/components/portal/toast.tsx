"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Toast = { text: string; error?: boolean } | null;
const ToastContext = createContext<(text: string, error?: boolean) => void>(() => {});

/** Portal notifications. Pages that redirect after an action pass ?toast=… which is shown once and removed. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string, error?: boolean) => {
    setToast({ text, error });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), error ? 6000 : 4000);
  }, []);

  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const fromUrl = params.get("toast");
  useEffect(() => {
    if (!fromUrl) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time message carried in the URL after a redirect
    show(fromUrl);
    const p = new URLSearchParams(params.toString());
    p.delete("toast");
    const s = p.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }, [fromUrl, params, pathname, router, show]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" role="status">
        {toast && <div className={toast.error ? "toast toast-error" : "toast"}>{toast.text}</div>}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
