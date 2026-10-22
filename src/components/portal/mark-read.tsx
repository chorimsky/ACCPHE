"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { setMessageRead } from "@/server/actions/messages";

/** Marks a message read once it has actually been opened in the browser (not on link prefetch). */
export function MarkRead({ id }: { id: string }) {
  const router = useRouter();
  useEffect(() => {
    void setMessageRead(id, true).then((r) => r.ok && router.refresh());
  }, [id, router]);
  return null;
}
