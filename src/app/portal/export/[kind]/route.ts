import { desc, like, or } from "drizzle-orm";
import { db } from "@/db";
import { applications, auditLog, programRecords, records, users } from "@/db/schema";
import { canAccess, trackOf } from "@/lib/domain";
import { isoDay } from "@/lib/format";
import { audit } from "@/server/audit";
import { currentUser, mfaSetupPending, officeOf } from "@/server/auth";

/** Cells starting with = + - @ are prefixed so spreadsheet software never evaluates them as formulas. */
function cell(x: unknown) {
  let s = x === null || x === undefined ? "" : x instanceof Date ? x.toISOString() : String(x);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
const csv = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");

export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const user = await currentUser();
  if (user && mfaSetupPending(user)) return new Response("Set up two-step verification first.", { status: 403 });
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { kind } = await params;
  let rows: unknown[][];
  if (kind === "applications" && canAccess(user.role, "applications")) {
    const [apps, staff] = await Promise.all([db.select().from(applications).orderBy(desc(applications.submittedAt)), db.select({ id: users.id, name: users.name }).from(users)]);
    const name = new Map(staff.map((s) => [s.id, s.name]));
    rows = [["Reference", "Type", "Institution / provider", "Program", "Country", "Pathway", "Stage", "Decision", "Officer", "Representative", "Email", "Submitted", "Updated"]].concat(
      apps.map((a) => [
        a.ref,
        trackOf(a).label,
        a.name,
        a.programTitle,
        a.country,
        a.kind === "program" ? "" : a.pathway,
        trackOf(a).stages[a.stage],
        a.decision,
        a.officerId ? (name.get(a.officerId) ?? "") : "Unassigned",
        a.repName,
        a.repEmail,
        isoDay(a.submittedAt),
        isoDay(a.updatedAt),
      ]),
    );
  } else if (kind === "directory" && canAccess(user.role, "directory")) {
    const recs = await db.select().from(records).orderBy(records.name);
    rows = [["Institution", "Country", "Classification", "Scope", "Effective", "Review", "Conditions", "Status", "Verified", "Public URL"]].concat(
      recs.map((r) => [r.name, r.country, r.cls, r.scope, r.effective, r.review, r.conditions, r.status, r.verified ? "Yes" : "No", `/directory/${r.slug}`]),
    );
  } else if (kind === "programs" && canAccess(user.role, "directory")) {
    const recs = await db.select().from(programRecords).orderBy(programRecords.title);
    rows = [["Verification no.", "Program", "Provider", "Country", "Category", "Status awarded", "Scope", "Effective", "Valid until", "Conditions", "Status", "Verified", "Public URL"]].concat(
      recs.map((r) => [r.verification, r.title, r.provider, r.country, r.category, r.award, r.scope, r.effective, r.review, r.conditions, r.status, r.verified ? "Yes" : "No", `/directory/programs/${r.slug}`]),
    );
  } else if (kind === "audit" && canAccess(user.role, "reports")) {
    const q = new URL(req.url).searchParams.get("q")?.trim();
    const entries = await db
      .select()
      .from(auditLog)
      .where(q ? or(like(auditLog.summary, `%${q}%`), like(auditLog.who, `%${q}%`)) : undefined)
      .orderBy(desc(auditLog.createdAt));
    rows = [["Timestamp (UTC)", "Office", "Action", "Summary", "Entity", "IP"], ...entries.map((a) => [a.createdAt.toISOString(), a.who, a.action, a.summary, a.entityType, a.ip ?? ""])];
  } else {
    return new Response("Not found", { status: 404 });
  }
  await audit({ actorId: user.id, who: officeOf(user), action: "export", entityType: kind, summary: `Exported ${kind} (${rows.length - 1} rows)` });
  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="accphe-${kind}-${isoDay()}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
