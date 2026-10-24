import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, programRecords } from "@/db/schema";
import { ActionButton } from "@/components/portal/actions";
import { ProgramRecordForm } from "@/components/portal/forms";
import { Back, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { deleteProgramRecord } from "@/server/actions/programs";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Edit program record" };

export default async function EditProgramRecordPage({ params }: { params: Promise<{ id: string }> }) {
  await requireModule("directory");
  const { id } = await params;
  const [r] = await db.select().from(programRecords).where(eq(programRecords.id, id));
  if (!r) notFound();
  const [app] = r.applicationId ? await db.select({ id: applications.id, ref: applications.ref }).from(applications).where(eq(applications.id, r.applicationId)) : [];
  return (
    <>
      <ModuleHeader mod="directory" />
      <ModuleBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Back href="/portal/directory?kind=programs">All program records</Back>
          {app && (
            <Link href={`/portal/applications/${app.id}`} className="p-link">
              From application {app.ref} →
            </Link>
          )}
        </div>
        <ProgramRecordForm
          record={{
            id: r.id,
            verification: r.verification,
            title: r.title,
            provider: r.provider,
            country: r.country,
            category: r.category,
            award: r.award,
            effective: r.effective,
            review: r.review,
            scope: r.scope,
            conditions: r.conditions,
            status: r.status,
            verified: r.verified,
          }}
          deleteSlot={
            r.status === "Draft" ? (
              <ActionButton action={deleteProgramRecord.bind(null, r.id)} confirm={`Delete the program record for ${r.title}? This cannot be undone.`} className="p-btn-danger">
                Delete record
              </ActionButton>
            ) : undefined
          }
        />
      </ModuleBody>
    </>
  );
}
