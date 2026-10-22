"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { BLOCK_BY_KEY, type Field } from "@/content/cms";
import { resetBlock, saveBlock } from "@/server/actions/content";
import { useToast } from "./toast";

type Obj = Record<string, unknown>;

/** Paragraph and line fields are edited as plain text and converted on save. */
const toText = (f: Field, v: unknown) => (f.type === "paragraphs" ? ((v as string[]) ?? []).join("\n\n") : f.type === "lines" ? ((v as string[]) ?? []).join("\n") : String(v ?? ""));
const fromText = (f: Field, v: string): unknown =>
  f.type === "paragraphs"
    ? v
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : f.type === "lines"
      ? v
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
      : v;

const formObj = (fields: Field[], v: Obj) => Object.fromEntries(fields.map((f) => [f.name, toText(f, v?.[f.name])]));
const valueObj = (fields: Field[], v: Record<string, string>) => Object.fromEntries(fields.map((f) => [f.name, fromText(f, v[f.name] ?? "")]));

function FieldInput({ f, value, onChange, idPrefix }: { f: Field; value: string; onChange: (v: string) => void; idPrefix: string }) {
  const id = `${idPrefix}-${f.name}`;
  const hint = "hint" in f && f.hint ? <span id={`${id}-hint`} className="text-muted" style={{ font: "400 12.5px/1.4 var(--font-sans)" }}>{f.hint}</span> : null;
  const described = "hint" in f && f.hint ? `${id}-hint` : undefined;
  let input: React.ReactNode;
  if (f.type === "text") input = <input id={id} value={value} maxLength={f.max} onChange={(e) => onChange(e.target.value)} className="p-input" aria-describedby={described} />;
  else if (f.type === "date") input = <input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} className="p-input max-w-[220px]" aria-describedby={described} />;
  else if (f.type === "select")
    input = (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="p-select" aria-describedby={described}>
        {f.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  else {
    const rows = f.type === "textarea" ? (f.rows ?? 3) : Math.min(16, Math.max(4, value.split("\n").length + 1));
    input = <textarea id={id} rows={rows} value={value} maxLength={f.type === "textarea" ? f.max : undefined} onChange={(e) => onChange(e.target.value)} className="p-textarea" aria-describedby={described} />;
  }
  return (
    <div className="flex flex-col gap-[7px]">
      <label htmlFor={id} className="text-navy" style={{ font: "600 13px/1.3 var(--font-sans)" }}>
        {f.label}
      </label>
      {input}
      {hint}
    </div>
  );
}

function Move({ i, n, move, remove, fixed }: { i: number; n: number; move: (from: number, to: number) => void; remove: (i: number) => void; fixed?: boolean }) {
  if (fixed) return null;
  return (
    <span className="flex items-center gap-3">
      <button type="button" className="p-link" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">
        ↑
      </button>
      <button type="button" className="p-link" disabled={i === n - 1} onClick={() => move(i, i + 1)} aria-label="Move down">
        ↓
      </button>
      <button type="button" className="p-btn-danger" style={{ padding: 0, fontSize: 13 }} onClick={() => remove(i)}>
        Remove
      </button>
    </span>
  );
}

export function BlockEditor({ blockKey, initial, customised }: { blockKey: string; initial: unknown; customised: boolean }) {
  const def = BLOCK_BY_KEY[blockKey];
  const b = def.block;
  const initialForm = useMemo(() => {
    if (b.kind === "object") return formObj(b.fields, initial as Obj);
    if (b.kind === "list") return (initial as Obj[]).map((v) => formObj(b.item, v));
    return [...(initial as string[])];
  }, [b, initial]);
  const [form, setForm] = useState<unknown>(initialForm);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const value = () => {
    if (b.kind === "object") return valueObj(b.fields, form as Record<string, string>);
    if (b.kind === "list") return (form as Record<string, string>[]).map((v) => valueObj(b.item, v));
    return (form as string[]).map((s) => s.trim()).filter(Boolean);
  };
  const arr = form as unknown[];
  const move = (from: number, to: number) => {
    const next = [...arr];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setForm(next);
  };
  const remove = (i: number) => setForm(arr.filter((_, j) => j !== i));
  const fixed = b.kind !== "object" && "fixed" in b && !!b.fixed;

  return (
    <div className="flex max-w-[900px] flex-col gap-5">
      {b.kind === "object" && (
        <section className="p-card flex flex-col gap-4">
          {b.fields.map((f) => (
            <FieldInput key={f.name} f={f} idPrefix={blockKey} value={(form as Record<string, string>)[f.name]} onChange={(v) => setForm({ ...(form as object), [f.name]: v })} />
          ))}
        </section>
      )}

      {b.kind === "list" &&
        (form as Record<string, string>[]).map((item, i) => (
          <details key={i} className="p-card" style={{ padding: 0 }} open={(form as unknown[]).length <= 4}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-navy" style={{ font: "600 15px var(--font-serif)" }}>
              <span>{b.itemLabel(valueObj(b.item, item), i) || `Entry ${i + 1}`}</span>
              <span className="flex items-center gap-4">
                <Move i={i} n={arr.length} move={move} remove={remove} fixed={fixed} />
                <span aria-hidden="true" className="text-slate" style={{ font: "600 12.5px var(--font-sans)" }}>
                  Edit ▾
                </span>
              </span>
            </summary>
            <div className="flex flex-col gap-4 border-t border-cloud px-5 py-5">
              {b.item.map((f) => (
                <FieldInput
                  key={f.name}
                  f={f}
                  idPrefix={`${blockKey}-${i}`}
                  value={item[f.name] ?? ""}
                  onChange={(v) => setForm((form as Record<string, string>[]).map((x, j) => (j === i ? { ...x, [f.name]: v } : x)))}
                />
              ))}
            </div>
          </details>
        ))}

      {b.kind === "strings" && (
        <section className="p-card flex flex-col gap-3">
          {(form as string[]).map((s, i) => (
            <div key={i} className="flex items-start gap-3 border-t border-cloud pt-3 first:border-t-0 first:pt-0">
              <span className="w-7 pt-2.5 text-steel" style={{ font: "500 15px var(--font-serif)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <textarea
                aria-label={`${b.itemLabel} ${i + 1}`}
                rows={2}
                value={s}
                onChange={(e) => setForm((form as string[]).map((x, j) => (j === i ? e.target.value : x)))}
                className="p-textarea flex-1"
              />
              <div className="pt-2.5">
                <Move i={i} n={arr.length} move={move} remove={remove} fixed={fixed} />
              </div>
            </div>
          ))}
        </section>
      )}

      {b.kind !== "object" && !fixed && (
        <div>
          <button
            type="button"
            className="p-btn-secondary"
            onClick={() => setForm([...arr, b.kind === "list" ? Object.fromEntries(b.item.map((f) => [f.name, ""])) : ""])}
          >
            + Add {b.kind === "strings" ? b.itemLabel.toLowerCase() : "entry"}
          </button>
        </div>
      )}
      {fixed && (
        <p className="small m-0" style={{ fontSize: 13 }}>
          This list has a fixed number of entries because the evaluation workflow depends on it. Entries can be reworded.
        </p>
      )}

      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-white px-[18px] py-3.5" style={{ boxShadow: "0 10px 28px rgba(20,43,69,.10)" }}>
        <span className="text-muted" style={{ font: "500 13.5px var(--font-sans)" }}>
          {dirty ? <span className="font-semibold text-warn">Unsaved changes</span> : customised ? "Showing the Council’s edited text" : "Showing the official text"}
        </span>
        <div className="flex flex-wrap gap-2.5">
          {customised && (
            <button
              type="button"
              className="p-btn-danger"
              disabled={pending}
              onClick={() =>
                window.confirm("Restore the official text for this section? Your edits will be discarded.") &&
                start(async () => {
                  const r = await resetBlock(blockKey);
                  if (r?.ok) {
                    toast(r.message ?? "Restored");
                    router.refresh();
                  } else if (r) toast(r.error, true);
                })
              }
            >
              Restore official text
            </button>
          )}
          <button type="button" className="p-btn-secondary" disabled={!dirty || pending} onClick={() => setForm(initialForm)}>
            Discard
          </button>
          <button
            type="button"
            className="p-btn"
            disabled={pending || !dirty}
            onClick={() =>
              start(async () => {
                const r = await saveBlock(blockKey, value());
                if (r?.ok) {
                  toast(r.message ?? "Saved");
                  router.refresh();
                } else if (r) toast(r.error, true);
              })
            }
          >
            {pending ? "Saving…" : "Save and publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
