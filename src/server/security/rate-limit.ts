import "server-only";
import { headers } from "next/headers";
import { eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";

/** Database-backed limits (hold across serverless instances); each attempt is counted atomically before the work. */
export async function hit(key: string, max: number, windowMs: number): Promise<{ count: number; limited: boolean }> {
  const now = Date.now();
  const reset = now + windowMs;
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt: new Date(reset) })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} <= ${now} then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} <= ${now} then ${reset} else ${rateLimits.resetAt} end`,
      },
    })
    .returning({ count: rateLimits.count });
  if (Math.random() < 0.01) void db.delete(rateLimits).where(lt(rateLimits.resetAt, new Date(now))).catch(() => {});
  return { count: row.count, limited: row.count > max };
}

export async function clearLimit(key: string) {
  await db.delete(rateLimits).where(eq(rateLimits.key, key));
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Records a hit for `bucket` from the current IP; true when over the limit. */
export async function overIpLimit(bucket: string, max: number, windowMs: number): Promise<boolean> {
  return (await hit(`ip:${bucket}:${await clientIp()}`, max, windowMs)).limited;
}

/** Whether a counter is already over its limit, without recording an attempt. */
export async function isOverLimit(key: string, max: number): Promise<boolean> {
  const [row] = await db.select().from(rateLimits).where(eq(rateLimits.key, key));
  return !!row && row.resetAt.getTime() > Date.now() && row.count >= max;
}
