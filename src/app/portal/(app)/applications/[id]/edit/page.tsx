import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { ApplicationEditForm } from "@/components/portal/forms";
import { Back, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Edit application details" };

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireModule("applications");
  const { id } = await params;
  const [a] = await db.select().from(applications).where(eq(applications.id, id));
  if (!a) notFound();
  return (
    <>
      <ModuleHeader mod="applications" title="Edit application details" sub={`${a.ref} · corrections are recorded in the application’s notes and the audit log`} />
      <ModuleBody>
        <Back href={`/portal/applications/${a.id}`}>Back to the application</Back>
        <ApplicationEditForm
          app={{
            id: a.id,
            name: a.name,
            country: a.country,
            website: a.website,
            yearEstablished: a.yearEstablished,
            type: a.type,
            authRef: a.authRef,
            pathway: a.pathway,
            repName: a.repName,
            repPosition: a.repPosition,
            repEmail: a.repEmail,
            repPhone: a.repPhone,
            profile: a.profile,
          }}
        />
      </ModuleBody>
    </>
  );
}
