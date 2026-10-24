import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PortalNav } from "@/components/portal/shell";
import { MODULES, ROLE_INFO } from "@/lib/domain";
import { currentUser, mfaRequiredFor, officeOf } from "@/server/auth";
import { navCounts } from "@/server/queries/portal";

/** Signed-in workspace: module navigation for the user's role, with counts of items needing attention. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) {
    const next = (await headers()).get("x-accphe-path");
    redirect(next ? `/portal/sign-in?next=${encodeURIComponent(next)}` : "/portal/sign-in");
  }
  const path = (await headers()).get("x-accphe-path") ?? "";
  if (user.mustChangePassword && !path.startsWith("/portal/account")) redirect("/portal/account?setup=password");
  if (mfaRequiredFor(user.role) && !user.mfaEnabled && !path.startsWith("/portal/account")) redirect("/portal/account?setup=mfa");

  const info = ROLE_INFO[user.role];
  const counts = await navCounts(user.role);
  const items = info.modules.map((m) => ({ href: MODULES[m].href, label: MODULES[m].title, count: counts[m] ?? 0 }));
  const initials = (user.name || officeOf(user))
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  return (
    <div className="flex min-h-screen flex-col min-[940px]:flex-row">
      <PortalNav items={items} who={user.name} roleLabel={info.label} initials={initials || "AC"} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
