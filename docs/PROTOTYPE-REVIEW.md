# Prototype review — "Project restructuring review" (ACCPHE Website v2 + Portal)

Reviewed: `ACCPHE Website v2.dc.html`, `ACCPHE Portal.dc.html`, `accphe-content.js`, `README.md`, `SEO-GEO-NOTES.md`,
`robots.txt`, `sitemap.xml`, `llms.txt`, `Portal roles overview.png`, and the client brief (`uploads/Website content and ideas.txt`).
`ACCPHE Website.dc.html` (first draft, kept for reference only) was not carried forward.

## Verdict

The design, content and workflow are sound and match the client brief closely: a restrained, authoritative website;
a clear distinction between membership, accreditation and recognition; and a portal that models the eight-stage pathway
end to end. Everything in the prototype has been kept. The problems were all in the prototype's *implementation*
(appropriate for a click-through demo, not for a live accreditation body), and they are fixed in this build.

## Findings and how they were resolved

### Critical — security and integrity of records

| # | Prototype behaviour | Risk | Resolution |
|---|---|---|---|
| 1 | All data in browser `localStorage` (`accphe-store-v1`), shared by site and portal. | Nothing persists between devices; any visitor can edit "official" records in their own browser; directory status is not authoritative. | SQLite/Turso database (Drizzle). The directory, articles and site content are read from the server. |
| 2 | Sign-in accepts any password and lets you **pick your role**; pending accounts can sign in. | Anyone could act as Administrator or Commission member. | Real accounts (bcrypt), server sessions (hashed ids, httpOnly cookies, rotation), lockout after repeated failures, pending/suspended accounts refused. Optional/required TOTP two-step verification. |
| 3 | Role permissions enforced only by hiding navigation. | Any module reachable by URL/state. | Every page (`requireModule`) and every server action (`authorize`) checks the role on the server. Covered by e2e tests. |
| 4 | Commission votes cast via a "Voting as Commissioner A–E" dropdown. | Anyone could vote as anyone; votes not attributable. | Each Commission member signs in and votes as themselves; one vote per member (changeable until the decision), recusal recorded. |
| 5 | Reviewers see *every* application at stage 5; no assignment. | Confidential evaluation material exposed to all reviewers. | Staff appoint reviewers per application; reviewers see only their assignments, only after a conflict-of-interest declaration. Multiple reviewers per application supported. |
| 6 | Institution view has a "Demo: viewing application" selector over all applications. | One institution could read another's file and correspondence. | Representatives are linked to exactly one application by an administrator when their account is approved. |
| 7 | Uploaded "documents" only stored the file *name*. | No evidence actually reached the Council. | Real uploads (local disk in development, private Vercel Blob in production), type checked by file signature, 4 MB limit, permission-checked downloads, downloads audited. |
| 8 | Activity log capped at 60 entries and rewritten with the store. | No audit trail. | Append-only `audit_log` table with actor, office, entity and IP; searchable, paginated, CSV export. |
| 9 | "Archive" on a message deleted it. | Loss of correspondence record. | Archiving hides the message from the inbox; it is retained. |

### High — correctness

| # | Prototype behaviour | Resolution |
|---|---|---|
| 10 | Case references counted existing cases with a hard-coded year (`CMP-2026-…`): deletions/concurrency produce duplicates. | Atomic per-year sequences for `ACC-YYYY-NNNN`, `CMP-YYYY-NNN`, `APL-YYYY-NNN`. |
| 11 | Stage changes had no concurrency check. | Optimistic check: a move only applies from the stage the user was looking at. |
| 12 | Officers were free-text job titles. | Officers are staff accounts, so assignments can notify the person. |
| 13 | Published directory records could be deleted outright. | Only drafts can be deleted; published records change status (Suspended/Withdrawn/Expired) and remain visible with that status, as the published policy requires. |
| 14 | "Membership developments — October 2026 — none" hard-coded. | Generated from records published in the last three months. |
| 15 | Password change accepted any "current password"; MFA was a checkbox. | Verified current password, session rotation and sign-out of other devices; real authenticator-app enrolment with QR code. |
| 16 | Forms lost all typed data on error (React form reset). | Forms keep their values; errors shown inline. |

### Search & GEO (from `SEO-GEO-NOTES.md`, "Required at build/launch")

| Requirement | Status |
|---|---|
| Clean URLs instead of `#/about` | Done — `/about`, `/news/<slug>`, `/directory/<slug>`; old `/article/<id>` redirects. |
| Server-side rendering with JSON-LD in the initial HTML | Done — every public page is server-rendered; all twelve standards and all FAQ answers are in the HTML. |
| Domain, canonical, `og:url` | Done — from `APP_URL`; canonical and Open Graph on every page. JSON-LD `@id`s are absolute (the prototype used `#organization`). |
| 1200×630 social image | Generated (`/opengraph-image`); replace with official artwork when the logo is final. |
| Directory record pages with `EducationalOrganization`, added to the sitemap on publication | Done — dynamic sitemap includes every public record and article. |
| robots.txt / sitemap.xml / llms.txt with real domain | Generated dynamically; non-production deployments are `noindex` and disallow all. |
| Search Console / Bing | Verification tokens via `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`. Registration itself is a manual step. |

### Other improvements

- Email notifications (Resend) for inquiries, messages, account requests, assignments, reviewer submissions, quorum, decisions and messages to institutions; per-user preferences; Monday digest.
- Spam protection: honeypot fields and per-IP rate limits on public forms and sign-in.
- Spreadsheet-formula injection guard on CSV exports.
- Accessibility: skip link, labelled regions and landmarks, `aria-current`, focus management in the search dialog, reduced-motion support, visible focus.
- Content Security Policy and standard security headers.

## Decisions taken (and alternatives)

- **Stack** mirrors the team's existing `mt-advisory` project (Next.js 16, Drizzle + libSQL/Turso, Vercel Blob, Resend, Playwright) so the same people can maintain both.
- **Language selector** translates navigation only, as in the prototype; official texts stay in English (authoritative). Full translation would need translated content and per-language URLs.
- **Staff accounts** are created by an administrator (invitation email); institutions and reviewers request access and are verified, as in the prototype.
- **Demonstration data** is a seed script and an admin button that only exist when `DEMO_MODE=1` (refused in production).
