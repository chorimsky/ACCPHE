"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ActionResult, ActionState } from "@/lib/action";
import { useFormAction } from "@/components/ui/use-form-action";
import { useToast } from "./toast";

/** Run a server action from a button: optional confirmation, pending state, and a toast with the result. */
export function ActionButton({
  action,
  confirm,
  className = "p-btn",
  children,
  pendingLabel,
  onDone,
  disabled,
  title,
}: {
  action: () => Promise<ActionResult>;
  confirm?: string;
  className?: string;
  children: React.ReactNode;
  pendingLabel?: string;
  onDone?: (r: ActionResult) => void;
  disabled?: boolean;
  title?: string;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      disabled={pending || disabled}
      title={title}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const r = await action();
          if (r.ok) {
            if (r.message) toast(r.message);
            router.refresh();
          } else toast(r.error, true);
          onDone?.(r);
        });
      }}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

/** A portal form bound to a server action (errors and success are shown as toasts and inline). */
export function PortalForm({
  action,
  children,
  className,
  onSuccess,
  inlineError = true,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: (pending: boolean) => React.ReactNode;
  className?: string;
  onSuccess?: (r: ActionResult) => void;
  inlineError?: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const [state, onSubmit, pending] = useFormAction(async (prev, fd) => {
    const r = await action(prev, fd);
    if (r?.ok) {
      if (r.message) toast(r.message);
      onSuccess?.(r);
      router.refresh();
    } else if (r && !inlineError) toast(r.error, true);
    return r;
  });
  return (
    <form onSubmit={onSubmit} className={className}>
      {inlineError && state && !state.ok && (
        <div role="alert" className="alert-error">
          {state.error}
        </div>
      )}
      {children(pending)}
    </form>
  );
}

/** Text box + buttons that send its content to one of several actions (notes, messages). */
export function NoteComposer({
  placeholder,
  buttons,
  rows = 3,
}: {
  placeholder: string;
  rows?: number;
  buttons: { label: string; primary?: boolean; run: (text: string) => Promise<ActionResult> }[];
}) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <div className="flex flex-col gap-3">
      <textarea rows={rows} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="p-textarea" />
      <div className="flex flex-wrap gap-2">
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            disabled={pending}
            className={b.primary ? "p-btn" : "p-btn-secondary"}
            onClick={() =>
              start(async () => {
                if (!text.trim()) {
                  toast("Write something first.", true);
                  return;
                }
                const r = await b.run(text);
                if (r.ok) {
                  setText("");
                  if (r.message) toast(r.message);
                  router.refresh();
                } else toast(r.error, true);
              })
            }
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * "Password link" for an account. When email is delivered the link goes to the person; when it is not (email delivery
 * off, or Resend not configured yet) the server returns the one-time link so the administrator can pass it on.
 */
export function PasswordLinkButton({ action, name, emailOn }: { action: () => Promise<ActionResult>; name: string; emailOn: boolean }) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex flex-col items-end gap-2">
      <ActionButton
        action={action}
        className="p-link"
        confirm={emailOn ? `Email ${name} a link to choose a new password?` : `Create a one-time password link for ${name}? You will need to send it to them yourself.`}
        onDone={(r) => {
          setCopied(false);
          setLink(r.ok && typeof r.data?.link === "string" ? r.data.link : null);
        }}
      >
        Password link
      </ActionButton>
      {link && (
        <span className="flex max-w-[420px] items-center gap-2 rounded border border-line bg-mist px-2.5 py-1.5" style={{ font: "500 12.5px/1.4 var(--font-sans)" }}>
          <input readOnly value={link} aria-label={`One-time password link for ${name}`} className="min-w-0 flex-1 bg-transparent text-navy outline-none" onFocus={(e) => e.currentTarget.select()} />
          <button
            type="button"
            className="p-link"
            onClick={() => {
              void navigator.clipboard?.writeText(link);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </span>
      )}
    </span>
  );
}

/** A strong random password (letters and digits, no look-alike characters). */
function generatePassword(length = 16): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  const pw = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  // Guarantee at least one letter and one digit (the password policy).
  return /\d/.test(pw) && /[a-z]/i.test(pw) ? pw : generatePassword(length);
}

/** Administrators set a person's password by hand (Users & access). */
export function SetPasswordButton({ action, name }: { action: (password: string, requireChange: boolean) => Promise<ActionResult>; name: string }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [requireChange, setRequireChange] = useState(true);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const reset = () => {
    setOpen(false);
    setPw("");
    setConfirm("");
    setShow(false);
    setRequireChange(true);
  };
  if (!open)
    return (
      <button type="button" className="p-link" onClick={() => setOpen(true)}>
        Set password
      </button>
    );
  const field = { type: show ? "text" : "password", autoComplete: "new-password", className: "p-input", style: { height: 36, fontSize: 13.5 } } as const;
  return (
    <div role="group" aria-label={`Set a password for ${name}`} className="flex w-[320px] max-w-full flex-col gap-2.5 rounded border border-line bg-mist p-3.5 text-left">
      <label className="p-label">
        <span>New password for {name}</span>
        <input {...field} value={pw} onChange={(e) => setPw(e.target.value)} />
      </label>
      <label className="p-label">
        <span>Confirm the password</span>
        <input {...field} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </label>
      <div className="flex flex-wrap items-center gap-3" style={{ font: "500 12.5px var(--font-sans)" }}>
        <button
          type="button"
          className="p-link"
          onClick={() => {
            const g = generatePassword();
            setPw(g);
            setConfirm(g);
            setShow(true);
          }}
        >
          Generate
        </button>
        <button type="button" className="p-link" onClick={() => setShow((v) => !v)}>
          {show ? "Hide" : "Show"}
        </button>
        <span className="text-muted">At least 10 characters, with letters and numbers.</span>
      </div>
      <label className="flex cursor-pointer items-start gap-2" style={{ font: "400 13px/1.45 var(--font-sans)" }}>
        <input type="checkbox" checked={requireChange} onChange={(e) => setRequireChange(e.target.checked)} className="mt-[2px] h-4 w-4 flex-none" style={{ accentColor: "var(--color-navy)" }} />
        <span>Require a new password at next sign-in</span>
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          className="p-btn"
          style={{ padding: "8px 14px", fontSize: 13 }}
          disabled={pending}
          onClick={() => {
            if (pw !== confirm) return toast("The two passwords do not match.", true);
            start(async () => {
              const r = await action(pw, requireChange);
              if (r.ok) {
                toast(r.message ?? "Password set");
                reset();
                router.refresh();
              } else toast(r.error, true);
            });
          }}
        >
          {pending ? "Setting…" : "Set password"}
        </button>
        <button type="button" className="p-btn-secondary" style={{ padding: "8px 14px", fontSize: 13 }} onClick={reset}>
          Cancel
        </button>
      </div>
    </div>
  );
}
