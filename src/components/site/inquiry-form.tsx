"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormAction } from "@/components/ui/use-form-action";
import { submitInquiry } from "@/server/actions/public";

const PATHWAYS: { t: string; d: string }[] = [
  { t: "Associate Membership", d: "Preparatory development framework. Not an accreditation award." },
  { t: "Accreditation", d: "Formal evaluation against the twelve institutional standards." },
  { t: "Distinguished Membership inquiry", d: "Recognition of exceptional leadership or contribution." },
];

const QUESTIONS: [string, string, string[]][] = [
  ["q1", "Is your institution legally established and authorized to provide higher education in its jurisdiction?", ["Yes", "No"]],
  ["q2", "Can you already evidence compliance with the twelve standards through documented policies and practice?", ["Yes, ready for evaluation", "Not yet"]],
  ["q3", "Are you also seeking recognition of exceptional leadership, innovation, or contribution?", ["Yes", "No"]],
];

const NEXT_STEPS = [
  { t: "Acknowledgement", d: "Your inquiry is logged under the reference above and assigned to the Secretariat." },
  { t: "Orientation", d: "The Secretariat shares the Council’s standards, eligibility requirements, application procedures, and applicable fees." },
  { t: "Preliminary eligibility review", d: "Foundational institutional documents are reviewed to confirm whether the institution may proceed to formal application." },
];

function suggest(pf: Record<string, string>) {
  if (pf.q1 === "No") return { title: "Speak with the Secretariat first", text: "Legal establishment and authorization are prerequisites for every pathway. The Secretariat can explain the requirements before you apply.", path: "", contact: true };
  if (!(pf.q1 && pf.q2 && pf.q3)) return null;
  if (pf.q3 === "Yes" && pf.q2 !== "Not yet")
    return { title: "Accreditation, with a Distinguished Membership inquiry", text: "Begin with an inquiry noting both interests. Distinguished Membership is a separate designation and is not part of the accreditation evaluation.", path: "Distinguished Membership inquiry", contact: false };
  if (pf.q2 === "Not yet") return { title: "Associate Membership", text: "The preparatory framework offers standards orientation and readiness guidance before a full evaluation. It is not an accreditation award.", path: "Associate Membership", contact: false };
  return { title: "Accreditation", text: "Your institution appears ready to begin the eight-stage evaluation pathway, starting with a preliminary eligibility review.", path: "Accreditation", contact: false };
}

function Legend({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <legend className="flex items-center gap-3.5 pb-[22px] text-navy" style={{ font: "500 25px var(--font-serif)" }}>
      <span aria-hidden="true" className="inline-grid h-[34px] w-[34px] place-items-center rounded-full" style={{ border: "1.5px solid var(--color-navy)", font: "600 15px var(--font-serif)" }}>
        {n}
      </span>
      {children}
    </legend>
  );
}

