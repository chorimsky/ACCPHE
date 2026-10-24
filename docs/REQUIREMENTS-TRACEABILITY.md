# Requirements traceability

Every requirement in the client brief (`Website content and ideas.txt`) and the prototype handover (`README.md`,
`SEO-GEO-NOTES.md`), with where it is implemented and how it is verified. "E2E" refers to the Playwright tests in
`tests/e2e/`.

## 1. Website objective and technical requirements (client brief)

| Requirement | Implementation | Verified |
|---|---|---|
| Simple, professional, authoritative, internationally credible website; clean, minimal, readable | Design system from the approved prototype (`src/app/globals.css`); restrained motion; reduced-motion respected | Visual review at desktop and 390 px |
| Communicate identity, mission, governance, standards, membership framework, activities | `/`, `/about`, `/governance`, `/standards`, `/accreditation`, `/directory`, `/news` | E2E `public.spec` (every page renders) |
| **Simple CMS: authorized staff publish articles and update institutional information without coding** | Portal → *News & articles* (draft, publish, schedule, light formatting); *Site content* → *Notices & contact details* and *Website pages* (every institutional text: home, about, values, objectives, eligibility, pathway, classifications, FAQ, 12 standards, ethics, governance, executive, policies). Official text restorable per section; all edits audited | E2E `cms.spec` (FAQ edit → website + structured data; restore; adoption; scheduled article) |
| Searchable institutional directory | `/directory` by name, country, classification (shareable URL, works without JavaScript); each record has its own page | E2E `flow.spec` step 8 |
| Accessibility | Landmarks, skip link, one `h1`, labelled fields (hints via `aria-describedby`), keyboard search dialog with focus trap, visible focus on light and dark surfaces, `aria-current`, reduced motion, print styles | E2E label-based selectors throughout; label defects found and fixed |
| Search engine optimisation | Server-rendered clean URLs, per-page metadata and canonical, JSON-LD (Organization, WebSite+SearchAction, FAQPage, HowTo, ItemList, NewsArticle, EducationalOrganization, BreadcrumbList), dynamic sitemap, robots, `llms.txt`, RSS, social image | E2E `public.spec` (canonical, JSON-LD, sitemap, robots, llms) |
| Avoid unnecessary animation and visual excess | No carousels or animation beyond hover/toast | — |
| Clarity, transparency, professionalism over promotion | Official wording carried over verbatim | — |
| Brand colours Deep Navy #142B45, Slate Blue #45627C, Soft White #F7F9FB, Cool Gray #DCE3E9 | `@theme` tokens in `globals.css`; seal, favicon, social image and email use the same palette | Visual review |

## 2. Navigation and pages

| Brief item | Where |
|---|---|
| Home: introduction, mission, core pillars, latest announcements | `/` (CMS: *Home*) |
| About Us: history, identity, vision, mission, values, objectives, responsible accreditation | `/about` (CMS: *About Us*) |
| Accreditation: process, eligibility, categories, maintaining accreditation, FAQ, applications | `/accreditation`, `/apply` (CMS: *Accreditation*) |
| Standards & Policies: 12 standards with evaluation considerations, criteria and evidence, Code of Ethics, complaints and appeals | `/standards` (CMS: *Standards & Policies*; "proposed" → "adopted on <date>" when the Board adopts them) |
| Governance: Board, Commission, committees, councils, executive structure | `/governance` (CMS: *Governance*) |
| Member Institutions: directory, status, new institutions joining (updated monthly); membership clearly distinguished from accreditation | `/directory`, `/directory/<slug>`; "Membership developments" grouped by month from the record history; classification badges and status comparison table |
| News & Insights | `/news`, `/news/<slug>`, `/news/rss.xml` |
| Contact Us as a header and footer button, not an eighth navigation item | Header CTA, footer CTA, top bar |
| Apply form fields (legal name … privacy acknowledgment), "Submit Institutional Inquiry", acknowledgement text | `/apply`; server validation; reference number; acknowledgement email |
| "The live website should display records only after formal approval and verification. No sample institution should appear as a genuine member" | Records are public only when Published (or verified Suspended/Withdrawn/Expired); publishing requires the *formal decision verified* confirmation and an effective date; demo data only with `DEMO_MODE` (refused in production) | E2E `flow.spec` step 7 |
| Accredited Institution award specifies institution, scope, effective date, expiry/review date, conditions | Directory record fields; record page | E2E `flow.spec` step 8 |
| Suspension, withdrawal, expiration reflected promptly in the directory | Status shown on the listing and record; dated, public **status history** with optional reason | E2E `flow.spec` step 8b |

## 3. Workflow (prototype README "End-to-end flow")

