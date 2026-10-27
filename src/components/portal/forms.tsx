"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ARTICLE_CATEGORIES, CASE_TYPES, CLASSIFICATIONS, PATHWAYS, PROGRAM_AWARDS, RECORD_STATUS, ROLES } from "@/db/schema";
import { INSTITUTION_TYPES, PROGRAM_CATEGORIES, PROGRAM_DELIVERY, PROVIDER_TYPES, ROLE_INFO } from "@/lib/domain";
import { fmtDate, fmtMonth } from "@/lib/format";
import { logInquiry, updateApplication } from "@/server/actions/applications";
import { createCase } from "@/server/actions/cases";
import { saveContent } from "@/server/actions/content";
import { saveRecord } from "@/server/actions/directory";
import { saveProgramRecord } from "@/server/actions/programs";
import { saveArticle } from "@/server/actions/news";
import { inviteUser } from "@/server/actions/users";
import { PortalForm } from "./actions";
import { Pill } from "./ui";

const Opt = ({ list }: { list: readonly string[] }) => (
  <>
    {list.map((o) => (
      <option key={o} value={o}>
        {o}
      </option>
    ))}
  </>
);

/**
 * Pressing Enter in a text field submits the form with its first submit button. Placed first, this invisible button
 * makes Enter keep the current state ("save" / the article's current status) instead of triggering "publish".
 */
const EnterKeeps = ({ value }: { value: string }) => (
  <button type="submit" name="intent" value={value} tabIndex={-1} aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden" />
);

/* ─────────── Applications ─────────── */

/** Program categories offered as suggestions (the published list of eligible programs). */
function CategoryList({ id }: { id: string }) {
  return (
    <datalist id={id}>
      {PROGRAM_CATEGORIES.map((c) => (
        <option key={c} value={c} />
      ))}
    </datalist>
  );
}

export function NewInquiryForm({ kind = "institution" }: { kind?: "institution" | "program" }) {
  const program = kind === "program";
  return (
    <PortalForm action={logInquiry} className="p-card flex max-w-[860px] flex-col gap-5">
      {(pending) => (
        <>
          <div className="flex flex-col gap-1.5">
            <h2 className="m-0 text-navy" style={{ font: "500 22px var(--font-serif)" }}>
              {program ? "Log a program accreditation application" : "Log an institutional inquiry"}
            </h2>
            <span className="text-muted" style={{ font: "400 13.5px/1.5 var(--font-sans)" }}>
              For applications received by email, post, or in person. The record enters the pathway at stage 1, {program ? "Application" : <>Inquiry &amp; orientation</>}.
            </span>
          </div>
          <input type="hidden" name="kind" value={kind} />
          <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))" }}>
            {program && (
              <label className="p-label col-span-full">
                <span>Program title *</span>
                <input name="programTitle" required maxLength={200} className="p-input" />
              </label>
            )}
            <label className="p-label col-span-full">
              <span>{program ? "Education provider (legal name) *" : "Legal institution name *"}</span>
              <input name="name" required maxLength={200} className="p-input" />
            </label>
            <label className="p-label">
              <span>Country *</span>
              <input name="country" required maxLength={100} className="p-input" />
            </label>
            {program ? (
              <input type="hidden" name="pathway" value="Accreditation" />
            ) : (
              <label className="p-label">
                <span>Pathway</span>
                <select name="pathway" defaultValue="Accreditation" className="p-select">
                  <Opt list={PATHWAYS} />
                </select>
              </label>
            )}
            <label className="p-label">
              <span>{program ? "Contact person" : "Representative"}</span>
              <input name="repName" maxLength={150} className="p-input" />
            </label>
            <label className="p-label">
              <span>Official email</span>
              <input name="repEmail" type="email" className="p-input" />
            </label>
          </div>
          <div className="flex gap-2.5">
            <button type="submit" disabled={pending} className="p-btn">
              {pending ? "Creating…" : "Create record"}
            </button>
            <Link href={program ? "/portal/applications?kind=program" : "/portal/applications"} className="p-btn-secondary">
              Cancel
            </Link>
          </div>
        </>
      )}
    </PortalForm>
  );
}

