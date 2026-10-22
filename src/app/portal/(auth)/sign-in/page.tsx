import { redirect } from "next/navigation";
import { SignInForm } from "@/components/portal/auth-forms";
import { homeFor } from "@/lib/domain";
import { currentUser } from "@/server/auth";

export const metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await currentUser();
  if (user) redirect(homeFor(user.role));
  const notice = sp.reset ? "Your password has been changed. Sign in with your new password." : sp.signedOut ? "You have been signed out." : sp.expired ? "Your session expired. Sign in again." : undefined;
  return <SignInForm next={sp.next} notice={notice} />;
}
