import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, fellows } from "@/db/schema";
import { ActionButton } from "@/components/portal/actions";
import { FellowRecordForm } from "@/components/portal/forms";
import { Back, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { deleteFellow } from "@/server/actions/fellows";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Edit register entry" };

export default async function EditFellowPage({ params }: { params: Promise<{ id: string }> }) {
  await requireModule("directory");
  const { id } = await params;
  const [r] = await db.select().from(fellows).where(eq(fellows.id, id));
  if (!r) notFound();
  const [app] = r.applicationId ? await db.select({ id: applications.id, ref: applications.ref }).from(applications).where(eq(applications.id, r.applicationId)) : [];
  return (
    <>
      <ModuleHeader mod="directory" />
      <ModuleBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Back href="/portal/directory?kind=fellows">All register entries</Back>
          {app && (
            <Link href={`/portal/applications/${app.id}`} className="p-link">
              From application {app.ref} →
            </Link>
          )}
        </div>
        <FellowRecordForm
          record={{
            id: r.id,
            verification: r.verification,
            honorific: r.honorific,
            name: r.name,
            designation: r.designation,
            country: r.country,
            position: r.position,
            affiliation: r.affiliation,
            citation: r.citation,
            effective: r.effective,
            review: r.review,
            status: r.status,
            verified: r.verified,
          }}
          deleteSlot={
            r.status === "Draft" ? (
              <ActionButton action={deleteFellow.bind(null, r.id)} confirm={`Delete the register entry for ${r.name}? This cannot be undone.`} className="p-btn-danger">
                Delete entry
              </ActionButton>
            ) : undefined
          }
        />
      </ModuleBody>
    </>
  );
}
