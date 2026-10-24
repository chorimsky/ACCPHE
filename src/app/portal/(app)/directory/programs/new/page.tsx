import { ProgramRecordForm } from "@/components/portal/forms";
import { Back, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { requireModule } from "@/server/auth";

export const metadata = { title: "New program record" };

export default async function NewProgramRecordPage() {
  await requireModule("directory");
  return (
    <>
      <ModuleHeader mod="directory" />
      <ModuleBody>
        <Back href="/portal/directory?kind=programs">All program records</Back>
        <ProgramRecordForm
          record={{ id: "", verification: "", title: "", provider: "", country: "", category: "", award: "Accredited Program", effective: "", review: "", scope: "", conditions: "", status: "Draft", verified: false }}
        />
      </ModuleBody>
    </>
  );
}
