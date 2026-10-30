import { FellowRecordForm } from "@/components/portal/forms";
import { Back, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { requireModule } from "@/server/auth";

export const metadata = { title: "New register entry" };

export default async function NewFellowPage() {
  await requireModule("directory");
  return (
    <>
      <ModuleHeader mod="directory" />
      <ModuleBody>
        <Back href="/portal/directory?kind=fellows">All register entries</Back>
        <FellowRecordForm
          record={{ id: "", verification: "", honorific: "", name: "", designation: "FACCPHE", country: "", position: "", affiliation: "", citation: "", effective: "", review: "", status: "Draft", verified: false }}
        />
      </ModuleBody>
    </>
  );
}
