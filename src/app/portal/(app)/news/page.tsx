import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { ActionButton } from "@/components/portal/actions";
import { ModuleBody, ModuleHeader, Pill, Tabs } from "@/components/portal/ui";
import { fmtDate, isoDay } from "@/lib/format";
import { toggleArticle } from "@/server/actions/news";
import { requireModule } from "@/server/auth";

export const metadata = { title: "News & articles" };

export default async function NewsAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireModule("news");
  const sp = await searchParams;
  const tab = sp.status === "Published" || sp.status === "Draft" ? sp.status : "All";
  const all = await db.select().from(articles).orderBy(desc(articles.date), desc(articles.updatedAt));
  const rows = all.filter((a) => tab === "All" || a.status === tab);
  return (
    <>
      <ModuleHeader mod="news">
        <Link href="/portal/news/new" className="p-btn">
          + New article
        </Link>
      </ModuleHeader>
      <ModuleBody>
        <section className="flex flex-col rounded border border-line bg-white">
          <div className="px-5 pt-1.5">
            <Tabs
              items={(["All", "Published", "Draft"] as const).map((t) => ({
                href: t === "All" ? "/portal/news" : `/portal/news?status=${t}`,
                label: t,
                n: t === "All" ? all.length : all.filter((a) => a.status === t).length,
                on: t === tab,
              }))}
            />
          </div>
          <div className="flex flex-col">
            {rows.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-cloud px-5 py-[18px] hover:bg-mist">
                <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-[5px]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Pill tone={a.status === "Published" ? (a.date > isoDay() ? "warn" : "navy") : "outline"}>{a.status === "Published" && a.date > isoDay() ? "Scheduled" : a.status}</Pill>
                    <span className="text-slate" style={{ font: "600 11.5px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase" }}>
                      {a.category}
                    </span>
                    <span className="text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
                      {fmtDate(a.date)}
                    </span>
                  </div>
                  <Link href={`/portal/news/${a.id}`} className="text-navy no-underline hover:underline" style={{ font: "600 16.5px/1.35 var(--font-serif)" }}>
                    {a.title}
                  </Link>
                  <span className="line-clamp-2 text-muted" style={{ font: "400 13.5px/1.5 var(--font-sans)" }}>
                    {a.excerpt}
                  </span>
                </div>
                <div className="flex gap-4">
                  <Link href={`/portal/news/${a.id}`} className="p-link">
                    Edit
                  </Link>
                  {a.status === "Published" && (
                    <a href={`/news/${a.slug}`} target="_blank" rel="noopener" className="p-link">
                      View ↗
                    </a>
                  )}
                  <ActionButton action={toggleArticle.bind(null, a.id)} className="p-link" confirm={a.status === "Published" ? `Unpublish “${a.title}”?` : undefined}>
                    {a.status === "Published" ? "Unpublish" : "Publish"}
                  </ActionButton>
                </div>
              </div>
            ))}
            {!rows.length && <p className="p-empty">No articles in this view.</p>}
          </div>
        </section>
      </ModuleBody>
    </>
  );
}