/* ─────────── Directory ─────────── */

export type RecordDraft = { id: string; name: string; country: string; cls: string; effective: string; review: string; scope: string; conditions: string; status: string; verified: boolean };

export function RecordForm({ record, deleteSlot }: { record: RecordDraft; deleteSlot?: React.ReactNode }) {
  const [r, setR] = useState(record);
  const set = (k: keyof RecordDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setR((x) => ({ ...x, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));
  return (
    <div className="flex flex-wrap items-start gap-6">
      <PortalForm action={saveRecord} className="p-card flex min-w-0 flex-[2_1_520px] flex-col gap-[22px]">
        {(pending) => (
          <>
            <h2 className="m-0 text-navy" style={{ font: "500 22px var(--font-serif)" }}>
              {record.id ? "Edit directory record" : "New directory record"}
            </h2>
            <EnterKeeps value="save" />
            {record.id && <input type="hidden" name="id" value={record.id} />}
            <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))" }}>
              <label className="p-label col-span-full">
                <span>Legal institution name *</span>
                <input name="name" required maxLength={200} value={r.name} onChange={set("name")} className="p-input" />
              </label>
              <label className="p-label">
                <span>Country *</span>
                <input name="country" required maxLength={100} value={r.country} onChange={set("country")} className="p-input" />
              </label>
              <label className="p-label">
                <span>Classification</span>
                <select name="cls" value={r.cls} onChange={set("cls")} className="p-select">
                  <Opt list={CLASSIFICATIONS} />
                </select>
              </label>
              <label className="p-label">
                <span>Effective date</span>
                <input name="effective" type="date" value={r.effective} onChange={set("effective")} className="p-input" />
              </label>
              <label className="p-label">
                <span>Expiry or review date</span>
                <input name="review" type="date" value={r.review} onChange={set("review")} className="p-input" />
              </label>
              <label className="p-label col-span-full">
                <span>Scope of accreditation</span>
                <input name="scope" maxLength={300} placeholder="e.g. Institutional accreditation" value={r.scope} onChange={set("scope")} className="p-input" />
              </label>
              <label className="p-label col-span-full">
                <span>Conditions (if any)</span>
                <textarea name="conditions" rows={3} maxLength={2000} value={r.conditions} onChange={set("conditions")} className="p-textarea" />
              </label>
              <label className="p-label">
                <span>Status</span>
                <select name="status" value={r.status} onChange={set("status")} className="p-select">
                  <Opt list={RECORD_STATUS} />
                </select>
              </label>
              {(r.status !== record.status || r.cls !== record.cls) && record.id && (
                <label className="p-label col-span-full">
                  <span>Public note on this change (optional)</span>
                  <input name="changeNote" maxLength={500} placeholder="e.g. Suspended pending review of governance concerns" className="p-input" />
                </label>
              )}
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-[3px] border border-line bg-mist p-4">
              <input type="checkbox" name="verified" checked={r.verified} onChange={set("verified")} className="mt-[3px] h-4 w-4 flex-none" style={{ accentColor: "var(--color-navy)" }} />
              <span className="flex flex-col gap-[3px]">
                <span className="text-navy" style={{ font: "600 14px var(--font-sans)" }}>
                  Formal decision verified
                </span>
                <span className="text-muted" style={{ font: "400 13px/1.5 var(--font-sans)" }}>
                  I confirm this record reflects a formal decision of the authorized Council body, including scope, dates, and conditions.
                </span>
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-2.5 border-t border-cloud pt-4">
              <button type="submit" name="intent" value="publish" disabled={pending} className="p-btn">
                Save and publish
              </button>
              <button type="submit" name="intent" value="save" disabled={pending} className="p-btn-secondary">
                Save
              </button>
              <Link href="/portal/directory" className="p-btn-secondary">
                Cancel
              </Link>
              {deleteSlot && <div className="ml-auto">{deleteSlot}</div>}
            </div>
          </>
        )}
      </PortalForm>
      <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-3">
        <span className="p-eyebrow">Public directory preview</span>
        <div className="flex flex-col gap-2.5 rounded border border-line bg-white p-5">
          <span style={{ font: "600 17px/1.3 var(--font-serif)", color: "var(--color-navy)" }}>{r.name || "Institution name"}</span>
          <span className="text-muted" style={{ font: "400 13px var(--font-sans)" }}>
            {r.country || "—"}
          </span>
          <span className="self-start border border-steel px-2.5 py-1 text-navy" style={{ font: "600 12px var(--font-sans)" }}>
            {r.cls}
          </span>
          {r.status !== "Published" && r.status !== "Draft" && (
            <span className="text-bad" style={{ font: "700 11px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase" }}>
              Status: {r.status}
            </span>
          )}
          <div className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 border-t border-cloud pt-2" style={{ font: "400 13px var(--font-sans)" }}>
            <span className="text-muted">Effective</span>
            <span>{r.effective ? fmtDate(r.effective) : "—"}</span>
            <span className="text-muted">Review</span>
            <span>{r.review ? `Review due ${fmtDate(r.review)}` : "—"}</span>
          </div>
          {r.conditions && (
            <span className="text-muted" style={{ font: "400 12.5px/1.5 var(--font-sans)" }}>
              {r.conditions}
            </span>
          )}
        </div>
        <p className="small m-0" style={{ fontSize: 12.5 }}>
          Visible to the public when Published, or when a verified record is Suspended, Withdrawn or Expired.
        </p>
      </aside>
    </div>
  );
}

