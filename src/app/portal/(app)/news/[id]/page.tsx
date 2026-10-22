import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { ActionButton } from "@/components/portal/actions";
import { ArticleForm } from "@/components/portal/forms";
import { Back, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { deleteArticle } from "@/server/actions/news";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Edit article" };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  await requireModule("news");
  const { id } = await params;
  const [a] = await db.select().from(articles).where(eq(articles.id, id));
  if (!a) notFound();
  return (
    <>
      <ModuleHeader mod="news" />
      <ModuleBody>
        <Back href="/portal/news">All articles</Back>
        <ArticleForm
          article={{ id: a.id, title: a.title, category: a.category, date: a.date, excerpt: a.excerpt, body: a.body, status: a.status, slug: a.slug }}
          deleteSlot={
            <ActionButton action={deleteArticle.bind(null, a.id)} confirm={`Delete “${a.title}”? This cannot be undone.`} className="p-btn-danger">
              Delete article
            </ActionButton>
          }
        />
      </ModuleBody>
    </>
  );
}