| Step | Implementation | Verified |
|---|---|---|
| Inquiry → application at stage 1 with reference | `submitInquiry`; `ACC-YYYY-NNNN` sequence; files stored | E2E step 1–2 |
| Staff work the 8 stages: checklist, documents, notes, messages | Application page; officer assignment; staff can correct details | E2E step 3, `cms.spec` |
| Findings & response | On entering stage 6 the institution is notified and receives an "Institutional response to review findings" document slot | — |
| Reviewer rates 12 standards and submits | Assigned reviewers only; conflict-of-interest gate; autosave; titles follow the CMS standards | E2E step 4 |
| Commission votes; staff record decision → draft record | Each member votes as themselves; recusal; quorum alert; Commission alerted when an application reaches them | E2E step 5–7 |
| Verify and publish → public directory | Verification + effective date required | E2E step 7–8 |
| Website content from the portal appears on the site | Banner, notice, contact details, articles, all institutional texts | E2E step 10, `cms.spec` |
| Institution follows its application; annual reports and substantive change once accredited | My application | E2E step 9 |
| Complaints and appeals | Cases with stages, notes, determination; acknowledgement and determination emailed to the submitter; appeals linked to the application | — |
| Messages | Inbox, replies sent from the portal (emailed, kept on record), log as complaint, archive (retained) | E2E `cms.spec` |

## 4. Production requirements (prototype README "For production")

| Requirement | Implementation |
|---|---|
| Authenticated API and database; server-enforced permissions | Turso/libSQL; `requireModule` / `authorize` on every page, action, download, export; E2E `access.spec` |
| Real authentication, verification workflow, server audit log | Passwords (bcrypt), sessions, lockout, TOTP two-step (optional or required), password reset; account approval with application linking; admin role changes, two-step reset, password links; append-only audit log with export |
| Path routing with SSR | Next.js App Router, server-rendered |
| File storage with access control | Private Vercel Blob; signature-checked uploads; permission-checked, audited downloads |
| Multilingual | Navigation/chrome in EN/FR/ES/PT; official texts in English (authoritative), as in the prototype |

## 5. Monitoring

| Need | Implementation |
|---|---|
| Accredited institutions remain subject to periodic review | Overview alerts for published awards whose review date is within 90 days or past |
| Staff awareness | Email notifications (assignments, status, submissions, quorum) and Monday digest |

## 6. Independent Program Accreditation & Recognition (client addition)

| Requirement (page text) | Implementation | Verified |
|---|---|---|
| Dedicated sub-page under Accreditation | `/accreditation/programs`, linked from `/accreditation` (section + contents); CMS-editable (Site content → Program Accreditation) | E2E `public.spec`, `cms.spec` |
| Step 1 — Application | Public form `/accreditation/programs/apply` (program, provider, contact, documents, disclosure acknowledgement) → `kind = "program"` application, `PRG-YYYY-NNNN`, acknowledgement email, staff alert | E2E `programs.spec` 1 |
| Step 2 — Documentation and self-evaluation | Program document list (curriculum, outcomes, assessment, instructor qualifications, resources, self-evaluation); uploads by provider and staff; step checklist | E2E `programs.spec` 2 |
| Step 3 — Independent program review | Reviewer assignment with conflict-of-interest gate; rating against the eight program standards | E2E `programs.spec` 3 |
| Step 4 — Accreditation decision | Commission votes with program options; staff record *Accredited Program* / *Recognized Program* / *Declined* | E2E `programs.spec` 4–5 |
| Step 5 — Certification and public verification; "unique program verification number"; "inclusion in the public directory of approved programs" | Draft program record with `ACCPHE-P-YYYY-NNNN`; publication requires verification + effective date + validity end; `/directory/programs` with verification-number lookup; record page with status history | E2E `programs.spec` 5–6 |
| Step 6 — Ongoing quality assurance | Final step; provider submits reports/substantive changes from the portal; renewal due ≤ 90 days and drafts flagged on the Overview | E2E `programs.spec` 7 |
| "Accreditation applies exclusively to the approved program" | Stated on the record page, directory, decision email, provider portal, and application disclosure | — |

## 7. Forms and workflows covered end to end

`tests/e2e/workflows.spec.ts` exercises the remaining forms and workflows against a production build:
accounts (invitation, one-time password links, profile, password change, two-step verification set-up / sign-in /
administrator reset, role change, suspension and reactivation, forgotten password), complaints and appeals (logging,
stages, notes, determination, appeal linked to a program application), website messages (inbox, mark unread, log as
complaint — linked and archived — archive), staff application tools (staff-logged inquiry, filing documents,
document status, stage return, appointing and removing reviewers), reviewer conflict of interest, Commission recusal,
declining a program application, a program provider's portal, news (publish, unpublish, delete), and manual
institution and program records (Enter saves and never publishes).
