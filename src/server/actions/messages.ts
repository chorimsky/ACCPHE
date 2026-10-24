"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { messageReplies, messages } from "@/db/schema";
import { attempt, fail, ok, type ActionResult } from "@/lib/action";
import { audit } from "@/server/audit";
import { authorize, officeOf } from "@/server/auth";
import { getSiteContent } from "@/server/queries/public";
import { sendEmail } from "@/server/email";

const refresh = () => revalidatePath("/portal", "layout");

export async function setMessageRead(id: string, read: boolean): Promise<ActionResult> {
  return attempt(async () => {
    await authorize("messages");
    const [m] = await db.select({ read: messages.read }).from(messages).where(eq(messages.id, id));
    if (!m) return fail("This message no longer exists.");
    if (m.read !== read) {
      await db.update(messages).set({ read }).where(eq(messages.id, id));
      refresh();
    }
    // Opening a message marks it read silently; marking it unread is a deliberate action and is confirmed.
    return ok(read ? undefined : "Marked as unread");
  });
}

/** Archiving removes the message from the inbox; it stays in the database as part of the record. */
export async function archiveMessage(id: string): Promise<ActionResult> {
  return attempt(async () => {
    const user = await authorize("messages");
    const [m] = await db.select().from(messages).where(eq(messages.id, id));
    if (!m) return fail("This message no longer exists.");
    await db.update(messages).set({ archivedAt: new Date(), read: true }).where(eq(messages.id, id));
    await audit({ actorId: user.id, who: officeOf(user), action: "message.archive", entityType: "message", entityId: id, summary: `Message archived from ${m.name}` });
    refresh();
    return ok("Message archived");
  });
}

/** Reply to a website correspondent: emailed to them and kept with the message. */
export async function replyToMessage(id: string, text: string): Promise<ActionResult> {
  return attempt(async () => {
    const user = await authorize("messages");
    const body = text.trim();
    if (!body) return fail("Write a reply first.");
    if (body.length > 8000) return fail("The reply is too long.");
    const [m] = await db.select().from(messages).where(eq(messages.id, id));
    if (!m) return fail("This message no longer exists.");
    const who = officeOf(user);
    const content = await getSiteContent();
    const replyTo = content.email || process.env.SECRETARIAT_EMAIL || undefined;
    const status = await sendEmail(m.email, `Re: ${m.route} — ACCPHE`, `Dear ${m.name},\n\n${body}\n\n${user.name}\n${who}, ACCPHE\n\n— Your message —\n${m.body.slice(0, 2000)}`, undefined, { replyTo });
    // A reply that could not be delivered is not recorded as sent; the text stays in the box to try again.
    if (status === "invalid") return fail(`The reply could not be sent: ${m.email} is not a valid email address.`);
    if (status === "failed") return fail("The reply could not be delivered by the email service. Please try again later.");
    await db.insert(messageReplies).values({ messageId: id, body, who: `${user.name}, ${who}`, userId: user.id });
    await db.update(messages).set({ read: true }).where(eq(messages.id, id));
    await audit({ actorId: user.id, who, action: "message.reply", entityType: "message", entityId: id, summary: `Reply ${status === "sent" ? "sent" : "recorded"} to ${m.name} (${m.route})` });
    refresh();
    return ok(status === "sent" ? `Reply sent to ${m.email}` : `Reply recorded. Email delivery is off, so it was not emailed — contact ${m.email} directly.`);
  });
}
