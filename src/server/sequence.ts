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

/** PRG-2026-0001 (program applications) */
export async function nextProgramRef(year = new Date().getUTCFullYear()) {
  return `PRG-${year}-${String(await nextNumber(`prg:${year}`)).padStart(4, "0")}`;
}

/** ACCPHE-P-2026-0001: public verification number of an approved program */
export async function nextProgramVerification(year = new Date().getUTCFullYear()) {
  return `ACCPHE-P-${year}-${String(await nextNumber(`prgv:${year}`)).padStart(4, "0")}`;
}

/** FEL-2026-0001 (College of Fellows applications and nominations) */
export async function nextFellowRef(year = new Date().getUTCFullYear()) {
  return `FEL-${year}-${String(await nextNumber(`fel:${year}`)).padStart(4, "0")}`;
}

/** ACCPHE-F-2026-0001: public verification number of a College credential or distinction */
export async function nextFellowVerification(year = new Date().getUTCFullYear()) {
  return `ACCPHE-F-${year}-${String(await nextNumber(`felv:${year}`)).padStart(4, "0")}`;
}

/** CMP-2026-001 / APL-2026-001 */
export async function nextCaseRef(type: "Complaint" | "Appeal", year = new Date().getUTCFullYear()) {
  const prefix = type === "Appeal" ? "APL" : "CMP";
  return `${prefix}-${year}-${String(await nextNumber(`${prefix.toLowerCase()}:${year}`)).padStart(3, "0")}`;
}
