import Link from "next/link";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { contentBlocks, users } from "@/db/schema";
import { ContentTabs, InfoNote, ModuleBody, ModuleHeader, Pill } from "@/components/portal/ui";
import { BLOCK_GROUPS, BLOCKS } from "@/content/cms";
import { fmtDate } from "@/lib/format";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Website pages" };

export default async function ContentPagesIndex() {
  await requireModule("content");
  const saved = await db.select().from(contentBlocks);
  const byKey = new Map(saved.map((r) => [r.key, r]));
  const ids = [...new Set(saved.map((r) => r.updatedById).filter((x): x is string => !!x))];
  const editors = ids.length ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, ids)) : [];
  const name = new Map(editors.map((e) => [e.id, e.name]));
  return (
    <>
      <ModuleHeader mod="content">
        <a href="/" target="_blank" rel="noopener" className="p-btn-secondary">
          View website ↗
        </a>
      </ModuleHeader>
      <ModuleBody>
        <ContentTabs current="pages" />
        <InfoNote>
          Edit the Council’s published texts. Changes are live as soon as they are saved and are recorded in the audit log. Any section can be restored to the official text approved for launch.
        </InfoNote>
        <div className="flex max-w-[900px] flex-col gap-6">
          {BLOCK_GROUPS.map((g) => (
            <section key={g} className="flex flex-col rounded border border-line bg-white">
              <h2 className="p-h3 border-b border-line px-5 py-4">{g}</h2>
              {BLOCKS.filter((b) => b.group === g).map((b) => {
                const row = byKey.get(b.key);
                return (
                  <Link key={b.key} href={`/portal/content/pages/${encodeURIComponent(b.key)}`} className="flex flex-wrap items-center justify-between gap-3 border-b border-cloud px-5 py-3.5 no-underline last:border-b-0 hover:bg-mist">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-navy" style={{ font: "600 14.5px var(--font-sans)" }}>
                        {b.title}
                      </span>
                      <span className="text-muted" style={{ font: "400 13px var(--font-sans)" }}>
                        {b.description}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      {row ? (
                        <span className="text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
                          Edited {fmtDate(row.updatedAt)}
                          {row.updatedById && name.get(row.updatedById) ? ` by ${name.get(row.updatedById)}` : ""}
                        </span>
                      ) : null}
                      <Pill tone={row ? "warn" : "outline"}>{row ? "Edited" : "Official text"}</Pill>
                    </span>
                  </Link>
                );
              })}
            </section>
          ))}
        </div>
      </ModuleBody>
    </>
  );
}
