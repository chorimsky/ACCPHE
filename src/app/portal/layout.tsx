import type { Metadata } from "next";
import { Suspense } from "react";
import { ToastProvider } from "@/components/portal/toast";

export const metadata: Metadata = {
  title: { default: "ACCPHE Portal", template: "%s · ACCPHE Portal" },
  robots: { index: false, follow: false },
};

export default function PortalRoot({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-portal">
      <Suspense>
        <ToastProvider>{children}</ToastProvider>
      </Suspense>
    </div>
  );
}
