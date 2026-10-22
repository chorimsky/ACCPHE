import "server-only";
import { headers } from "next/headers";
import { db } from "@/db";
import { auditLog } from "@/db/schema";

/** Append an entry to the audit log (never updated or deleted). */
export async function audit(entry: { actorId?: string | null; who: string; action: string; entityType: string; entityId?: string | null; summary: string }) {
  let ip: string | null = null;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
  } catch {
    // outside a request (seed / scripts)
  }
  await db.insert(auditLog).values({ ...entry, summary: entry.summary.slice(0, 1000), ip: ip?.slice(0, 64) ?? null });
}
