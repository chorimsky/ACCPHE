"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormAction } from "@/components/ui/use-form-action";
import { DISTINCTION_GROUPS, DISTINCTIONS, FELLOW_ROUTES } from "@/lib/domain";
import { submitFellowApplication } from "@/server/actions/public";

const NEXT_STEPS = [
  { t: "Eligibility and documentation review", d: "The College Secretariat reviews the submission for completeness and confirms the preliminary eligibility requirements and the evidence required." },
  { t: "Professional and ethical assessment", d: "Qualified reviewers evaluate credentials, experience, contributions, professional standing and evidence against the applicable standards." },
  { t: "Review and decision", d: "The recognition body considers the assessment findings. Successful candidates receive the credential and an official verification record." },
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

export function FellowApplicationForm({ maxLabel, initialRoute, initialDistinction }: { maxLabel: string; initialRoute: (typeof FELLOW_ROUTES)[number]; initialDistinction: string }) {
  const [state, onSubmit, pending] = useFormAction(submitFellowApplication);
  const [route, setRoute] = useState(initialRoute);
  const top = useRef<HTMLDivElement>(null);
  const nomination = route === "Nomination";

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
        <span className="caps">{nomination ? "Nomination received" : "Application received"}</span>
        <h2 className="m-0 text-navy" style={{ font: "500 clamp(26px,3vw,34px)/1.2 var(--font-serif)" }}>
          {nomination ? "Thank you for your nomination." : "Thank you for applying to the College of Fellows."}
        </h2>
        <div className="flex flex-wrap items-baseline gap-3.5 border border-line bg-mist px-[18px] py-3.5">
          <span className="caps-sm" style={{ fontSize: 11.5 }}>
            Your reference
          </span>
          <span style={{ font: "600 18px var(--font-serif)", color: "var(--color-navy)", letterSpacing: ".04em" }}>{ref}</span>
        </div>
        <p className="body-lg">The College Secretariat will review the submission and contact you through the details provided. A confirmation has been sent to your email.</p>
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
        {!nomination && (
          <p className="m-0" style={{ font: "400 14.5px/1.6 var(--font-sans)" }}>
            Keep your reference for all correspondence. To follow the review and upload evidence online, <Link href={`/portal/register?ref=${encodeURIComponent(ref)}`}>request a portal account</Link> quoting this reference.
          </p>
        )}
        <div className="pt-1.5">
          <Link href="/fellows" className="link-arrow">
            Return to the College of Fellows
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
        All fields marked <span className="font-semibold text-navy">*</span> are required.
      </p>

      <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
        <Legend n={1}>Recognition sought</Legend>
        <div role="radiogroup" aria-label="This submission is" className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,230px),1fr))" }}>
          {FELLOW_ROUTES.map((r) => {
            const on = route === r;
            return (
              <label
                key={r}
                className="flex cursor-pointer flex-col gap-1.5 p-5 transition-colors"
                style={on ? { border: "1.5px solid var(--color-navy)", background: "var(--color-mist)", boxShadow: "0 0 0 3px rgba(69,98,124,.14)" } : { border: "1px solid var(--color-line-strong)" }}
              >
                <span className="flex items-center gap-2.5 text-navy" style={{ font: "600 15px/1.35 var(--font-sans)" }}>
                  <input type="radio" name="route" value={r} checked={on} onChange={() => setRoute(r)} className="m-0 h-4 w-4" style={{ accentColor: "var(--color-navy)" }} />
                  {r === "Application" ? "I am applying for myself" : "I am nominating someone"}
                </span>
                <span className="text-slate" style={{ font: "400 13.5px/1.5 var(--font-sans)" }}>
                  {r === "Application" ? "Apply for a fellowship, certification or distinction." : "Nominate a distinguished scholar, educator or leader."}
                </span>
              </label>
            );
          })}
        </div>
        <label className="field">
          <span>Fellowship, certification or distinction sought *</span>
          <select name="designation" required defaultValue={initialDistinction} className="select">
            <option value="">Select…</option>
            {DISTINCTION_GROUPS.map((g) => (
              <optgroup key={g} label={g}>
                {DISTINCTIONS.filter((d) => d.group === g).map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.t} ({d.code})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
        <Legend n={2}>{nomination ? "The nominee" : "About you"}</Legend>
        <div className="grid gap-5" style={grid}>
          <label className="field col-span-full">
            <span>{nomination ? "Nominee’s full name *" : "Full name *"}</span>
            <input name="name" required maxLength={200} autoComplete={nomination ? "off" : "name"} placeholder="As it should appear on the credential" className="input" />
          </label>
          <label className="field">
            <span>Current position or title *</span>
            <input name="position" required maxLength={200} autoComplete={nomination ? "off" : "organization-title"} placeholder="e.g. Professor of Theology" className="input" />
          </label>
          <label className="field">
            <span>Institution or organization</span>
            <input name="affiliation" maxLength={200} autoComplete={nomination ? "off" : "organization"} className="input" />
          </label>
          <label className="field">
            <span>Country *</span>
            <input name="country" required maxLength={100} autoComplete={nomination ? "off" : "country-name"} className="input" />
          </label>
          <label className="field">
            <span>{nomination ? "Nominee’s email" : "Email *"}</span>
            <input name="candidateEmail" type="email" required={!nomination} maxLength={200} autoComplete={nomination ? "off" : "email"} className="input" />
          </label>
          {!nomination && (
            <label className="field">
              <span>Telephone number *</span>
              <input name="repPhone" required type="tel" autoComplete="tel" maxLength={60} className="input" />
            </label>
          )}
          <label className="field">
            <span>Professional profile or website</span>
            <input name="website" type="url" maxLength={300} placeholder="https://" className="input" />
          </label>
          <div className="col-span-full flex flex-col gap-2">
            <label className="field">
              <span>Summary of qualifications and contributions *</span>
              <textarea
                name="profile"
                required
                rows={7}
                maxLength={6000}
                aria-describedby="profile-hint"
                placeholder="Qualifications, appointments, publications or other scholarly work, teaching, mentorship or ministry education, institutional contributions…"
                className="textarea"
              />
            </label>
            <span id="profile-hint" className="hint">
              {nomination ? "Explain why the nominee merits this recognition, with verifiable achievements." : "Explain how your experience and contributions meet the distinction sought, with verifiable achievements."}
            </span>
          </div>
        </div>
      </fieldset>

      {nomination && (
        <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
          <Legend n={3}>About you (the nominator)</Legend>
          <div className="grid gap-5" style={grid}>
            <label className="field">
              <span>Your full name *</span>
              <input name="repName" required maxLength={150} autoComplete="name" className="input" />
            </label>
            <label className="field">
              <span>Your position and relationship to the nominee</span>
              <input name="repPosition" maxLength={150} placeholder="e.g. Dean; former colleague" className="input" />
            </label>
            <label className="field">
              <span>Your email *</span>
              <input name="repEmail" required type="email" autoComplete="email" maxLength={200} className="input" />
            </label>
            <label className="field">
              <span>Your telephone number *</span>
              <input name="repPhone" required type="tel" autoComplete="tel" maxLength={60} className="input" />
            </label>
          </div>
        </fieldset>
      )}

      <fieldset className="m-0 flex flex-col gap-[18px] border-0 p-0">
        <Legend n={nomination ? 4 : 3}>Supporting evidence</Legend>
        <div className="flex flex-col gap-2">
          <label className="field">
            <span>Curriculum vitae and supporting documents (optional now)</span>
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
            PDF preferred. Up to 3 files, {maxLabel} in total — for example a curriculum vitae and a list of publications. The Secretariat will request the full evidence after reviewing the submission.
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
          <span>I declare that the information submitted is accurate and complete to the best of my knowledge, and that achievements described can be independently verified.</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3" style={{ font: "400 14.5px/1.62 var(--font-sans)" }}>
          <input type="checkbox" name="declareEthics" required className="mt-1 h-4 w-4 flex-none" style={{ accentColor: "var(--color-navy)" }} />
          <span>
            {nomination
              ? "To my knowledge, the nominee is of good professional and ethical standing, and I am not aware of any unresolved matter concerning their professional conduct."
              : "I am of good professional and ethical standing, I will disclose any matter concerning my professional conduct that the College should know, and I agree to observe the College’s professional conduct requirements if recognized."}
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3" style={{ font: "400 14.5px/1.62 var(--font-sans)" }}>
          <input type="checkbox" name="declareDisclosure" required className="mt-1 h-4 w-4 flex-none" style={{ accentColor: "var(--color-navy)" }} />
          <span>
            I understand that recognition is not automatic, that payment of any fee does not guarantee approval, and that the College’s distinctions are not academic degrees, professional licenses, governmental endorsements, or institutional accreditation.
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
          {pending ? "Submitting…" : nomination ? "Submit Nomination" : "Submit Application"}
        </button>
      </div>
    </form>
  );
}
