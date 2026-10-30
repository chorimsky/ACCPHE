import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { applications, messages } from "@/db/schema";
import { CaseForm } from "@/components/portal/forms";
import { Back, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { canAccess } from "@/lib/domain";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Log a case" };

/** ?fromMessage=<id> prefills the form from a website message ("Log as complaint"). */
export default async function NewCasePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireModule("cases");
  const sp = await searchParams;
  const [m] = sp.fromMessage && canAccess(user.role, "messages") ? await db.select().from(messages).where(and(eq(messages.id, sp.fromMessage), isNull(messages.archivedAt))) : [];
  const initial = m
    ? { type: "Complaint", subject: `${m.route} — ${m.name}`, institution: "", party: `${m.name}${m.org ? `, ${m.org}` : ""}`, partyEmail: m.email, details: m.body }
    : { type: "Complaint", subject: "", institution: "", party: "", partyEmail: "", details: "" };
  const apps = await db.select({ id: applications.id, ref: applications.ref, name: applications.name, kind: applications.kind, programTitle: applications.programTitle, fellowDesignation: applications.fellowDesignation }).from(applications).orderBy(asc(applications.ref));
  return (
    <>
      <ModuleHeader mod="cases" />
      <ModuleBody>
        <Back href="/portal/cases">All cases</Back>
        <CaseForm initial={initial} fromMessage={m?.id} applications={apps.map((a) => ({ value: a.id, label: a.kind === "program" ? `${a.ref} — ${a.programTitle} (${a.name})` : a.kind === "fellow" ? `${a.ref} — ${a.name} (${a.fellowDesignation})` : `${a.ref} — ${a.name}` }))} />
      </ModuleBody>
    </>
  );
}
