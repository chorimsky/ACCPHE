"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/action";
import { useToast } from "./toast";

function useRun() {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (fn: () => Promise<ActionResult>, after?: (r: ActionResult) => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (r.message) toast(r.message);
        router.refresh();
      } else toast(r.error, true);
      after?.(r);
    });
  return { pending, run };
}

/** A select that saves on change. */
export function SaveSelect({
  value,
  options,
  onSave,
  label,
  className = "p-select",
}: {
  value: string;
  options: { value: string; label: string }[];
  onSave: (v: string) => Promise<ActionResult>;
  label: string;
  className?: string;
}) {
  const { pending, run } = useRun();
  const [v, setV] = useState(value);
  return (
    <select
      aria-label={label}
      value={v}
      disabled={pending}
      className={className}
      onChange={(e) => {
        const nv = e.target.value;
        const prev = v;
        setV(nv);
        run(
          () => onSave(nv),
          (r) => !r.ok && setV(prev),
        );
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** A checklist item that saves when ticked. */
export function CheckItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => Promise<ActionResult> }) {
  const { pending, run } = useRun();
  const [on, setOn] = useState(checked);
  return (
    <label className="flex cursor-pointer items-start gap-3 border-t border-cloud px-4 py-3 hover:bg-[#FAFBFC]" style={{ font: "400 14px/1.5 var(--font-sans)" }}>
      <input
        type="checkbox"
        checked={on}
        disabled={pending}
        onChange={() => {
          setOn(!on);
          run(onToggle, (r) => !r.ok && setOn(on));
        }}
        className="mt-[3px] h-4 w-4 flex-none"
        style={{ accentColor: "var(--color-navy)" }}
      />
      <span>{label}</span>
    </label>
  );
}

/** "Upload" control: picking a file sends it immediately. */
export function UploadButton({ onUpload, label = "Upload", accept }: { onUpload: (fd: FormData) => Promise<ActionResult>; label?: string; accept?: string }) {
  const { pending, run } = useRun();
  const input = useRef<HTMLInputElement>(null);
  return (
    <label className="cursor-pointer whitespace-nowrap rounded-[3px] border border-line-strong px-[11px] py-[7px] text-navy hover:border-navy" style={{ font: "600 12.5px var(--font-sans)", opacity: pending ? 0.6 : 1 }}>
      {pending ? "Uploading…" : label}
      <input
        ref={input}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={pending}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const fd = new FormData();
          fd.set("file", f);
          run(
            () => onUpload(fd),
            () => {
              if (input.current) input.current.value = "";
            },
          );
        }}
      />
    </label>
  );
}

/** Pick a person from a list and run an action with their id (appoint reviewer, link application…). */
export function PickAndRun({ options, onRun, placeholder, button }: { options: { value: string; label: string }[]; onRun: (id: string) => Promise<ActionResult>; placeholder: string; button: string }) {
  const { pending, run } = useRun();
  const [v, setV] = useState("");
  return (
    <div className="flex flex-wrap gap-2">
      <select aria-label={placeholder} value={v} onChange={(e) => setV(e.target.value)} className="p-select min-w-0 flex-[1_1_200px]">
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button type="button" className="p-btn-secondary" disabled={!v || pending} onClick={() => run(() => onRun(v), (r) => r.ok && setV(""))}>
        {button}
      </button>
    </div>
  );
}

/** Advance button that warns when the stage checklist is incomplete. */
export function AdvanceButton({ label, done, total, onAdvance }: { label: string; done: number; total: number; onAdvance: () => Promise<ActionResult> }) {
  const { pending, run } = useRun();
  return (
    <button
      type="button"
      className="p-btn"
      disabled={pending}
      onClick={() => {
        if (done < total && !window.confirm(`The stage checklist is incomplete (${done} of ${total}). Advance anyway?`)) return;
        run(onAdvance);
      }}
    >
      {label}
    </button>
  );
}