export type ProgramRecordDraft = {
  id: string;
  verification: string;
  title: string;
  provider: string;
  country: string;
  category: string;
  award: string;
  effective: string;
  review: string;
  scope: string;
  conditions: string;
  status: string;
  verified: boolean;
};

export function ProgramRecordForm({ record, deleteSlot }: { record: ProgramRecordDraft; deleteSlot?: React.ReactNode }) {
  const [r, setR] = useState(record);
  const set = (k: keyof ProgramRecordDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setR((x) => ({ ...x, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));
  return (
    <div className="flex flex-wrap items-start gap-6">
      <PortalForm action={saveProgramRecord} className="p-card flex min-w-0 flex-[2_1_520px] flex-col gap-[22px]">
        {(pending) => (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="m-0 text-navy" style={{ font: "500 22px var(--font-serif)" }}>
                {record.id ? "Edit program record" : "New program record"}
              </h2>
              <span className="p-meta">{record.verification ? `Verification no. ${record.verification}` : "A verification number is issued when the record is saved"}</span>
            </div>
            <EnterKeeps value="save" />
            {record.id && <input type="hidden" name="id" value={record.id} />}
            <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))" }}>
              <label className="p-label col-span-full">
                <span>Approved program title *</span>
                <input name="title" required maxLength={200} value={r.title} onChange={set("title")} className="p-input" />
              </label>
              <label className="p-label col-span-full">
                <span>Education provider *</span>
                <input name="provider" required maxLength={200} value={r.provider} onChange={set("provider")} className="p-input" />
              </label>
              <label className="p-label">
                <span>Country *</span>
                <input name="country" required maxLength={100} value={r.country} onChange={set("country")} className="p-input" />
              </label>
              <label className="p-label">
                <span>Category</span>
                <input name="category" list="program-categories" maxLength={200} value={r.category} onChange={set("category")} className="p-input" />
                <CategoryList id="program-categories" />
              </label>
              <label className="p-label">
                <span>Status awarded</span>
                <select name="award" value={r.award} onChange={set("award")} className="p-select">
                  <Opt list={PROGRAM_AWARDS} />
                </select>
              </label>
              <label className="p-label">
                <span>Effective date</span>
                <input name="effective" type="date" value={r.effective} onChange={set("effective")} className="p-input" />
              </label>
              <label className="p-label">
                <span>Valid until (renewal review)</span>
                <input name="review" type="date" value={r.review} onChange={set("review")} className="p-input" />
              </label>
              <label className="p-label col-span-full">
                <span>Scope</span>
                <input name="scope" maxLength={300} placeholder="e.g. Program-level accreditation — online delivery" value={r.scope} onChange={set("scope")} className="p-input" />
              </label>
              <label className="p-label col-span-full">
                <span>Conditions (if any)</span>
                <textarea name="conditions" rows={3} maxLength={2000} value={r.conditions} onChange={set("conditions")} className="p-textarea" />
              </label>
              <label className="p-label">
                <span>Status</span>
                <select name="status" value={r.status} onChange={set("status")} className="p-select">
                  <Opt list={RECORD_STATUS} />
                </select>
              </label>
              {(r.status !== record.status || r.award !== record.award) && record.id && (
                <label className="p-label col-span-full">
                  <span>Public note on this change (optional)</span>
                  <input name="changeNote" maxLength={500} placeholder="e.g. Withdrawn at the provider’s request" className="p-input" />
                </label>
              )}
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-[3px] border border-line bg-mist p-4">
              <input type="checkbox" name="verified" checked={r.verified} onChange={set("verified")} className="mt-[3px] h-4 w-4 flex-none" style={{ accentColor: "var(--color-navy)" }} />
              <span className="flex flex-col gap-[3px]">
                <span className="text-navy" style={{ font: "600 14px var(--font-sans)" }}>
                  Formal decision verified
                </span>
                <span className="text-muted" style={{ font: "400 13px/1.5 var(--font-sans)" }}>
                  I confirm this record reflects a formal decision of the authorized body, including the approved title, scope, validity period, and conditions.
                </span>
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-2.5 border-t border-cloud pt-4">
              <button type="submit" name="intent" value="publish" disabled={pending} className="p-btn">
                Save and publish
              </button>
              <button type="submit" name="intent" value="save" disabled={pending} className="p-btn-secondary">
                Save
              </button>
              <Link href="/portal/directory?kind=programs" className="p-btn-secondary">
                Cancel
              </Link>
              {deleteSlot && <div className="ml-auto">{deleteSlot}</div>}
            </div>
          </>
        )}
      </PortalForm>
      <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-3">
        <span className="p-eyebrow">Public directory preview</span>
        <div className="flex flex-col gap-2.5 rounded border border-line bg-white p-5">
          <span style={{ font: "600 17px/1.3 var(--font-serif)", color: "var(--color-navy)" }}>{r.title || "Program title"}</span>
          <span className="text-muted" style={{ font: "400 13px var(--font-sans)" }}>
            {[r.provider || "Provider", r.country].filter(Boolean).join(" · ")}
          </span>
          <span className="self-start border border-steel px-2.5 py-1 text-navy" style={{ font: "600 12px var(--font-sans)" }}>
            {r.award}
          </span>
          {r.status !== "Published" && r.status !== "Draft" && (
            <span className="text-bad" style={{ font: "700 11px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase" }}>
              Status: {r.status}
            </span>
          )}
          <div className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 border-t border-cloud pt-2" style={{ font: "400 13px var(--font-sans)" }}>
            <span className="text-muted">Verification</span>
            <span>{record.verification || "Issued on save"}</span>
            <span className="text-muted">Effective</span>
            <span>{r.effective ? fmtDate(r.effective) : "—"}</span>
            <span className="text-muted">Valid until</span>
            <span>{r.review ? fmtDate(r.review) : "—"}</span>
          </div>
          {r.conditions && (
            <span className="text-muted" style={{ font: "400 12.5px/1.5 var(--font-sans)" }}>
              {r.conditions}
            </span>
          )}
        </div>
        <p className="small m-0" style={{ fontSize: 12.5 }}>
          Visible to the public when Published, or when a verified record is Suspended, Withdrawn or Expired. Accreditation applies only to the approved program.
        </p>
      </aside>
    </div>
  );
}

