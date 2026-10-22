import { ActionButton } from "@/components/portal/actions";
import { ContentForm } from "@/components/portal/forms";
import { ContentTabs, ModuleBody, ModuleHeader } from "@/components/portal/ui";
import { resetDemoData } from "@/server/actions/content";
import { requireModule } from "@/server/auth";
import { getSiteContent } from "@/server/queries/public";

export const metadata = { title: "Site content" };

export default async function ContentPage() {
  const user = await requireModule("content");
  const c = await getSiteContent();
  const demo = process.env.DEMO_MODE === "1" && user.role === "admin";
  return (
    <>
      <ModuleHeader mod="content">
        <a href="/" target="_blank" rel="noopener" className="p-btn-secondary">
          View website ↗
        </a>
      </ModuleHeader>
      <ModuleBody>
        <ContentTabs current="notices" />
        <ContentForm content={{ bannerOn: c.bannerOn, bannerText: c.bannerText, notice: c.notice, email: c.email, phone: c.phone, address: c.address }} />
        {demo && (
          <section className="flex max-w-[900px] flex-wrap items-center justify-between gap-4 rounded border border-line bg-white px-[26px] py-[22px]">
            <div className="flex flex-col gap-1">
              <h2 className="p-h3">Demonstration data</h2>
              <span className="text-muted" style={{ font: "400 13px var(--font-sans)" }}>
                Restore the sample applications, records, articles, cases, messages and demo accounts. Available on development and preview deployments only.
              </span>
            </div>
            <ActionButton
              action={async () => {
                "use server";
                const r = await resetDemoData();
                return r ?? { ok: false as const, error: "Something went wrong." };
              }}
              confirm="Restore demonstration data? All data on this deployment will be replaced (your own account is kept)."
              className="p-btn-danger"
              pendingLabel="Restoring…"
            >
              Reset demonstration data
            </ActionButton>
          </section>
        )}
      </ModuleBody>
    </>
  );
}

