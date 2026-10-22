import { RecordForm } from "@/components/portal/forms";
import { Back, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { requireModule } from "@/server/auth";

export const metadata = { title: "New directory record" };

export default async function NewRecordPage() {
  await requireModule("directory");
  return (
    <>
      <ModuleHeader mod="directory" />
      <ModuleBody>
        <Back href="/portal/directory">All records</Back>
        <RecordForm record={{ id: "", name: "", country: "", cls: "Accredited Institution", effective: "", review: "", scope: "", conditions: "", status: "Draft", verified: false }} />
      </ModuleBody>
    </>
  );
}
