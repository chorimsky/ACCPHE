import { MfaSetup, PasswordForm, ProfileForm } from "@/components/portal/account-forms";
import { ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { ROLE_INFO } from "@/lib/domain";
import { mfaRequiredFor, officeOf, requireModule } from "@/server/auth";

export const metadata = { title: "Account settings" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireModule("account");
  const sp = await searchParams;
  const required = mfaRequiredFor(user.role);
  return (
    <>
      <ModuleHeader mod="account" />
      <ModuleBody>
        <div className="flex max-w-[820px] flex-col gap-6">
          {required && !user.mfaEnabled && (
            <div role="alert" className="alert-error" style={{ fontSize: 14 }}>
              Two-step verification is required for your role. Set it up below to continue to the portal.
            </div>
          )}
          {sp.setup === "mfa" && !required && !user.mfaEnabled && (
            <div className="alert-ok" style={{ fontSize: 14 }}>
              We recommend turning on two-step verification.
            </div>
          )}
          <ProfileForm
            user={{ name: user.name, email: user.email, notifyAssign: user.notifyAssign, notifyStatus: user.notifyStatus, notifyDigest: user.notifyDigest }}
            roleLabel={ROLE_INFO[user.role].label}
            office={officeOf(user)}
          />
          <section className="p-card flex flex-col gap-5" style={{ padding: 26 }}>
            <h2 className="p-h3">Security</h2>
            <PasswordForm />
            <div className="flex flex-col gap-3 border-t border-cloud pt-5">
              <span className="text-navy" style={{ font: "600 14px var(--font-sans)" }}>
                Two-step verification
              </span>
              <MfaSetup enabled={user.mfaEnabled} required={required} />
            </div>
          </section>
        </div>
      </ModuleBody>
    </>
  );
}
