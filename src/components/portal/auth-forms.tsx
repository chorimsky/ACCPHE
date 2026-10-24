"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormAction } from "@/components/ui/use-form-action";
import { forgotPassword, requestAccount, resetPassword, signIn, verifyMfa } from "@/server/actions/auth";

const Err = ({ msg }: { msg?: string }) =>
  msg ? (
    <div role="alert" className="alert-error">
      {msg}
    </div>
  ) : null;

const Heading = ({ title, sub }: { title: string; sub: string }) => (
  <div className="flex flex-col gap-2">
    <h1 className="m-0 text-navy" style={{ font: "500 30px/1.15 var(--font-serif)" }}>
      {title}
    </h1>
    <p className="m-0 text-muted" style={{ font: "400 14.5px/1.55 var(--font-sans)" }}>
      {sub}
    </p>
  </div>
);

const Done = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div role="status" className="flex w-full max-w-[460px] flex-col gap-[18px]">
    <span aria-hidden="true" className="grid h-[52px] w-[52px] place-items-center rounded-full bg-navy text-mist" style={{ font: "700 22px var(--font-sans)" }}>
      ✓
    </span>
    <div className="flex flex-col gap-2">
      <h1 className="m-0 text-navy" style={{ font: "500 30px/1.15 var(--font-serif)" }}>
        {title}
      </h1>
      <p className="m-0 text-muted" style={{ font: "400 14.5px/1.55 var(--font-sans)" }}>
        {children}
      </p>
    </div>
    <div>
      <Link href="/portal/sign-in" className="link-plain" style={{ fontSize: 13.5 }}>
        ← Back to sign in
      </Link>
    </div>
  </div>
);

export function SignInForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, onSubmit, pending] = useFormAction(signIn);
  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-[440px] flex-col gap-[22px]">
      <Heading title="Sign in" sub="Use your Council or institutional credentials." />
      {notice && !state && (
        <div role="status" className="alert-ok">
          {notice}
        </div>
      )}
      <Err msg={state && !state.ok ? state.error : undefined} />
      {next && <input type="hidden" name="next" value={next} />}
      <label className="p-label">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" placeholder="name@institution.org" className="p-input" style={{ height: 46 }} />
      </label>
      <div className="p-label">
        <span className="flex w-full justify-between">
          <label htmlFor="signin-password">Password</label>
          <Link href="/portal/forgot" className="link-plain" style={{ fontSize: 13.5 }}>
            Forgot password?
          </Link>
        </span>
        <input id="signin-password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" className="p-input" style={{ height: 46 }} />
      </div>
      <button type="submit" disabled={pending} className="p-btn" style={{ padding: 14, fontSize: 15 }}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="m-0 text-center text-muted" style={{ font: "400 14px var(--font-sans)" }}>
        New institution or reviewer?{" "}
        <Link href="/portal/register" className="link-plain" style={{ fontSize: 13.5 }}>
          Request an account
        </Link>
      </p>
      <Link href="/" className="text-center" style={{ font: "500 13.5px var(--font-sans)" }}>
        ← Return to the public website
      </Link>
    </form>
  );
}

export function MfaForm({ next }: { next?: string }) {
  const [state, onSubmit, pending] = useFormAction(verifyMfa);
  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-[440px] flex-col gap-[22px]">
      <Heading title="Two-step verification" sub="Enter the 6-digit code from your authenticator app." />
      <Err msg={state && !state.ok ? state.error : undefined} />
      {next && <input type="hidden" name="next" value={next} />}
      <label className="p-label">
        <span>Verification code</span>
        <input name="code" required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} autoFocus className="p-input" style={{ height: 46, letterSpacing: ".3em", fontSize: 20 }} />
      </label>
      <button type="submit" disabled={pending} className="p-btn" style={{ padding: 14, fontSize: 15 }}>
        {pending ? "Verifying…" : "Verify and continue"}
      </button>
      <p className="m-0 text-center text-muted" style={{ font: "400 13.5px/1.5 var(--font-sans)" }}>
        Lost access to your authenticator app? Contact the Executive Secretariat to reset two-step verification.
      </p>
      <Link href="/portal/sign-in" className="text-center" style={{ font: "500 13.5px var(--font-sans)" }}>
        ← Back to sign in
      </Link>
    </form>
  );
}

