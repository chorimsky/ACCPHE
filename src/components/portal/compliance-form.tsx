"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { COMPLIANCE_TYPES } from "@/db/schema";
import { submitCompliance } from "@/server/actions/institution";
import { useToast } from "./toast";

const HINT: Record<(typeof COMPLIANCE_TYPES)[number], string> = {
  "Annual report": "Report on compliance with the standards, institutional performance, and progress on any conditions.",
  "Substantive change notification": "Disclose material changes — governance, ownership, programs, locations, or delivery — before or as they occur.",
};

export function ComplianceForm() {
  const [type, setType] = useState<(typeof COMPLIANCE_TYPES)[number]>("Annual report");
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <div className="flex flex-col gap-3.5">
      <div role="radiogroup" aria-label="Type of submission" className="flex flex-wrap gap-2">
        {COMPLIANCE_TYPES.map((k) => (
          <button key={k} type="button" role="radio" aria-checked={type === k} onClick={() => setType(k)} className="choice" style={{ padding: "8px 14px", fontSize: 13 }}>
            {k}
          </button>
        ))}
      </div>
      <span className="text-slate" style={{ font: "400 13px/1.5 var(--font-sans)" }}>
        {HINT[type]}
      </span>
      <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Summary of the report or change…" aria-label="Summary" className="p-textarea" />
      <div>
        <button
          type="button"
          className="p-btn"
          disabled={pending}
          onClick={() =>
            start(async () => {
              if (!text.trim()) return toast("Write a summary first.", true);
              const r = await submitCompliance(type, text);
              if (r.ok) {
                setText("");
                toast(r.message ?? "Submitted");
                router.refresh();
              } else toast(r.error, true);
            })
          }
        >
          Submit to the Secretariat
        </button>
      </div>
    </div>
  );
}
