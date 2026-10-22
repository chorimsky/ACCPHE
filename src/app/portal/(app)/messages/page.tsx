import Link from "next/link";
import { asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { messageReplies, messages } from "@/db/schema";
import { ActionButton, NoteComposer } from "@/components/portal/actions";
import { MarkRead } from "@/components/portal/mark-read";
import { ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { canAccess } from "@/lib/domain";
import { fmtDateTime, fmtRelative } from "@/lib/format";
import { archiveMessage, replyToMessage, setMessageRead } from "@/server/actions/messages";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireModule("messages");
  const sp = await searchParams;
  const rows = await db.select().from(messages).where(isNull(messages.archivedAt)).orderBy(desc(messages.createdAt));
  const m = rows.find((x) => x.id === sp.id);
  const replies = m ? await db.select().from(messageReplies).where(eq(messageReplies.messageId, m.id)).orderBy(asc(messageReplies.createdAt)) : [];
  return (
    <>
      <ModuleHeader mod="messages" />
      <ModuleBody>
        <div className="flex flex-wrap items-start gap-6">
          <nav aria-label="Inbox" className="flex min-w-0 flex-[1_1_340px] flex-col overflow-hidden rounded border border-line bg-white">
            {rows.map((r) => {
              const sel = r.id === m?.id;
              return (
                <Link
                  key={r.id}
                  href={`/portal/messages?id=${r.id}`}
                  scroll={false}
                  aria-current={sel ? "true" : undefined}
                  className="flex flex-col gap-[5px] border-b py-4 pr-[18px] no-underline"
                  style={sel ? { background: "var(--color-cloud)", borderLeft: "3px solid var(--color-navy)", paddingLeft: 18, borderBottomColor: "var(--color-line)" } : { paddingLeft: 21, borderBottomColor: "var(--color-cloud)" }}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      {!r.read && !sel && <span aria-label="Unread" className="h-2 w-2 rounded-full bg-navy" />}
                      <span className="text-navy" style={{ font: "600 14px var(--font-sans)" }}>
                        {r.name}
                      </span>
                    </span>
                    <span className="text-muted" style={{ font: "400 12px var(--font-sans)" }}>
                      {fmtRelative(r.createdAt)}
                    </span>
                  </span>
                  <span className="text-slate" style={{ font: "600 11.5px var(--font-sans)" }}>
                    {r.route}
                  </span>
                  <span style={{ font: "400 13px/1.5 var(--font-sans)", color: sel ? "var(--color-ink)" : "var(--color-muted)" }}>{r.body.length > 96 ? `${r.body.slice(0, 96)}…` : r.body}</span>
                </Link>
              );
            })}
            {!rows.length && <p className="p-empty">No messages.</p>}
          </nav>
          <section className="flex min-h-80 min-w-0 flex-[2_1_460px] flex-col gap-4 rounded border border-line bg-white p-7">
            {!m && <div className="grid flex-1 place-items-center text-center text-muted">Select a message to read it.</div>}
            {m && (
              <>
                {!m.read && <MarkRead id={m.id} />}
                <div className="flex flex-col gap-[5px]">
                  <span className="text-slate" style={{ font: "600 11.5px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                    {m.route}
                  </span>
                  <h2 className="m-0 text-navy" style={{ font: "500 23px/1.2 var(--font-serif)" }}>
                    {m.name}
                  </h2>
                  <span className="text-muted" style={{ font: "400 13px var(--font-sans)" }}>
                    {m.org || "—"} · {m.email} · {fmtDateTime(m.createdAt)}
                  </span>
                </div>
                <p className="m-0 whitespace-pre-wrap border-y border-cloud py-5" style={{ font: "400 15.5px/1.7 var(--font-sans)" }}>
                  {m.body}
                </p>
                {replies.map((r) => (
                  <div key={r.id} className="flex flex-col gap-1 border-l-2 border-navy bg-mist px-4 py-3">
                    <span className="text-slate" style={{ font: "600 12px var(--font-sans)" }}>
                      Reply · {r.who} · {fmtDateTime(r.createdAt)}
                    </span>
                    <span className="whitespace-pre-wrap" style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>
                      {r.body}
                    </span>
                  </div>
                ))}
                {m.route !== "Account request" && (
                  <NoteComposer rows={4} placeholder={`Reply to ${m.name} (sent to ${m.email})…`} buttons={[{ label: "Send reply", primary: true, run: replyToMessage.bind(null, m.id) }]} />
                )}
                <div className="flex flex-wrap items-center gap-2.5">
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.route}`)}`} className="p-btn-secondary">
                    Open in email app
                  </a>
                  {m.route === "Account request" && canAccess(user.role, "users") && (
                    <Link href="/portal/users" className="p-btn-secondary">
                      Review account request
                    </Link>
                  )}
                  {canAccess(user.role, "cases") && m.route !== "Account request" && (
                    <Link href={`/portal/cases/new?fromMessage=${m.id}`} className="p-btn-secondary">
                      Log as complaint
                    </Link>
                  )}
                  <ActionButton action={setMessageRead.bind(null, m.id, false)} className="p-btn-secondary">
                    Mark unread
                  </ActionButton>
                  <span className="ml-auto">
                    <ActionButton action={archiveMessage.bind(null, m.id)} className="p-btn-danger" confirm="Archive this message? It leaves the inbox but stays in the record.">
                      Archive
                    </ActionButton>
                  </span>
                </div>
              </>
            )}
          </section>
        </div>
      </ModuleBody>
    </>
  );
}
