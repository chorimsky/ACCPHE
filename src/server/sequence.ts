import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { counters } from "@/db/schema";

/** Atomically take the next number of a named sequence. */
export async function nextNumber(name: string): Promise<number> {
  const [row] = await db
    .insert(counters)
    .values({ name, value: 1 })
    .onConflictDoUpdate({ target: counters.name, set: { value: sql`${counters.value} + 1` } })
    .returning({ value: counters.value });
  return row.value;
}

/** ACC-2026-0001 */
export async function nextApplicationRef(year = new Date().getUTCFullYear()) {
  return `ACC-${year}-${String(await nextNumber(`acc:${year}`)).padStart(4, "0")}`;
}

/** CMP-2026-001 / APL-2026-001 */
export async function nextCaseRef(type: "Complaint" | "Appeal", year = new Date().getUTCFullYear()) {
  const prefix = type === "Appeal" ? "APL" : "CMP";
  return `${prefix}-${year}-${String(await nextNumber(`${prefix.toLowerCase()}:${year}`)).padStart(3, "0")}`;
}
