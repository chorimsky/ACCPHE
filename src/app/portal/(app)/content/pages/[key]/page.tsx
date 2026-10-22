import { notFound } from "next/navigation";
import { BlockEditor } from "@/components/portal/block-editor";
import { Back, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { BLOCK_BY_KEY } from "@/content/cms";
import { requireModule } from "@/server/auth";
import { blockMeta, getBlock } from "@/server/content";

export const metadata = { title: "Edit website text" };

export default async function EditBlockPage({ params }: { params: Promise<{ key: string }> }) {
  await requireModule("content");
  const key = decodeURIComponent((await params).key);
  const def = BLOCK_BY_KEY[key];
  if (!def) notFound();
  const [value, meta] = await Promise.all([getBlock<unknown>(key), blockMeta(key)]);
  return (
    <>
      <ModuleHeader mod="content" title={def.title} sub={`${def.group} · ${def.description}`}>
        <a href={def.usedOn} target="_blank" rel="noopener" className="p-btn-secondary">
          View on website ↗
        </a>
      </ModuleHeader>
      <ModuleBody>
        <Back href="/portal/content/pages">All website pages</Back>
        <BlockEditor key={meta.updatedAt?.toISOString() ?? "official"} blockKey={key} initial={value} customised={meta.customised} />
      </ModuleBody>
    </>
  );
}
