import { redirect } from "next/navigation";
import { MfaForm } from "@/components/portal/auth-forms";
import { pendingUser } from "@/server/auth";

export const metadata = { title: "Two-step verification" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (!(await pendingUser())) redirect("/portal/sign-in?expired=1");
  return <MfaForm next={sp.next} />;
}
