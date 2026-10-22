import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users, type Role } from "@/db/schema";
import { ROLE_INFO, type ModuleKey } from "@/lib/domain";
import { abs } from "@/lib/site";
import { trySendEmail } from "@/server/email";

type Mail = { subject: string; text: string; link?: string; linkLabel?: string };

const cta = (m: Mail) => (m.link ? { label: m.linkLabel ?? "Open in the portal", url: abs(m.link) } : undefined);

/**
 * Alert the staff who work in a module (and the Secretariat mailbox) about something new that needs action —
 * a website inquiry, a message, an account request. Staff opt out with "Assignments and actions".
 */
export async function notifyModule(mod: ModuleKey, mail: Mail, opts: { secretariat?: boolean } = {}) {
  const roles = (Object.keys(ROLE_INFO) as Role[]).filter((r) => ROLE_INFO[r].modules.includes(mod));
  const staff = await db
    .select({ email: users.email })
    .from(users)
    .where(and(inArray(users.role, roles), eq(users.status, "active"), eq(users.notifyAssign, true)));
  const to = new Set(staff.map((s) => s.email));
  const box = process.env.SECRETARIAT_EMAIL?.trim();
  if (opts.secretariat !== false && box) to.add(box.toLowerCase());
  for (const email of to) await trySendEmail(email, mail.subject, mail.text, cta(mail));
}

/** Something was assigned to a person (officer, reviewer). */
export async function notifyAssigned(userId: string | null | undefined, mail: Mail) {
  if (!userId) return;
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (u && u.status === "active" && u.notifyAssign) await trySendEmail(u.email, mail.subject, `Hello ${u.name},\n\n${mail.text}`, cta(mail));
}

/** Something a person follows changed status. */
export async function notifyStatus(userIds: (string | null | undefined)[], mail: Mail) {
  const ids = [...new Set(userIds.filter((x): x is string => !!x))];
  if (!ids.length) return;
  const rows = await db.select().from(users).where(and(inArray(users.id, ids), eq(users.status, "active"), eq(users.notifyStatus, true)));
  for (const u of rows) await trySendEmail(u.email, mail.subject, `Hello ${u.name},\n\n${mail.text}`, cta(mail));
}

/**
 * Write to an institution about its application. Linked portal accounts receive it (status changes respect their
 * preference; direct messages are always sent). Without a portal account, direct messages go to the representative
 * email given in the inquiry so that nothing sent "to the institution" is lost.
 */
export async function notifyInstitution(app: { id: string; repEmail: string; repName: string }, mail: Mail, kind: "message" | "status") {
  const linked = await db
    .select()
    .from(users)
    .where(and(eq(users.applicationId, app.id), eq(users.role, "institution"), eq(users.status, "active")));
  const recipients = linked.filter((u) => kind === "message" || u.notifyStatus);
  if (recipients.length) {
    for (const u of recipients) await trySendEmail(u.email, mail.subject, `Hello ${u.name},\n\n${mail.text}`, cta({ ...mail, link: mail.link ?? "/portal/my-application" }));
    return;
  }
  if (!linked.length && app.repEmail) {
    await trySendEmail(app.repEmail, mail.subject, `Dear ${app.repName || "colleague"},\n\n${mail.text}`);
  }
}
