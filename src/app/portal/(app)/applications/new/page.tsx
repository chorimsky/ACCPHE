import { NewInquiryForm } from "@/components/portal/forms";
import { Back, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Log an inquiry" };

export default async function NewApplicationPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireModule("applications");
  const k = (await searchParams).kind;
  const kind = k === "program" || k === "fellow" ? k : "institution";
  return (
    <>
      <ModuleHeader mod="applications" />
      <ModuleBody>
        <Back href={kind === "institution" ? "/portal/applications" : `/portal/applications?kind=${kind}`}>All applications</Back>
        <NewInquiryForm kind={kind} />
      </ModuleBody>
    </>
  );
}
