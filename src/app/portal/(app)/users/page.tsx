import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { applications, users, USER_STATUS } from "@/db/schema";
import { ActionButton, PasswordLinkButton, SetPasswordButton } from "@/components/portal/actions";
import { InviteForm } from "@/components/portal/forms";
import { InfoNote, ModuleBody, ModuleHeader, Pill, Tabs } from "@/components/portal/ui";
import { PickAndRun, SaveSelect } from "@/components/portal/widgets";
import { ROLE_INFO } from "@/lib/domain";
import { fmtDate, fmtRelative } from "@/lib/format";
import { approveUser, linkApplication, resetUserMfa, sendPasswordLink, setUserPassword, setUserRole, setUserStatus } from "@/server/actions/users";
import { ROLES } from "@/db/schema";
import { requireModule } from "@/server/auth";
import { emailEnabled } from "@/server/email";

export const metadata = { title: "Users & access" };

const TAB_LABEL = { pending: "Pending", active: "Active", suspended: "Suspended" } as const;

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireModule("users");
  const sp = await searchParams;
  const tab = USER_STATUS.find((s) => s === sp.status) ?? "pending";
  const [all, apps] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)),
    db.select({ id: applications.id, ref: applications.ref, name: applications.name, kind: applications.kind, programTitle: applications.programTitle, fellowDesignation: applications.fellowDesignation }).from(applications).orderBy(asc(applications.ref)),
  ]);
  const appOptions = apps.map((a) => ({ value: a.id, label: a.kind === "program" ? `${a.ref} — ${a.programTitle} (${a.name})` : a.kind === "fellow" ? `${a.ref} — ${a.name} (${a.fellowDesignation})` : `${a.ref} — ${a.name}` }));
  const rows = all.filter((u) => u.status === tab);
  return (
    <>
      <ModuleHeader mod="users" />
      <ModuleBody>
        <InfoNote>
          Verify each requester’s identity and authority before activation. Institution representatives must be authorized by their institution and are linked to their institution’s application; reviewers must
          meet the Council’s competence requirements.
        </InfoNote>
        <section className="flex flex-col rounded border border-line bg-white">
          <div className="px-5 pt-1.5">
            <Tabs items={USER_STATUS.map((s) => ({ href: `/portal/users?status=${s}`, label: TAB_LABEL[s], n: all.filter((u) => u.status === s).length, on: s === tab }))} />
          </div>
          <div className="overflow-x-auto">
            <table className="p-table min-w-[920px]">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Account type</th>
                  <th scope="col">Organization / expertise</th>
                  <th scope="col">{tab === "pending" ? "Requested" : "Last sign-in"}</th>
                  <th scope="col">Security</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const suggested = u.requestedRef ? apps.find((a) => a.ref === u.requestedRef) : undefined;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-navy" style={{ font: "600 14.5px var(--font-sans)" }}>
                            {u.name}
                          </span>
                          <span className="text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
                            {u.email}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          {tab === "active" && u.role !== "institution" && u.id !== me.id ? (
                            <SaveSelect
                              label={`Role of ${u.name}`}
                              value={u.role}
                              options={ROLES.filter((r) => r !== "institution").map((r) => ({ value: r, label: ROLE_INFO[r].label }))}
                              onSave={setUserRole.bind(null, u.id)}
                            />
                          ) : (
                            <span>{ROLE_INFO[u.role].label}</span>
                          )}
                          {u.position && (
                            <span className="text-muted" style={{ fontSize: 12.5 }}>
                              {u.position}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="min-w-[240px]">
                        <div className="flex flex-col gap-1.5">
                          <span>{u.org || "—"}</span>
                          {u.role === "institution" && tab !== "pending" && (
                            <SaveSelect label={`Application for ${u.name}`} value={u.applicationId ?? ""} options={[{ value: "", label: "Not linked" }, ...appOptions]} onSave={linkApplication.bind(null, u.id)} />
                          )}
                          {u.role === "institution" && tab === "pending" && (
                            <span className="text-slate" style={{ font: "600 12px var(--font-sans)" }}>
                              {suggested ? `Quoted ${suggested.ref} (found)` : u.requestedRef ? `Quoted ${u.requestedRef} (not found)` : "No reference quoted"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap">{tab === "pending" ? fmtDate(u.createdAt) : u.lastLoginAt ? fmtRelative(u.lastLoginAt) : "Never"}</td>
                      <td>
                        <Pill tone={u.mfaEnabled ? "good" : "outline"}>{u.mfaEnabled ? "Two-step on" : "Password only"}</Pill>
                      </td>
                      <td className="text-right">
                        <div className="flex flex-col items-end gap-2">
                          {tab === "pending" && u.role === "institution" && (
                            <div className="w-[300px]">
                              <PickAndRun options={appOptions} onRun={approveUser.bind(null, u.id)} placeholder={suggested ? `Link to ${suggested.ref}…` : "Link to application…"} button="Approve" />
                            </div>
                          )}
                          <div className="flex flex-wrap justify-end gap-3.5">
                            {tab === "active" && (
                              <PasswordLinkButton action={sendPasswordLink.bind(null, u.id)} name={u.name} emailOn={emailEnabled()} />
                            )}
                            {tab === "active" && u.id !== me.id && <SetPasswordButton action={setUserPassword.bind(null, u.id)} name={u.name} />}
                            {tab === "active" && u.mfaEnabled && (
                              <ActionButton action={resetUserMfa.bind(null, u.id)} className="p-link" confirm={`Reset two-step verification for ${u.name}? Do this only after confirming their identity.`}>
                                Reset two-step
                              </ActionButton>
                            )}
                            {tab === "pending" && u.role !== "institution" && (
                              <ActionButton action={approveUser.bind(null, u.id, null)} className="p-link">
                                Approve
                              </ActionButton>
                            )}
                            {tab !== "suspended" && u.id !== me.id && (
                              <ActionButton action={setUserStatus.bind(null, u.id, "suspended")} confirm={`${tab === "pending" ? "Decline" : "Suspend"} access for ${u.name}?`} className="p-btn-danger" title={tab === "pending" ? "Decline request" : "Suspend access"}>
                                {tab === "pending" ? "Decline" : "Suspend"}
                              </ActionButton>
                            )}
                            {tab === "suspended" && (
                              <ActionButton action={setUserStatus.bind(null, u.id, "active")} className="p-link">
                                Reactivate
                              </ActionButton>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!rows.length && <p className="p-empty">No accounts in this view.</p>}
          </div>
        </section>
        <InviteForm />
      </ModuleBody>
    </>
  );
}
