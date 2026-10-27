import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, records } from "@/db/schema";
import { ActionButton } from "@/components/portal/actions";
import { RecordForm } from "@/components/portal/forms";
import { Back, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { deleteRecord } from "@/server/actions/directory";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Edit directory record" };

export default async function EditRecordPage({ params }: { params: Promise<{ id: string }> }) {
  await requireModule("directory");
  const { id } = await params;
  const [r] = await db.select().from(records).where(eq(records.id, id));
  if (!r) notFound();
  const [app] = r.applicationId ? await db.select({ id: applications.id, ref: applications.ref }).from(applications).where(eq(applications.id, r.applicationId)) : [];
  return (
    <>
      <ModuleHeader mod="directory" />
      <ModuleBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Back href="/portal/directory">All records</Back>
          {app && (
            <Link href={`/portal/applications/${app.id}`} className="p-link">
              From application {app.ref} →
            </Link>
          )}
        </div>
        <RecordForm
          record={{ id: r.id, name: r.name, country: r.country, website: r.website, cls: r.cls, effective: r.effective, review: r.review, scope: r.scope, conditions: r.conditions, status: r.status, verified: r.verified }}
          deleteSlot={
            r.status === "Draft" ? (
              <ActionButton action={deleteRecord.bind(null, r.id)} confirm={`Delete the directory record for ${r.name}? This cannot be undone.`} className="p-btn-danger">
                Delete record
              </ActionButton>
            ) : undefined
          }
        />
      </ModuleBody>
    </>
  );
}
