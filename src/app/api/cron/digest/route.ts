import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { auditLog, users } from "@/db/schema";
import { canAccess, ROLE_INFO, type ModuleKey } from "@/lib/domain";
import { safeEqual } from "@/lib/crypto";
import { abs } from "@/lib/site";
import { trySendEmail } from "@/server/email";

/** Which module an audit entry belongs to (for filtering each person's digest). */
const MODULE_OF: Record<string, ModuleKey> = {
  application: "applications",
  record: "directory",
  article: "news",
  case: "cases",
  message: "messages",
  content: "content",
  user: "users",
};

/** Weekly Monday summary for staff who opted in ("Weekly summary"). Scheduled in vercel.json. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!secret || !safeEqual(got, secret)) return new Response("Unauthorized", { status: 401 });
  const since = new Date(Date.now() - 7 * 864e5);
  const [entries, people] = await Promise.all([
    db.select().from(auditLog).where(gte(auditLog.createdAt, since)).orderBy(desc(auditLog.createdAt)),
    db.select().from(users).where(and(eq(users.status, "active"), eq(users.notifyDigest, true))),
  ]);
  let sent = 0;
  for (const u of people) {
    if (u.role === "institution") continue;
    const mine = entries.filter((e) => {
      const m = MODULE_OF[e.entityType];
      return m && canAccess(u.role, m) && e.action !== "document.download" && e.action !== "export" && !e.action.startsWith("auth.");
    });
    if (!mine.length) continue;
    const lines = mine.slice(0, 40).map((e) => `• ${e.who} — ${e.summary}`);
    await trySendEmail(
      u.email,
      `ACCPHE Portal — weekly summary (${mine.length} update${mine.length === 1 ? "" : "s"})`,
      `Hello ${u.name},\n\nActivity in your modules (${ROLE_INFO[u.role].label}) over the past seven days:\n\n${lines.join("\n")}${mine.length > 40 ? `\n…and ${mine.length - 40} more.` : ""}\n\nYou can turn this summary off in Account settings.`,
      { label: "Open the portal", url: abs("/portal") },
    );
    sent++;
  }
  return Response.json({ ok: true, sent });
}
