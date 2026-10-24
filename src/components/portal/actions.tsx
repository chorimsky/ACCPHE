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
