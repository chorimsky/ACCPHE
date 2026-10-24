"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useFormAction } from "@/components/ui/use-form-action";
import { PROGRAM_CATEGORIES, PROGRAM_DELIVERY, PROVIDER_TYPES } from "@/lib/domain";
import { submitProgramApplication } from "@/server/actions/public";

const NEXT_STEPS = [
  { t: "Acknowledgement", d: "Your application is logged under the reference above and assigned to the Secretariat." },
  { t: "Documentation and self-evaluation", d: "The Secretariat confirms the program is within scope and requests the curriculum, learning outcomes, assessment procedures, instructor qualifications, and your self-evaluation." },
  { t: "Independent program review", d: "Qualified reviewers assess the program against the eight program evaluation standards." },
];

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

const grid = { gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))" };

export function ProgramApplicationForm({ maxLabel }: { maxLabel: string }) {
  const [state, onSubmit, pending] = useFormAction(submitProgramApplication);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state) top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state]);

  if (state?.ok) {
    const ref = String(state.data?.ref ?? "");
    return (
      <div ref={top} role="status" className="box box-top flex scroll-mt-28 flex-col gap-4" style={{ padding: "clamp(32px,5vw,52px)" }}>
        <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full bg-navy text-mist" style={{ font: "600 20px var(--font-sans)" }}>
          ✓
        </span>
        <span className="caps">Application received</span>
        <h2 className="m-0 text-navy" style={{ font: "500 clamp(26px,3vw,34px)/1.2 var(--font-serif)" }}>
          Thank you for applying for program accreditation.
        </h2>
        <div className="flex flex-wrap items-baseline gap-3.5 border border-line bg-mist px-[18px] py-3.5">
          <span className="caps-sm" style={{ fontSize: 11.5 }}>
            Your reference
          </span>
          <span style={{ font: "600 18px var(--font-serif)", color: "var(--color-navy)", letterSpacing: ".04em" }}>{ref}</span>
        </div>
        <p className="body-lg">
          The Secretariat will review your application and contact you through the details provided. A confirmation has been sent to your email.
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
          To follow the review and upload documents online, <Link href={`/portal/register?ref=${encodeURIComponent(ref)}`}>request a portal account</Link> quoting this reference.
        </p>
        <div className="pt-1.5">
          <Link href="/accreditation/programs" className="link-arrow">
            Return to Program Accreditation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-12">
      <div ref={top} className="scroll-mt-28">
        {state && !state.ok && (
          <div role="alert" className="alert-error" style={{ fontSize: 14.5 }}>
            {state.error}
          </div>
        )}
      </div>

      <p className="m-0 text-muted" style={{ font: "400 14px var(--font-sans)" }}>
        All fields marked <span className="font-semibold text-navy">*</span> are required. Submit one application per program.
      </p>

      <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
        <Legend n={1}>Program</Legend>
        <div className="grid gap-5" style={grid}>
          <label className="field col-span-full">
            <span>Program title *</span>
            <input name="programTitle" required maxLength={200} className="input" />
          </label>
          <label className="field col-span-full">
            <span>Program category *</span>
            <select name="programCategory" required defaultValue="" className="select">
              <option value="">Select…</option>
              {PROGRAM_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
              <option>Other</option>
            </select>
          </label>
          <label className="field">
            <span>Delivery mode *</span>
            <select name="programDelivery" required defaultValue="" className="select">
              <option value="">Select…</option>
              {PROGRAM_DELIVERY.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-2">
            <label className="field">
              <span>Duration or learning hours *</span>
              <input name="programDuration" required maxLength={120} className="input" aria-describedby="duration-hint" />
            </label>
            <span id="duration-hint" className="hint">
              For example: 120 learning hours over six months.
            </span>
          </div>
          <label className="field col-span-full">
            <span>Intended learners *</span>
            <textarea name="programLearners" required rows={2} maxLength={600} placeholder="Who the program is for, entry requirements, expected cohort size…" className="textarea" />
          </label>
          <label className="field col-span-full">
            <span>Program description and objectives *</span>
            <textarea name="profile" required rows={6} maxLength={6000} placeholder="Purpose and relevance, main topics, intended learning outcomes, how learners are assessed and certified…" className="textarea" />
          </label>
        </div>
      </fieldset>

      <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
        <Legend n={2}>Education provider</Legend>
        <div className="grid gap-5" style={grid}>
          <label className="field col-span-full">
            <span>Education provider (legal name) *</span>
            <input name="name" required maxLength={200} autoComplete="organization" className="input" />
          </label>
          <label className="field">
            <span>Country *</span>
            <input name="country" required maxLength={100} autoComplete="country-name" className="input" />
          </label>
          <label className="field">
            <span>Provider type *</span>
            <select name="type" required defaultValue="" className="select">
              <option value="">Select…</option>
              {PROVIDER_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Website *</span>
            <input name="website" required type="url" placeholder="https://" className="input" />
          </label>
          <div className="flex flex-col gap-2">
            <label className="field">
              <span>Registration or licensing reference</span>
              <input name="authRef" maxLength={200} className="input" aria-describedby="authref-hint" />
            </label>
            <span id="authref-hint" className="hint">
              If your organization is registered or licensed by a public authority.
            </span>
          </div>
        </div>
      </fieldset>

      <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
        <Legend n={3}>Contact person</Legend>
        <div className="grid gap-5" style={grid}>
          <label className="field">
            <span>Full name *</span>
            <input name="repName" required maxLength={150} autoComplete="name" className="input" />
          </label>
          <label className="field">
            <span>Position *</span>
            <input name="repPosition" required maxLength={150} autoComplete="organization-title" className="input" />
          </label>
          <label className="field">
            <span>Official email *</span>
            <input name="repEmail" required type="email" autoComplete="email" className="input" />
          </label>
          <label className="field">
            <span>Telephone number *</span>
            <input name="repPhone" required type="tel" autoComplete="tel" maxLength={60} className="input" />
          </label>
        </div>
        <div className="flex flex-col gap-2">
          <label className="field">
            <span>Supporting documents (optional)</span>
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
            For example, a program brochure or syllabus. Up to 3 files, {maxLabel} in total. The full documentation is requested after the Secretariat reviews your application.
          </span>
        </div>
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
          <span>I declare that the information submitted is accurate and complete to the best of my knowledge, and that I am authorized to submit this application on behalf of the education provider.</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3" style={{ font: "400 14.5px/1.62 var(--font-sans)" }}>
          <input type="checkbox" name="declareDisclosure" required className="mt-1 h-4 w-4 flex-none" style={{ accentColor: "var(--color-navy)" }} />
          <span>
            I understand that ACCPHE program accreditation or recognition applies only to the approved program and is not government approval, licensure, or a guarantee of credit transfer (see the{" "}
            <Link href="/accreditation/programs#p-disclosure">accreditation disclosure</Link>).
          </span>
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
          {pending ? "Submitting…" : "Submit Program Application"}
        </button>
      </div>
    </form>
  );
}