/* ─────────── News ─────────── */

export type ArticleDraft = { id: string; title: string; category: string; date: string; excerpt: string; body: string; status: string; slug: string };

export function ArticleForm({ article, deleteSlot }: { article: ArticleDraft; deleteSlot?: React.ReactNode }) {
  const [a, setA] = useState(article);
  const set = (k: keyof ArticleDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setA((x) => ({ ...x, [k]: e.target.value }));
  const published = article.status === "Published";
  const words = useMemo(() => a.body.trim().split(/\s+/).filter(Boolean).length, [a.body]);
  return (
    <PortalForm action={saveArticle} className="flex flex-wrap items-start gap-6">
      {(pending) => (
        <>
          <EnterKeeps value={published ? "publish" : "draft"} />
          {article.id && <input type="hidden" name="id" value={article.id} />}
          <section className="p-card flex min-w-0 flex-[2_1_540px] flex-col gap-[18px]">
            <input
              name="title"
              required
              maxLength={200}
              value={a.title}
              onChange={set("title")}
              placeholder="Article title"
              aria-label="Title"
              className="w-full border-0 border-b border-line bg-transparent pb-3.5 pt-1.5 text-navy outline-none focus:border-navy"
              style={{ font: "500 28px/1.2 var(--font-serif)" }}
            />
            <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))" }}>
              <label className="p-label">
                <span>Category</span>
                <select name="category" value={a.category} onChange={set("category")} className="p-select">
                  <Opt list={ARTICLE_CATEGORIES} />
                </select>
              </label>
              <label className="p-label">
                <span>Publication date</span>
                <input name="date" type="date" required value={a.date} onChange={set("date")} className="p-input" />
              </label>
              <div className="flex flex-col gap-[7px]">
              <label className="p-label">
                <span>Web address</span>
                <input
                  name="slug"
                  value={a.slug}
                  onChange={set("slug")}
                  readOnly={published}
                  placeholder="generated from the title"
                  className="p-input"
                  aria-describedby="slug-hint"
                  style={published ? { background: "var(--color-portal)", color: "var(--color-muted)" } : undefined}
                />
              </label>
                <span id="slug-hint" className="text-muted" style={{ font: "400 12px/1.4 var(--font-sans)", fontWeight: 400 }}>
                  /news/{a.slug || "…"}
                  {published ? " (fixed after publication)" : ""}
                </span>
              </div>
            </div>
            <label className="p-label">
              <span>Summary *</span>
              <textarea name="excerpt" rows={3} required maxLength={600} value={a.excerpt} onChange={set("excerpt")} placeholder="Shown on the homepage and in the News & Insights list." className="p-textarea" />
            </label>
            <div className="flex flex-col gap-[7px]">
            <label className="p-label">
              <span>Article body</span>
              <textarea name="body" rows={14} maxLength={60000} value={a.body} onChange={set("body")} placeholder="Write the full article. Separate paragraphs with a blank line." className="p-textarea" aria-describedby="body-hint" />
            </label>
              <span id="body-hint" className="text-muted" style={{ font: "400 12.5px/1.5 var(--font-sans)", fontWeight: 400 }}>
                Formatting: a line starting with “## ” is a heading; lines starting with “- ” form a list; **bold**; [link text](https://…). A future publication date schedules the article.
              </span>
            </div>
            <span className="self-end text-muted" style={{ font: "400 12.5px var(--font-sans)" }}>
              {words} words
            </span>
          </section>
          <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
            <section className="p-card flex flex-col gap-3.5" style={{ padding: 20 }}>
              <div className="flex items-center justify-between">
                <h2 className="p-h3">Publishing</h2>
                <Pill tone={published ? "navy" : "outline"}>{published ? "Published" : "Draft"}</Pill>
              </div>
              <div className="flex flex-col gap-2">
                <button type="submit" name="intent" value="publish" disabled={pending} className="p-btn" style={{ padding: 11 }}>
                  {published ? "Update article" : "Publish"}
                </button>
                <button type="submit" name="intent" value="draft" disabled={pending} className="p-btn-secondary" style={{ padding: 10 }}>
                  {published ? "Unpublish and save as draft" : "Save draft"}
                </button>
              </div>
              {deleteSlot && <div className="border-t border-cloud pt-2.5">{deleteSlot}</div>}
            </section>
            <span className="p-eyebrow">Website preview</span>
            <article className="flex flex-col gap-2.5 rounded border border-line bg-white p-[22px]">
              <div className="flex gap-2.5" style={{ font: "600 11px var(--font-sans)", letterSpacing: ".12em", textTransform: "uppercase" }}>
                <span className="text-navy">{a.category}</span>
                <span className="text-muted">{a.date ? fmtMonth(a.date) : ""}</span>
              </div>
              <span style={{ font: "600 19px/1.3 var(--font-serif)", color: "var(--color-navy)" }}>{a.title || "Article title"}</span>
              <span style={{ font: "400 13.5px/1.6 var(--font-sans)" }}>{a.excerpt || "The summary appears here and on the homepage."}</span>
            </article>
          </aside>
        </>
      )}
    </PortalForm>
  );
}

