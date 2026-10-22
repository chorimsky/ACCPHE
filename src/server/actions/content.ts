"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { contentBlocks, siteContent } from "@/db/schema";
import { BLOCK_BY_KEY } from "@/content/cms";
import { blockSchema } from "@/server/content";
import { DEFAULT_NOTICE } from "@/content/site";
import { attempt, fail, ok, parseForm, zs, type ActionState } from "@/lib/action";
import { audit } from "@/server/audit";
import { authorize, currentUser, officeOf } from "@/server/auth";

const schema = z
  .object({
    bannerOn: zs.bool(),
    bannerText: zs.opt(300),
    notice: zs.opt(1200),
    email: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((v) => v ?? "")
      .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid official email or leave it blank."),
    phone: zs.opt(80),
    address: zs.opt(600),
  })
  .refine((d) => !d.bannerOn || d.bannerText !== "", "Write the banner text, or turn the banner off.");

export async function saveContent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return attempt(async () => {
    const user = await authorize("content");
    const parsed = parseForm(schema, fd);
    if ("error" in parsed) return fail(parsed.error);
    const d = { ...parsed.data, notice: parsed.data.notice || DEFAULT_NOTICE, updatedAt: new Date() };
    await db.insert(siteContent).values({ id: 1, ...d }).onConflictDoUpdate({ target: siteContent.id, set: d });
    await audit({ actorId: user.id, who: officeOf(user), action: "content.update", entityType: "content", entityId: "1", summary: "Site content updated" });
    revalidatePath("/", "layout");
    return ok("Saved — changes are live on the website");
  });
}

/** Development and preview deployments only (DEMO_MODE=1): replace all data with the sample data set. */
export async function resetDemoData(): Promise<ActionState> {
  return attempt(async () => {
    const user = await currentUser();
    if (!user || user.role !== "admin") return fail("Only administrators can restore demonstration data.");
    if (process.env.DEMO_MODE !== "1") return fail("Demonstration data is disabled on this deployment.");
    const { seedDemo } = await import("@/server/demo");
    await seedDemo({ keepUserId: user.id });
    revalidatePath("/", "layout");
    return ok("Demonstration data restored");
  });
}

/* ─────────── Institutional content (CMS) ─────────── */

export async function saveBlock(key: string, value: unknown): Promise<ActionState> {
  return attempt(async () => {
    const user = await authorize("content");
    const def = BLOCK_BY_KEY[key];
    if (!def) return fail("Unknown content section.");
    const parsed = blockSchema(key).safeParse(value);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the highlighted fields.");
    await db
      .insert(contentBlocks)
      .values({ key, value: parsed.data, updatedById: user.id, updatedAt: new Date() })
      .onConflictDoUpdate({ target: contentBlocks.key, set: { value: parsed.data, updatedById: user.id, updatedAt: new Date() } });
    await audit({ actorId: user.id, who: officeOf(user), action: "content.block", entityType: "content", entityId: key, summary: `Website content updated: ${def.group} — ${def.title}` });
    revalidatePath("/", "layout");
    return ok("Saved — changes are live on the website");
  });
}

/** Return a section to the official text (the saved version is discarded). */
export async function resetBlock(key: string): Promise<ActionState> {
  return attempt(async () => {
    const user = await authorize("content");
    const def = BLOCK_BY_KEY[key];
    if (!def) return fail("Unknown content section.");
    await db.delete(contentBlocks).where(eq(contentBlocks.key, key));
    await audit({ actorId: user.id, who: officeOf(user), action: "content.block_reset", entityType: "content", entityId: key, summary: `Website content restored to the official text: ${def.group} — ${def.title}` });
    revalidatePath("/", "layout");
    return ok("Restored to the official text");
  });
}
