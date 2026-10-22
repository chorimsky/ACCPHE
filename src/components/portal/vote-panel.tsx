"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { VOTE_OPTIONS } from "@/lib/domain";
import { castVote, recuse } from "@/server/actions/decisions";
import { useToast } from "./toast";

/** The signed-in Commission member's vote on one application. */
export function VotePanel({ applicationId, myVote }: { applicationId: string; myVote: string | null }) {
  const [choice, setChoice] = useState("");
  const [note, setNote] = useState("");
  const [noConflict, setNoConflict] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const done = (r: { ok: true; message?: string } | { ok: false; error: string }) => {
    if (r.ok) {
      toast(r.message ?? "Saved");
      setChoice("");
      setNote("");
      setNoConflict(false);
      router.refresh();
    } else toast(r.error, true);
  };
  return (
    <section className="flex flex-col gap-3.5 rounded border border-line bg-white p-[22px]">
      <h2 className="p-h3">Your vote</h2>
      {myVote && (
        <div className="flex flex-col gap-1 rounded-[3px] border border-line bg-mist px-4 py-3.5">
          <span className="p-eyebrow">Recorded</span>
          <span className="text-navy" style={{ font: "600 15px var(--font-sans)" }}>
            {myVote}
          </span>
          <span className="text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
            You may change your vote below until the decision is recorded.
          </span>
        </div>
      )}
      <div role="radiogroup" aria-label="Vote" className="flex flex-col gap-1.5">
        {VOTE_OPTIONS.map((o) => {
          const on = choice === o;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setChoice(o)}
              className="flex items-center gap-2.5 rounded-[3px] px-[13px] py-[11px] text-left text-navy"
              style={on ? { border: "1.5px solid var(--color-navy)", background: "var(--color-mist)", font: "600 13.5px var(--font-sans)" } : { border: "1px solid var(--color-line)", background: "#fff", font: "500 13.5px var(--font-sans)" }}
            >
              <span aria-hidden="true" className="h-3.5 w-3.5 flex-none rounded-full" style={on ? { border: "4px solid var(--color-navy)" } : { border: "1.5px solid var(--color-line-strong)" }} />
              {o}
            </button>
          );
        })}
      </div>
      <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reasons (recorded in the deliberation record)…" aria-label="Reasons" className="p-textarea" />
      <label className="flex cursor-pointer items-start gap-2.5" style={{ font: "400 13px/1.5 var(--font-sans)" }}>
        <input type="checkbox" checked={noConflict} onChange={(e) => setNoConflict(e.target.checked)} className="mt-0.5 h-[15px] w-[15px] flex-none" style={{ accentColor: "var(--color-navy)" }} />
        <span>I have no conflict of interest with this institution.</span>
      </label>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          className="p-btn"
          disabled={pending}
          onClick={() => {
            if (!noConflict) return toast("Confirm you have no conflict of interest.", true);
            if (!choice) return toast("Select your vote.", true);
            start(async () => done(await castVote(applicationId, choice, note, noConflict)));
          }}
        >
          Record vote
        </button>
        <button
          type="button"
          className="p-btn-danger"
          disabled={pending}
          onClick={() => window.confirm("Recuse yourself from this decision?") && start(async () => done(await recuse(applicationId)))}
        >
          Recuse
        </button>
      </div>
    </section>
  );
}