export function InquiryForm({ types, maxLabel }: { types: string[]; maxLabel: string }) {
  const [state, onSubmit, pending] = useFormAction(submitInquiry);
  const [pf, setPf] = useState<Record<string, string>>({});
  const [pathway, setPathway] = useState("");
  const top = useRef<HTMLDivElement>(null);
  const result = suggest(pf);

  useEffect(() => {
    if (state) top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state]);

  if (state?.ok) {
    return (
      <div ref={top} role="status" className="box box-top flex scroll-mt-28 flex-col gap-4" style={{ padding: "clamp(32px,5vw,52px)" }}>
        <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full bg-navy text-mist" style={{ font: "600 20px var(--font-sans)" }}>
          ✓
        </span>
        <span className="caps">Inquiry received</span>
        <h2 className="m-0 text-navy" style={{ font: "500 clamp(26px,3vw,34px)/1.2 var(--font-serif)" }}>
          Thank you for contacting ACCPHE.
        </h2>
        <div className="flex flex-wrap items-baseline gap-3.5 border border-line bg-mist px-[18px] py-3.5">
          <span className="caps-sm" style={{ fontSize: 11.5 }}>
            Your reference
          </span>
          <span style={{ font: "600 18px var(--font-serif)", color: "var(--color-navy)", letterSpacing: ".04em" }}>{String(state.data?.ref ?? "")}</span>
        </div>
        <p className="body-lg">
          Your institutional inquiry has been received. The Secretariat will review the information submitted and communicate the next steps through the contact details provided. A confirmation has been sent to
          your institutional email.
        </p>
        <ol className="m-0 mt-2 flex list-none flex-col border-t border-line p-0">
          {NEXT_STEPS.map((n, i) => (
            <li key={n.t} className="grid grid-cols-[40px_1fr] gap-3 border-b border-line py-4">
              <span className="grid h-[30px] w-[30px] place-items-center rounded-full text-navy" style={{ border: "1.5px solid var(--color-navy)", font: "600 13px var(--font-serif)" }}>
                {i + 1}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-navy" style={{ font: "600 15px var(--font-sans)" }}>
                  {n.t}
                </span>
                <span style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>{n.d}</span>
              </div>
            </li>
          ))}
        </ol>
        <p className="m-0" style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>
          Keep your reference for all correspondence. To follow progress online, <Link href={`/portal/register?ref=${encodeURIComponent(String(state.data?.ref ?? ""))}`}>request an Institution Portal account</Link>{" "}
          quoting this reference.
        </p>
        <div className="pt-1.5">
          <Link href="/" className="link-arrow">
            Return to the homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-12" noValidate={false}>
      <div ref={top} className="scroll-mt-28">
        {state && !state.ok && (
          <div role="alert" className="alert-error" style={{ fontSize: 14.5 }}>
            {state.error}
          </div>
        )}
      </div>

      <section aria-labelledby="pf-title" className="flex flex-col border border-line bg-mist">
        <div className="flex flex-col gap-1.5 px-[26px] pb-1.5 pt-6">
          <span className="caps">Not sure where to start?</span>
          <h2 id="pf-title" className="m-0 text-navy" style={{ font: "500 24px/1.2 var(--font-serif)" }}>
            Find the right pathway
          </h2>
          <p className="m-0 text-muted" style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>
            Answer three questions. This guidance is indicative — the Secretariat confirms eligibility after review.
          </p>
        </div>
        <ol className="m-0 flex list-none flex-col px-[26px] pb-1 pt-2">
          {QUESTIONS.map(([k, q, opts], i) => (
            <li key={k} className="grid grid-cols-[30px_1fr] gap-3 border-t border-line py-4">
              <span style={{ font: "500 16px/1.5 var(--font-serif)", color: "var(--color-steel)" }}>{i + 1}</span>
              <div className="flex flex-col gap-2.5" role="group" aria-label={q}>
                <span className="text-navy" style={{ font: "500 15px/1.5 var(--font-sans)" }}>
                  {q}
                </span>
                <div className="flex flex-wrap gap-2">
                  {opts.map((o) => (
                    <button
                      key={o}
                      type="button"
                      aria-pressed={pf[k] === o}
                      onClick={() => setPf((s) => ({ ...s, [k]: o }))}
                      className="choice"
                      style={{ borderRadius: 2, padding: "9px 16px", font: "600 13.5px var(--font-sans)" }}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div aria-live="polite">
          {result && (
            <div className="dark mx-[26px] mb-[26px] mt-1 flex flex-wrap items-center justify-between gap-4 px-[22px] py-5">
              <div className="flex flex-[1_1_320px] flex-col gap-1.5">
                <span className="caps-sm text-haze">Suggested pathway</span>
                <span style={{ font: "500 21px/1.25 var(--font-serif)" }}>{result.title}</span>
                <span className="text-fog" style={{ font: "400 14px/1.55 var(--font-sans)" }}>
                  {result.text}
                </span>
              </div>
              {result.path && (
                <button
                  type="button"
                  onClick={() => {
                    setPathway(result.path);
                    document.getElementById("pathway-field")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="btn btn-light"
                  style={{ padding: "12px 18px", fontSize: 14 }}
                >
                  Use this pathway
                </button>
              )}
              {result.contact && (
                <Link href="/contact?topic=membership" className="btn btn-light" style={{ padding: "12px 18px", fontSize: 14 }}>
                  Contact the Secretariat
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <p className="m-0 text-muted" style={{ font: "400 14px var(--font-sans)" }}>
        All fields marked <span className="font-semibold text-navy">*</span> are required.
      </p>

      <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
        <Legend n={1}>Institution</Legend>
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))" }}>
          <label className="field col-span-full">
            <span>Legal institution name *</span>
            <input name="name" required maxLength={200} autoComplete="organization" className="input" />
          </label>
          <label className="field">
            <span>Country of establishment *</span>
            <input name="country" required maxLength={100} autoComplete="country-name" className="input" />
          </label>
          <label className="field">
            <span>Year of establishment *</span>
            <input name="year" required inputMode="numeric" pattern="\d{4}" maxLength={4} placeholder="YYYY" className="input" />
          </label>
          <label className="field">
            <span>Official website *</span>
            <input name="website" required type="url" placeholder="https://" className="input" />
          </label>
          <label className="field">
            <span>Institution type *</span>
            <select name="type" required defaultValue="" className="select">
              <option value="">Select…</option>
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <div className="col-span-full flex flex-col gap-2">
            <label className="field">
              <span>Government authorization or registration reference *</span>
              <input name="authRef" required maxLength={200} className="input" aria-describedby="authref-hint" />
            </label>
            <span id="authref-hint" className="hint">
              The reference number issued by the competent authority in your jurisdiction.
            </span>
          </div>
        </div>
      </fieldset>

      <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
        <Legend n={2}>Institutional representative</Legend>
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))" }}>
          <label className="field">
            <span>Full name *</span>
            <input name="repName" required maxLength={150} autoComplete="name" className="input" />
          </label>
          <label className="field">
            <span>Position *</span>
            <input name="repPosition" required maxLength={150} autoComplete="organization-title" className="input" />
          </label>
          <label className="field">
            <span>Official institutional email *</span>
            <input name="repEmail" required type="email" autoComplete="email" className="input" />
          </label>
          <label className="field">
            <span>Telephone number *</span>
            <input name="repPhone" required type="tel" autoComplete="tel" maxLength={60} className="input" />
          </label>
        </div>
      </fieldset>

      <fieldset className="m-0 flex flex-col gap-[18px] border-0 p-0">
        <Legend n={3}>Pathway and profile</Legend>
        <div role="radiogroup" aria-labelledby="pathway-field" className="flex flex-col gap-[18px]">
          <span id="pathway-field" className="scroll-mt-32 text-navy" style={{ font: "600 13.5px var(--font-sans)" }}>
            Interested pathway *
          </span>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,230px),1fr))" }}>
            {PATHWAYS.map((p) => {
              const on = pathway === p.t;
              return (
                <label
                  key={p.t}
                  className="flex cursor-pointer flex-col gap-2 p-5 transition-colors"
                  style={on ? { border: "1.5px solid var(--color-navy)", background: "var(--color-mist)", boxShadow: "0 0 0 3px rgba(69,98,124,.14)" } : { border: "1px solid var(--color-line-strong)" }}
                >
                  <span className="flex items-center gap-2.5 text-navy" style={{ font: "600 15px/1.35 var(--font-sans)" }}>
                    <input type="radio" name="pathway" required value={p.t} checked={on} onChange={() => setPathway(p.t)} aria-label={p.t} aria-describedby={`pathway-${p.t.split(" ")[0]}-desc`} className="m-0 h-4 w-4" style={{ accentColor: "var(--color-navy)" }} />
                    {p.t}
                  </span>
                  <span id={`pathway-${p.t.split(" ")[0]}-desc`} className="text-slate" style={{ font: "400 13.5px/1.5 var(--font-sans)" }}>
                    {p.d}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
        <label className="field mt-2.5">
          <span>Brief institutional profile *</span>
          <textarea name="profile" required rows={6} maxLength={6000} placeholder="Mission, programs offered, student population, delivery model…" className="textarea" />
        </label>
        <div className="flex flex-col gap-2">
          <label className="field">
            <span>Supporting documents (if required)</span>
            <input
              name="documents"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              className="w-full rounded-[2px] border border-dashed border-steel bg-mist p-[18px] text-slate"
              style={{ font: "400 14px var(--font-sans)" }}
              aria-describedby="docs-hint"
            />
          </label>
          <span id="docs-hint" className="hint">
            PDF preferred. Up to 3 files, {maxLabel} in total. The Secretariat will advise if further documentation is required.
          </span>
        </div>
        {/* Honeypot for automated submissions; hidden from people and assistive technology. */}
        <div aria-hidden="true" className="absolute left-[-10000px] h-px w-px overflow-hidden">
          <label>
            Company website
            <input name="company_website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </fieldset>

      <fieldset className="m-0 flex flex-col gap-4 border border-line bg-mist p-[26px]">
        <legend className="px-2 text-navy" style={{ font: "600 13.5px var(--font-sans)" }}>
          Declarations *
        </legend>
        <label className="flex cursor-pointer items-start gap-3" style={{ font: "400 14.5px/1.62 var(--font-sans)" }}>
          <input type="checkbox" name="declareAccurate" required className="mt-1 h-4 w-4 flex-none" style={{ accentColor: "var(--color-navy)" }} />
          <span>I declare that the information submitted is accurate and complete to the best of my knowledge, and that I am authorized to submit this inquiry on behalf of the institution.</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3" style={{ font: "400 14.5px/1.62 var(--font-sans)" }}>
          <input type="checkbox" name="declarePrivacy" required className="mt-1 h-4 w-4 flex-none" style={{ accentColor: "var(--color-navy)" }} />
          <span>
            I acknowledge that the information provided will be processed by the ACCPHE Secretariat in accordance with the Council’s <Link href="/privacy">privacy policy</Link>.
          </span>
        </label>
      </fieldset>

      <div className="flex flex-wrap items-center gap-5 border-t border-line pt-2">
        <button type="submit" disabled={pending} className="btn btn-primary mt-6" style={{ padding: "17px 30px", fontSize: 15.5 }}>
          {pending ? "Submitting…" : "Submit Institutional Inquiry"}
        </button>
      </div>
    </form>
  );
}