/* ─────────── Cases ─────────── */

export function CaseForm({
  initial,
  applications,
  fromMessage,
}: {
  initial: { type: string; subject: string; institution: string; party: string; partyEmail: string; details: string };
  applications: { value: string; label: string }[];
  /** The website message this case is logged from (it is linked and archived). */
  fromMessage?: string;
}) {
  return (
    <PortalForm action={createCase} className="p-card flex max-w-[820px] flex-col gap-5">
      {(pending) => (
        <>
          {fromMessage && <input type="hidden" name="fromMessage" value={fromMessage} />}
          <h2 className="m-0 text-navy" style={{ font: "500 22px var(--font-serif)" }}>
            Log a complaint or appeal
          </h2>
          <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))" }}>
            <label className="p-label">
              <span>Type</span>
              <select name="type" defaultValue={initial.type} className="p-select">
                <Opt list={CASE_TYPES} />
              </select>
            </label>
            <label className="p-label">
              <span>Submitted by</span>
              <input name="party" maxLength={300} defaultValue={initial.party} placeholder="Name and capacity" className="p-input" />
            </label>
            <label className="p-label">
              <span>Email for acknowledgement and determination</span>
              <input name="partyEmail" type="email" defaultValue={initial.partyEmail} className="p-input" />
            </label>
            <label className="p-label">
              <span>Application concerned (appeals)</span>
              <select name="applicationId" defaultValue="" className="p-select">
                <option value="">None</option>
                {applications.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="p-label col-span-full">
              <span>Subject *</span>
              <input name="subject" required maxLength={300} defaultValue={initial.subject} className="p-input" />
            </label>
            <label className="p-label col-span-full">
              <span>Institution or matter concerned</span>
              <input name="institution" maxLength={300} defaultValue={initial.institution} className="p-input" />
            </label>
            <label className="p-label col-span-full">
              <span>Details of the alleged breach or grounds for appeal *</span>
              <textarea name="details" required rows={6} maxLength={10000} defaultValue={initial.details} className="p-textarea" />
            </label>
          </div>
          <div className="flex gap-2.5">
            <button type="submit" disabled={pending} className="p-btn">
              {pending ? "Logging…" : "Log case"}
            </button>
            <Link href="/portal/cases" className="p-btn-secondary">
              Cancel
            </Link>
          </div>
        </>
      )}
    </PortalForm>
  );
}

