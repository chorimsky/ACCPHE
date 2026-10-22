import { ArticleForm } from "@/components/portal/forms";
import { Back, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { isoDay } from "@/lib/format";
import { requireModule } from "@/server/auth";

export const metadata = { title: "New article" };

export default async function NewArticlePage() {
  await requireModule("news");
  return (
    <>
      <ModuleHeader mod="news" />
      <ModuleBody>
        <Back href="/portal/news">All articles</Back>
        <ArticleForm article={{ id: "", title: "", category: "Announcements", date: isoDay(), excerpt: "", body: "", status: "Draft", slug: "" }} />
      </ModuleBody>
    </>
  );
}
