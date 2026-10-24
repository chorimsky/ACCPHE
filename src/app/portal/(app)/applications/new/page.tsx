import { NewInquiryForm } from "@/components/portal/forms";
import { Back, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Log an inquiry" };

export default async function NewApplicationPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireModule("applications");
  const program = (await searchParams).kind === "program";
  return (
    <>
      <ModuleHeader mod="applications" />
      <ModuleBody>
        <Back href={program ? "/portal/applications?kind=program" : "/portal/applications"}>All applications</Back>
        <NewInquiryForm kind={program ? "program" : "institution"} />
      </ModuleBody>
    </>
  );
}
