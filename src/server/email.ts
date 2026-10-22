import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailOutbox } from "@/db/schema";
import { SITE_URL } from "@/lib/site";

const FROM = () => process.env.EMAIL_FROM ?? "ACCPHE Secretariat <no-reply@accphe.example>";

type Cta = { label: string; url: string };

const validAddress = (to: string) => /^[^\s@]+@[^\s@]+$/.test(to);

/** Whether emails are actually delivered (otherwise they are only recorded in the outbox). */
export const emailEnabled = () => !!process.env.RESEND_API_KEY;

/**
 * Production without Resend: keep recipient and subject as a record but not the body, which can hold
 * password-reset links. Development keeps full bodies for /portal/dev-mail.
 */
function forOutbox<T extends { text: string; html: string }>(m: T): T {
  if (process.env.NODE_ENV !== "production" || process.env.RESEND_API_KEY) return m;
  return { ...m, text: "[not delivered: email delivery is off]", html: "[not delivered]" };
}

/** Send a transactional email. Always recorded in email_outbox; delivered through Resend when configured. */
export async function sendEmail(to: string, rawSubject: string, text: string, cta?: Cta, opts: { replyTo?: string } = {}) {
  if (!validAddress(to)) return;
  const subject = rawSubject.replace(/[\r\n\t]+/g, " ").slice(0, 200);
  const body = cta ? `${text}\n\n${cta.label}: ${cta.url}` : text;
  const html = renderHtml(subject, text, cta);
  const [row] = await db.insert(emailOutbox).values(forOutbox({ to, subject, text: body, html })).returning({ id: emailOutbox.id });

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    await db.update(emailOutbox).set({ status: "logged" }).where(eq(emailOutbox.id, row.id));
    if (process.env.NODE_ENV !== "production") console.info(`[email] → ${to}: ${subject}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM(), to, subject, text: body, html, ...(opts.replyTo ? { reply_to: opts.replyTo } : {}) }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    await db.update(emailOutbox).set({ status: "sent" }).where(eq(emailOutbox.id, row.id));
  } catch (err) {
    console.error(JSON.stringify({ level: "error", source: "email", outboxId: row.id, error: String(err).slice(0, 500) }));
    await db.update(emailOutbox).set({ status: "failed", error: String(err).slice(0, 1000) }).where(eq(emailOutbox.id, row.id));
  }
}

/** Fire-and-forget wrapper: an email failure must never undo the change that triggered it. */
export async function trySendEmail(...args: Parameters<typeof sendEmail>) {
  try {
    await sendEmail(...args);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", source: "email", error: String(err).slice(0, 500) }));
  }
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function renderHtml(subject: string, text: string, cta?: Cta) {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.6">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const button = cta
    ? `<p style="margin:24px 0"><a href="${esc(cta.url)}" style="background:#142B45;color:#F7F9FB;padding:12px 20px;border-radius:2px;text-decoration:none;display:inline-block;font-weight:600">${esc(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#F3F6F9;font-family:Helvetica,Arial,sans-serif;color:#2B3D50">
<div style="max-width:580px;margin:0 auto;padding:32px 20px">
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr><td style="padding-right:12px"><img src="${esc(SITE_URL)}/icon" width="36" height="36" alt="" style="display:block;border:0"></td><td style="font-family:Georgia,serif;font-size:20px;letter-spacing:.08em;color:#142B45;font-weight:600">ACCPHE</td></tr></table>
<div style="background:#fff;border:1px solid #DCE3E9;border-top:3px solid #142B45;padding:28px">
<h1 style="font-family:Georgia,serif;font-weight:normal;color:#142B45;font-size:22px;margin:0 0 16px">${esc(subject)}</h1>
${paras}${button}</div>
<p style="font-size:12px;color:#5A7186;margin-top:20px;line-height:1.5">Accreditation &amp; Compliance Council for Christian and Private Higher Education · <a href="${esc(SITE_URL)}" style="color:#45627C">${esc(SITE_URL.replace(/^https?:\/\//, ""))}</a></p>
</div></body></html>`;
}
