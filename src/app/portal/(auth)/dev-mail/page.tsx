import { notFound } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { emailOutbox } from "@/db/schema";
import { fmtDateTime } from "@/lib/format";

export const metadata = { title: "Development mailbox" };

/** Development only: emails recorded in the outbox (nothing is delivered without RESEND_API_KEY). */
export default async function DevMail() {
  if (process.env.NODE_ENV === "production") notFound();
  const mails = await db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(50);
  return (
    <div className="flex w-full max-w-[720px] flex-col gap-4">
      <h1 className="m-0 text-navy" style={{ font: "500 28px var(--font-serif)" }}>
        Development mailbox
      </h1>
      <p className="small m-0">Emails recorded on this machine (newest first). Links in these messages work locally.</p>
      {mails.map((m) => (
        <details key={m.id} className="rounded border border-line bg-white p-4">
          <summary className="cursor-pointer text-navy" style={{ font: "600 14px var(--font-sans)" }}>
            {m.subject} <span className="font-normal text-muted">→ {m.to} · {fmtDateTime(m.createdAt)} · {m.status}</span>
          </summary>
          <pre className="mt-3 whitespace-pre-wrap" style={{ font: "400 13px/1.55 var(--font-sans)" }}>
            {m.text}
          </pre>
        </details>
      ))}
      {!mails.length && <p className="small">No emails yet.</p>}
    </div>
  );
}
