import { NewInquiryForm } from "@/components/portal/forms";
import { Back, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { requireModule } from "@/server/auth";

export const metadata = { title: "Log an inquiry" };

export default async function NewApplicationPage() {
  await requireModule("applications");
  return (
    <>
      <ModuleHeader mod="applications" />
      <ModuleBody>
        <Back href="/portal/applications">All applications</Back>
        <NewInquiryForm />
      </ModuleBody>
    </>
  );
}
