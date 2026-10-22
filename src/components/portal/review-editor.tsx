"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { Rating } from "@/db/schema";
import { RATING_LABELS } from "@/lib/domain";
import { confirmCoi, declareConflict, saveComment, saveRating, saveSummary, submitReview } from "@/server/actions/reviews";
import { useToast } from "./toast";

type Props = { reviewId: string; ratings: (Rating | "")[]; comments: string[]; summary: string; titles: string[] };

/** Debounced autosave for free text. */
function useAutosave(save: (v: string) => Promise<{ ok: boolean; error?: string }>) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<"" | "saving" | "saved" | "error">("");
  const toast = useToast();
  const schedule = (v: string) => {
    if (timer.current) clearTimeout(timer.current);
    setState("saving");
    timer.current = setTimeout(async () => {
      const r = await save(v);
      setState(r.ok ? "saved" : "error");
      if (!r.ok && r.error) toast(r.error, true);
    }, 700);
  };
  return { state, schedule };
}

function CommentBox({ reviewId, index, initial, title }: { reviewId: string; index: number; initial: string; title: string }) {
  const [v, setV] = useState(initial);
  const { state, schedule } = useAutosave((t) => saveComment(reviewId, index, t));
  return (
    <div className="flex flex-col gap-1 pl-[38px]">
      <textarea
        rows={2}
        value={v}
        onChange={(e) => {
          setV(e.target.value);
          schedule(e.target.value);
        }}
        placeholder="Evidence reviewed and findings…"
        aria-label={`Comment on ${title}`}
        className="p-textarea"
        style={{ fontSize: 14 }}
      />
      <span className="h-4 self-end text-muted" style={{ font: "400 11.5px var(--font-sans)" }} aria-live="polite">
        {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : ""}
      </span>
    </div>
  );
}

/** Ratings, comments and summary for one review (editable until submitted). */
export function ReviewEditor({ reviewId, ratings: initialRatings, comments, summary: initialSummary, titles: STANDARD_TITLES }: Props) {
  const [ratings, setRatings] = useState(initialRatings);
  const [summary, setSummary] = useState(initialSummary);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const sum = useAutosave((t) => saveSummary(reviewId, t));
  const rated = ratings.filter(Boolean).length;

  const pick = (i: number, k: Rating) => {
    const prev = ratings;
    const next = [...ratings];
    next[i] = k;
    setRatings(next);
    start(async () => {
      const r = await saveRating(reviewId, i, k);
      if (!r.ok) {
        setRatings(prev);
        toast(r.error, true);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-3">
        {STANDARD_TITLES.map((t, i) => (
          <section key={t} aria-labelledby={`std-${i}`} className="flex flex-col gap-3 rounded border border-line bg-white px-[22px] py-5">
            <div className="flex items-baseline gap-3">
              <span className="w-[26px]" style={{ font: "500 20px/1 var(--font-serif)", color: "var(--color-steel)" }}>
                {i + 1}
              </span>
              <h3 id={`std-${i}`} className="m-0 text-navy" style={{ font: "600 15.5px/1.35 var(--font-serif)" }}>
                {t}
              </h3>
            </div>
            <div role="radiogroup" aria-labelledby={`std-${i}`} className="flex flex-wrap gap-1.5 pl-[38px]">
              {(Object.keys(RATING_LABELS) as Rating[]).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={ratings[i] === k} onClick={() => pick(i, k)} className="choice">
                  {RATING_LABELS[k]}
                </button>
              ))}
            </div>
            <CommentBox reviewId={reviewId} index={i} initial={comments[i] ?? ""} title={t} />
          </section>
        ))}
      </div>
      <aside className="sticky top-5 flex min-w-0 flex-[1_1_300px] flex-col gap-4">
        <section className="flex flex-col gap-3 rounded border border-line bg-white p-[22px]">
          <h2 className="p-h3">Summary and recommendation</h2>
          <textarea
            rows={6}
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              sum.schedule(e.target.value);
            }}
            placeholder="Overall findings and recommendation to the Commission…"
            aria-label="Summary and recommendation"
            className="p-textarea"
          />
          <span className="text-muted" style={{ font: "400 12.5px/1.5 var(--font-sans)" }}>
            {rated} of 12 standards rated. All twelve must be rated before submission. Changes save automatically{sum.state === "saving" ? " — saving…" : sum.state === "saved" ? " — saved." : "."}
          </span>
          <button
            type="button"
            className="p-btn"
            disabled={pending}
            onClick={() => {
              if (rated < 12) return toast(`Rate all twelve standards before submitting (${rated} of 12).`, true);
              if (!summary.trim()) return toast("Add an overall summary and recommendation.", true);
              if (!window.confirm("Submit the review report? It cannot be edited afterwards.")) return;
              start(async () => {
                await saveSummary(reviewId, summary);
                const r = await submitReview(reviewId);
                if (r.ok) {
                  toast(r.message ?? "Submitted");
                  router.refresh();
                } else toast(r.error, true);
              });
            }}
          >
            Submit review report
          </button>
        </section>
      </aside>
    </div>
  );
}

/** Conflict-of-interest declaration shown before an evaluation opens. */
export function CoiDeclaration({ reviewId }: { reviewId: string }) {
  const [checked, setChecked] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (fn: () => Promise<{ ok: true; message?: string } | { ok: false; error: string }>, back?: boolean) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (r.message) toast(r.message);
        if (back) router.push("/portal/reviews");
        else router.refresh();
      } else toast(r.error, true);
    });
  return (
    <section className="flex max-w-[760px] flex-col gap-4 rounded border border-line bg-white p-7">
      <span className="p-eyebrow">Before you begin</span>
      <h2 className="m-0 text-navy" style={{ font: "500 22px/1.25 var(--font-serif)" }}>
        Conflict-of-interest declaration
      </h2>
      <p className="m-0" style={{ font: "400 15px/1.65 var(--font-sans)" }}>
        Individuals involved in evaluation shall disclose actual, potential, or perceived conflicts of interest and recuse themselves when required. Nonpublic institutional information must be kept confidential.
      </p>
      <label className="flex cursor-pointer items-start gap-3 rounded-[3px] border border-line bg-mist p-4" style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-[3px] h-4 w-4 flex-none" style={{ accentColor: "var(--color-navy)" }} />
        <span>I confirm that I have no actual, potential, or perceived conflict of interest with this institution, and I will treat all evaluation information as confidential.</span>
      </label>
      <div className="flex flex-wrap gap-2.5">
        <button type="button" className="p-btn" disabled={pending} onClick={() => (checked ? run(() => confirmCoi(reviewId)) : toast("Confirm the declaration to continue.", true))}>
          Confirm and open evaluation
        </button>
        <button type="button" className="p-btn-secondary" disabled={pending} onClick={() => window.confirm("Declare a conflict of interest and withdraw from this review?") && run(() => declareConflict(reviewId), true)}>
          I have a conflict
        </button>
      </div>
    </section>
  );
}