/* ─────────── Site content ─────────── */

export type ContentDraft = { bannerOn: boolean; bannerText: string; notice: string; email: string; phone: string; address: string };

export function ContentForm({ content }: { content: ContentDraft }) {
  const [saved, setSaved] = useState(content);
  const [c, setC] = useState(content);
  const set = (k: keyof ContentDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setC((x) => ({ ...x, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));
  const dirty = JSON.stringify(c) !== JSON.stringify(saved);
  return (
    <PortalForm action={saveContent} onSuccess={() => setSaved(c)} className="flex max-w-[900px] flex-col gap-6">
      {(pending) => (
        <>
          <section className="p-card flex flex-col gap-4" style={{ padding: 26 }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="p-h3">Site announcement banner</h2>
              <label className="flex cursor-pointer items-center gap-2.5 text-navy" style={{ font: "600 13.5px var(--font-sans)" }}>
                <input type="checkbox" name="bannerOn" checked={c.bannerOn} onChange={set("bannerOn")} className="h-4 w-4" style={{ accentColor: "var(--color-navy)" }} />
                Show on website
              </label>
            </div>
            <p className="small m-0" style={{ fontSize: 13.5 }}>
              A single-line notice shown above the website header — for consultations, deadlines, or office closures.
            </p>
            <label className="p-label">
              <span>Banner text</span>
              <textarea name="bannerText" rows={2} maxLength={300} value={c.bannerText} onChange={set("bannerText")} placeholder="e.g. Consultation on the proposed accreditation standards is open until 30 November 2026." className="p-textarea" />
            </label>
            {c.bannerOn && c.bannerText && (
              <div className="rounded-[3px] bg-slate px-4 py-[11px] text-mist" style={{ font: "500 13.5px/1.5 var(--font-sans)" }}>
                {c.bannerText}
              </div>
            )}
          </section>
          <section className="p-card flex flex-col gap-4" style={{ padding: 26 }}>
            <h2 className="p-h3">Status notice</h2>
            <p className="small m-0" style={{ fontSize: 13.5 }}>
              Shown above the footer on every page. Keep it accurate: membership, accreditation, authorization, and recognition are separate matters.
            </p>
            <label className="p-label">
              <span>Notice text</span>
              <textarea name="notice" rows={4} maxLength={1200} value={c.notice} onChange={set("notice")} className="p-textarea" />
            </label>
          </section>
          <section className="p-card flex flex-col gap-4" style={{ padding: 26 }}>
            <h2 className="p-h3">Secretariat contact details</h2>
            <p className="small m-0" style={{ fontSize: 13.5 }}>
              Shown on the Contact page once provided. Leave blank to hide.
            </p>
            <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))" }}>
              <label className="p-label">
                <span>Official email</span>
                <input name="email" type="email" maxLength={200} value={c.email} onChange={set("email")} className="p-input" />
              </label>
              <label className="p-label">
                <span>Telephone</span>
                <input name="phone" type="tel" maxLength={80} value={c.phone} onChange={set("phone")} className="p-input" />
              </label>
              <label className="p-label col-span-full">
                <span>Postal address</span>
                <textarea name="address" rows={3} maxLength={600} value={c.address} onChange={set("address")} className="p-textarea" />
              </label>
            </div>
          </section>
          <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-white px-[18px] py-3.5" style={{ boxShadow: "0 10px 28px rgba(20,43,69,.10)" }}>
            <span className="text-muted" style={{ font: "500 13.5px var(--font-sans)" }}>
              {dirty && <span className="font-semibold text-warn">Unsaved changes</span>}
            </span>
            <div className="flex gap-2.5">
              <button type="button" className="p-btn-secondary" disabled={!dirty || pending} onClick={() => setC(saved)}>
                Discard
              </button>
              <button type="submit" className="p-btn" disabled={pending}>
                {pending ? "Saving…" : "Save and publish"}
              </button>
            </div>
          </div>
        </>
      )}
    </PortalForm>
  );
}

/* ─────────── Users ─────────── */

export function InviteForm() {
  const [key, setKey] = useState(0);
  return (
    <PortalForm key={key} action={inviteUser} onSuccess={() => setKey((k) => k + 1)} className="p-card flex flex-col gap-4">
      {(pending) => (
        <>
          <div className="flex flex-col gap-1">
            <h2 className="p-h3">Create an account</h2>
            <span className="small" style={{ fontSize: 13 }}>
              For Council staff, Commission members and reviewers. The person receives an email to choose their own password.
            </span>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))" }}>
            <label className="p-label">
              <span>Full name *</span>
              <input name="name" required maxLength={150} className="p-input" />
            </label>
            <label className="p-label">
              <span>Email *</span>
              <input name="email" type="email" required className="p-input" />
            </label>
            <label className="p-label">
              <span>Role</span>
              <select name="role" defaultValue="officer" className="p-select">
                {ROLES.filter((r) => r !== "institution").map((r) => (
                  <option key={r} value={r}>
                    {ROLE_INFO[r].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="p-label">
              <span>Position</span>
              <input name="position" maxLength={150} placeholder="e.g. Program Officer — Accreditation" className="p-input" />
            </label>
            <label className="p-label">
              <span>Office or expertise</span>
              <input name="org" maxLength={200} className="p-input" />
            </label>
          </div>
          <div>
            <button type="submit" disabled={pending} className="p-btn">
              {pending ? "Creating…" : "Create account and send invitation"}
            </button>
          </div>
        </>
      )}
    </PortalForm>
  );
}

/* ─────────── Application details ─────────── */

export function ApplicationEditForm({ app }: { app: Record<string, string> }) {
  const program = app.kind === "program";
  const f = (name: string, label: string, opts: { type?: string; full?: boolean; max?: number } = {}) => (
    <label className={`p-label ${opts.full ? "col-span-full" : ""}`}>
      <span>{label}</span>
      <input name={name} type={opts.type ?? "text"} defaultValue={app[name]} maxLength={opts.max ?? 200} className="p-input" />
    </label>
  );
  return (
    <PortalForm action={updateApplication} className="p-card flex max-w-[900px] flex-col gap-5">
      {(pending) => (
        <>
          <input type="hidden" name="id" value={app.id} />
          <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))" }}>
            {program && (
              <>
                {f("programTitle", "Program title *", { full: true })}
                <label className="p-label">
                  <span>Program category</span>
                  <input name="programCategory" list="edit-program-categories" defaultValue={app.programCategory} maxLength={200} className="p-input" />
                  <CategoryList id="edit-program-categories" />
                </label>
                <label className="p-label">
                  <span>Delivery mode</span>
                  <select name="programDelivery" defaultValue={app.programDelivery} className="p-select">
                    <option value="">—</option>
                    <Opt list={PROGRAM_DELIVERY} />
                  </select>
                </label>
                {f("programDuration", "Duration / learning hours", { max: 120 })}
                <label className="p-label col-span-full">
                  <span>Intended learners</span>
                  <textarea name="programLearners" rows={2} defaultValue={app.programLearners} maxLength={600} className="p-textarea" />
                </label>
              </>
            )}
            {f("name", program ? "Education provider (legal name) *" : "Legal institution name *", { full: true })}
            {f("country", "Country *", { max: 100 })}
            {program ? (
              <input type="hidden" name="pathway" value={app.pathway} />
            ) : (
              <label className="p-label">
                <span>Pathway</span>
                <select name="pathway" defaultValue={app.pathway} className="p-select">
                  <Opt list={PATHWAYS} />
                </select>
              </label>
            )}
            {f("website", "Official website", { type: "url", max: 300 })}
            {!program && f("facebook", "Facebook page", { type: "url", max: 300 })}
            {!program && f("linkedin", "LinkedIn page", { type: "url", max: 300 })}
            {f("yearEstablished", "Year established", { max: 4 })}
            <label className="p-label">
              <span>{program ? "Provider type" : "Institution type"}</span>
              <select name="type" defaultValue={app.type} className="p-select">
                <option value="">—</option>
                <Opt list={program ? PROVIDER_TYPES : INSTITUTION_TYPES} />
              </select>
            </label>
            {f("authRef", "Authorization / registration reference")}
            {f("repName", "Representative", { max: 150 })}
            {f("repPosition", "Representative’s position", { max: 150 })}
            {f("repEmail", "Representative email", { type: "email" })}
            {f("repPhone", "Telephone", { type: "tel", max: 60 })}
            <label className="p-label col-span-full">
              <span>{program ? "Program description and objectives" : "Institutional profile"}</span>
              <textarea name="profile" rows={6} defaultValue={app.profile} maxLength={6000} className="p-textarea" />
            </label>
          </div>
          <div className="flex gap-2.5">
            <button type="submit" disabled={pending} className="p-btn">
              {pending ? "Saving…" : "Save details"}
            </button>
            <Link href={`/portal/applications/${app.id}`} className="p-btn-secondary">
              Cancel
            </Link>
          </div>
        </>
      )}
    </PortalForm>
  );
}