export function RegisterForm({ initialRef }: { initialRef: string }) {
  const [state, onSubmit, pending] = useFormAction(requestAccount);
  const [type, setType] = useState<"institution" | "reviewer">("institution");
  if (state?.ok) return <Done title="Account request received">{state.message}</Done>;
  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-[520px] flex-col gap-5">
      <Heading title="Request an account" sub="Accounts are verified by the Secretariat before access is granted." />
      <Err msg={state && !state.ok ? state.error : undefined} />
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="pb-2 text-navy" style={{ font: "600 13px var(--font-sans)" }}>
          Account type
        </legend>
        <input type="hidden" name="type" value={type} />
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))" }}>
          {(
            [
              ["institution", "Institution or provider", "Track an application"],
              ["reviewer", "Reviewer", "Serve on review teams"],
            ] as const
          ).map(([k, label, desc]) => (
            <button
              key={k}
              type="button"
              aria-pressed={type === k}
              onClick={() => setType(k)}
              className="flex flex-col gap-[3px] rounded-[3px] p-3 text-left"
              style={type === k ? { border: "1.5px solid var(--color-navy)", background: "var(--color-mist)" } : { border: "1px solid var(--color-line)", background: "#fff" }}
            >
              <span className="text-navy" style={{ font: "600 13.5px var(--font-sans)" }}>
                {label}
              </span>
              <span className="text-muted" style={{ font: "400 12px/1.4 var(--font-sans)" }}>
                {desc}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))" }}>
        <label className="p-label">
          <span>Full name *</span>
          <input name="name" required maxLength={150} autoComplete="name" className="p-input" style={{ height: 46 }} />
        </label>
        <label className="p-label">
          <span>Position *</span>
          <input name="position" required maxLength={150} autoComplete="organization-title" className="p-input" style={{ height: 46 }} />
        </label>
        {type === "institution" ? (
          <>
            <label className="p-label col-span-full">
              <span>Institution *</span>
              <input name="org" required maxLength={200} autoComplete="organization" className="p-input" style={{ height: 46 }} />
            </label>
            <div className="col-span-full flex flex-col gap-[7px]">
              <label className="p-label">
                <span>Inquiry reference</span>
                <input name="ref" defaultValue={initialRef} placeholder="ACC-2026-0000" maxLength={40} className="p-input" style={{ height: 46 }} aria-describedby="ref-hint" />
              </label>
              <span id="ref-hint" className="text-muted" style={{ font: "400 12.5px/1.5 var(--font-sans)" }}>
                If you have already submitted an inquiry (ACC-…) or a program application (PRG-…), enter its reference to link your account.
              </span>
            </div>
          </>
        ) : (
          <label className="p-label col-span-full">
            <span>Area of expertise *</span>
            <input name="org" required maxLength={200} placeholder="e.g. Academic governance" className="p-input" style={{ height: 46 }} />
          </label>
        )}
        <label className="p-label col-span-full">
          <span>Official email *</span>
          <input name="email" type="email" required autoComplete="email" className="p-input" style={{ height: 46 }} />
        </label>
        <div className="flex flex-col gap-[7px]">
          <label className="p-label">
            <span>Password *</span>
            <input name="password" type="password" required minLength={10} autoComplete="new-password" className="p-input" style={{ height: 46 }} aria-describedby="pw-hint" />
          </label>
          <span id="pw-hint" className="text-muted" style={{ font: "400 12.5px/1.5 var(--font-sans)" }}>
            At least 10 characters, with letters and numbers.
          </span>
        </div>
        <label className="p-label">
          <span>Confirm password *</span>
          <input name="confirm" type="password" required autoComplete="new-password" className="p-input" style={{ height: 46 }} />
        </label>
      </div>
      <label className="flex cursor-pointer items-start gap-2.5" style={{ font: "400 13.5px/1.55 var(--font-sans)" }}>
        <input type="checkbox" name="agree" required className="mt-[3px] h-4 w-4 flex-none" style={{ accentColor: "var(--color-navy)" }} />
        <span>
          I confirm the information is accurate and accept the{" "}
          <a href="/terms" target="_blank" rel="noopener">
            Terms of Use
          </a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" rel="noopener">
            Privacy Notice
          </a>
          .
        </span>
      </label>
      <button type="submit" disabled={pending} className="p-btn" style={{ padding: 14, fontSize: 15 }}>
        {pending ? "Submitting…" : "Submit account request"}
      </button>
      <p className="m-0 text-center text-muted" style={{ font: "400 14px var(--font-sans)" }}>
        Already have an account?{" "}
        <Link href="/portal/sign-in" className="link-plain" style={{ fontSize: 13.5 }}>
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [state, onSubmit, pending] = useFormAction(forgotPassword);
  if (state?.ok) return <Done title="Check your email">If an active account exists for {state.message}, a password reset link has been sent. The link expires in 60 minutes.</Done>;
  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-[440px] flex-col gap-5">
      <Heading title="Reset your password" sub="Enter the email linked to your account. We will send a secure link to choose a new password." />
      <Err msg={state && !state.ok ? state.error : undefined} />
      <label className="p-label">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" className="p-input" style={{ height: 46 }} />
      </label>
      <button type="submit" disabled={pending} className="p-btn" style={{ padding: 14, fontSize: 15 }}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <p className="m-0 text-center">
        <Link href="/portal/sign-in" className="link-plain" style={{ fontSize: 13.5 }}>
          ← Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, onSubmit, pending] = useFormAction(resetPassword);
  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-[440px] flex-col gap-5">
      <Heading title="Choose a new password" sub="Use at least 10 characters, with letters and numbers. Other devices will be signed out." />
      <Err msg={state && !state.ok ? state.error : undefined} />
      <input type="hidden" name="token" value={token} />
      <label className="p-label">
        <span>New password</span>
        <input name="password" type="password" required minLength={10} autoComplete="new-password" className="p-input" style={{ height: 46 }} />
      </label>
      <label className="p-label">
        <span>Confirm new password</span>
        <input name="confirm" type="password" required autoComplete="new-password" className="p-input" style={{ height: 46 }} />
      </label>
      <button type="submit" disabled={pending} className="p-btn" style={{ padding: 14, fontSize: 15 }}>
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
