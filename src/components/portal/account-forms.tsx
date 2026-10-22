"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { changePassword, confirmMfa, disableMfa, saveProfile, startMfa } from "@/server/actions/account";
import { PortalForm } from "./actions";
import { useToast } from "./toast";

const NOTIF = [
  ["notifyAssign", "Assignments and actions", "When an item is assigned to you or needs your action."],
  ["notifyStatus", "Status changes", "When an application, case, or record you follow changes status."],
  ["notifyDigest", "Weekly summary", "A Monday summary of activity across your modules."],
] as const;

export function ProfileForm({ user, roleLabel, office }: { user: { name: string; email: string; notifyAssign: boolean; notifyStatus: boolean; notifyDigest: boolean }; roleLabel: string; office: string }) {
  const [email, setEmail] = useState(user.email);
  return (
    <PortalForm action={saveProfile} className="flex flex-col gap-6">
      {(pending) => (
        <>
          <section className="p-card flex flex-col gap-[18px]" style={{ padding: 26 }}>
            <h2 className="p-h3">Profile</h2>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))" }}>
              <label className="p-label">
                <span>Display name</span>
                <input name="name" required maxLength={150} defaultValue={user.name} className="p-input" />
              </label>
              <label className="p-label">
                <span>Email</span>
                <input name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="p-input" />
              </label>
              {email.trim().toLowerCase() !== user.email && (
                <label className="p-label col-span-full">
                  <span>Current password (required to change your email)</span>
                  <input name="currentPassword" type="password" autoComplete="current-password" className="p-input" />
                </label>
              )}
              <label className="p-label">
                <span>Role</span>
                <input value={roleLabel} disabled className="p-input" />
              </label>
              <label className="p-label">
                <span>Office</span>
                <input value={office} disabled className="p-input" />
              </label>
            </div>
          </section>
          <section className="p-card flex flex-col gap-3" style={{ padding: 26 }}>
            <h2 className="p-h3">Email notifications</h2>
            {NOTIF.map(([k, t, d]) => (
              <label key={k} className="flex cursor-pointer items-start gap-3 border-t border-cloud py-2.5">
                <input type="checkbox" name={k} defaultChecked={user[k]} className="mt-[3px] h-4 w-4 flex-none" style={{ accentColor: "var(--color-navy)" }} />
                <span className="flex flex-col gap-0.5">
                  <span className="text-navy" style={{ font: "600 14px var(--font-sans)" }}>
                    {t}
                  </span>
                  <span className="text-muted" style={{ font: "400 13px var(--font-sans)" }}>
                    {d}
                  </span>
                </span>
              </label>
            ))}
          </section>
          <div>
            <button type="submit" disabled={pending} className="p-btn">
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </>
      )}
    </PortalForm>
  );
}

export function PasswordForm() {
  const [key, setKey] = useState(0);
  return (
    <PortalForm key={key} action={changePassword} onSuccess={() => setKey((k) => k + 1)} className="flex flex-col gap-4">
      {(pending) => (
        <>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))" }}>
            <label className="p-label">
              <span>Current password</span>
              <input name="currentPassword" type="password" required autoComplete="current-password" className="p-input" />
            </label>
            <label className="p-label">
              <span>New password</span>
              <input name="newPassword" type="password" required minLength={10} autoComplete="new-password" className="p-input" />
            </label>
          </div>
          <div>
            <button type="submit" disabled={pending} className="p-btn-secondary">
              {pending ? "Updating…" : "Change password"}
            </button>
          </div>
        </>
      )}
    </PortalForm>
  );
}

export function MfaSetup({ enabled, required }: { enabled: boolean; required: boolean }) {
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  if (enabled) {
    return (
      <div className="flex flex-col gap-3">
        <span className="pill pill-good self-start">Two-step verification is on</span>
        {!required && (
          <div className="flex flex-wrap items-end gap-2.5">
            <label className="p-label flex-[0_1_240px]">
              <span>Password to turn it off</span>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" className="p-input" />
            </label>
            <button
              type="button"
              className="p-btn-danger"
              disabled={pending || !pw}
              onClick={() =>
                start(async () => {
                  const r = await disableMfa(pw);
                  if (r.ok) {
                    toast(r.message ?? "Off");
                    setPw("");
                    router.refresh();
                  } else toast(r.error, true);
                })
              }
            >
              Turn off
            </button>
          </div>
        )}
      </div>
    );
  }
  if (!setup) {
    return (
      <div className="flex flex-col gap-3">
        <span className="text-muted" style={{ font: "400 13px/1.55 var(--font-sans)" }}>
          Require a one-time code from an authenticator app (such as Microsoft Authenticator, Google Authenticator or 1Password) when signing in.
        </span>
        <div>
          <button
            type="button"
            className="p-btn"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await startMfa();
                if (r.ok) setSetup(r.data as { secret: string; qr: string });
                else toast(r.error, true);
              })
            }
          >
            Set up two-step verification
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-start gap-6">
      {/* eslint-disable-next-line @next/next/no-img-element -- data: URL generated on the server */}
      <img src={setup.qr} alt="QR code for your authenticator app" width={180} height={180} className="rounded border border-line" />
      <div className="flex min-w-[240px] flex-1 flex-col gap-3">
        <ol className="m-0 flex flex-col gap-1.5 pl-5" style={{ font: "400 13.5px/1.55 var(--font-sans)" }}>
          <li>Scan the code with your authenticator app, or enter this key manually:</li>
        </ol>
        <code className="break-all rounded-[3px] border border-line bg-mist px-3 py-2 text-navy" style={{ font: "600 13px ui-monospace,monospace", letterSpacing: ".08em" }}>
          {setup.secret}
        </code>
        <label className="p-label">
          <span>Enter the 6-digit code shown in the app</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="p-input max-w-[200px]" style={{ letterSpacing: ".3em" }} />
        </label>
        <div className="flex gap-2.5">
          <button
            type="button"
            className="p-btn"
            disabled={pending || code.length < 6}
            onClick={() =>
              start(async () => {
                const r = await confirmMfa(code);
                if (r.ok) {
                  toast(r.message ?? "On");
                  setSetup(null);
                  router.refresh();
                } else toast(r.error, true);
              })
            }
          >
            Confirm and turn on
          </button>
          <button type="button" className="p-btn-secondary" onClick={() => setSetup(null)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
