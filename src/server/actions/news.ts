"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ARTICLE_CATEGORIES, articles } from "@/db/schema";
import { attempt, fail, ok, parseForm, zs, type ActionResult, type ActionState } from "@/lib/action";
import { slugify } from "@/lib/site";
import { audit } from "@/server/audit";
import { authorize, officeOf } from "@/server/auth";

const refresh = () => {
  revalidatePath("/portal", "layout");
  revalidatePath("/", "layout");
};

const schema = z.object({
  id: z.string().optional(),
  title: zs.text("Title", 200),
  category: z.enum(ARTICLE_CATEGORIES),
  date: zs.date().refine((v) => v !== "", "Enter a publication date."),
  excerpt: zs.text("Summary", 600),
  body: zs.opt(60_000),
  slug: zs.opt(100),
  intent: z.enum(["draft", "publish"]),
});

async function uniqueSlug(base: string, exceptId?: string) {
  for (let i = 1; i < 200; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const [hit] = await db.select({ id: articles.id }).from(articles).where(eq(articles.slug, slug));
    if (!hit || hit.id === exceptId) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function saveArticle(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const res = await attempt(async () => {
    const user = await authorize("news");
    const parsed = parseForm(schema, fd);
    if ("error" in parsed) return fail(parsed.error);
    const d = parsed.data;
    const status = d.intent === "publish" ? "Published" : "Draft";
    const existing = d.id ? (await db.select().from(articles).where(eq(articles.id, d.id)))[0] : undefined;
    if (d.id && !existing) return fail("This article no longer exists.");
    // The address is fixed once an article has been published, so shared links keep working.
    const slug = existing?.status === "Published" || (existing && !d.slug) ? existing.slug : await uniqueSlug(slugify(d.slug || d.title), existing?.id);
    const values = { title: d.title, category: d.category, date: d.date, excerpt: d.excerpt, body: d.body, status: status as "Draft" | "Published", slug, updatedAt: new Date() };
    let id = existing?.id;
    if (existing) await db.update(articles).set(values).where(eq(articles.id, existing.id));
    else id = (await db.insert(articles).values(values).returning({ id: articles.id }))[0].id;
    await audit({
      actorId: user.id,
      who: officeOf(user),
      action: status === "Published" ? "article.publish" : "article.save",
      entityType: "article",
      entityId: id,
      summary: `${status === "Published" ? "Article published" : "Article saved as draft"}: ${d.title}`,
    });
    return ok(status === "Published" ? "Published to News & Insights" : "Draft saved");
  });
  if (res.ok) {
    refresh();
    redirect(`/portal/news?toast=${encodeURIComponent(res.message ?? "Saved")}`);
  }
  return res;
}

export async function toggleArticle(id: string): Promise<ActionResult> {
  return attempt(async () => {
    const user = await authorize("news");
    const [a] = await db.select().from(articles).where(eq(articles.id, id));
    if (!a) return fail("This article no longer exists.");
    const ns = a.status === "Published" ? "Draft" : "Published";
    await db.update(articles).set({ status: ns, updatedAt: new Date() }).where(eq(articles.id, id));
    await audit({ actorId: user.id, who: officeOf(user), action: ns === "Published" ? "article.publish" : "article.unpublish", entityType: "article", entityId: id, summary: `${ns === "Published" ? "Article published" : "Article unpublished"}: ${a.title}` });
    refresh();
    return ok(ns === "Published" ? "Published to News & Insights" : "Article unpublished");
  });
}

export async function deleteArticle(id: string): Promise<ActionResult> {
  const res = await attempt(async () => {
    const user = await authorize("news");
    const [a] = await db.select().from(articles).where(eq(articles.id, id));
    if (!a) return fail("This article no longer exists.");
    await db.delete(articles).where(eq(articles.id, id));
    await audit({ actorId: user.id, who: officeOf(user), action: "article.delete", entityType: "article", entityId: id, summary: `Article deleted: ${a.title}` });
    return ok("Article deleted");
  });
  if (res.ok) {
    refresh();
    redirect(`/portal/news?toast=${encodeURIComponent("Article deleted")}`);
  }
  return res;
}
