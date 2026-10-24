# ACCPHE — website and Staff & Institution Portal

Accreditation & Compliance Council for Christian and Private Higher Education.

Production implementation of the approved prototype ("Project restructuring review"). The design, wording and workflow
are the prototype's; the data, permissions, files, email and search-engine work are real.

- [docs/PROTOTYPE-REVIEW.md](docs/PROTOTYPE-REVIEW.md) — review of the prototype and what changed.
- [docs/REQUIREMENTS-TRACEABILITY.md](docs/REQUIREMENTS-TRACEABILITY.md) — every requirement in the client brief, where it is implemented, and how it is tested.

## Quick start (development)

```bash
npm install
cp .env.example .env.local      # then set AUTH_SECRET (openssl rand -base64 48) and DEMO_MODE=1
npm run db:reset                # creates ./data/accphe.db and loads the demonstration data
npm run dev
```

- Website: http://localhost:3000 · Portal: http://localhost:3000/portal
- Demonstration accounts are printed by `npm run db:seed` (one per role). Their shared password is in
  `src/server/demo-credentials.ts`. Demo data exists only on development/preview databases.
- Emails are not sent without `RESEND_API_KEY`; read them at http://localhost:3000/portal/dev-mail.

## Stack

Next.js 16 (App Router, Server Components, Server Actions) · TypeScript · Tailwind CSS 4 · Drizzle ORM on libSQL
(SQLite file locally, Turso in production) · bcrypt + server sessions + TOTP two-step verification · Vercel Blob
(private) for documents · Resend for email · Playwright end-to-end tests.

## Website

| Address | Page |
|---|---|
| `/` | Home: mission, pillars, framework, classifications, governance, latest news, status verification |
| `/about`, `/accreditation`, `/standards`, `/governance` | Council content, scroll-spy contents, FAQ, standards browser |
| `/directory` (`?q=`, `?country=`, `?cls=`) | Official directory and status verification |
| `/directory/<slug>` | One institution's record (with `EducationalOrganization` structured data) |
| `/accreditation/programs` | Independent Program Accreditation & Recognition (eight program standards, six steps, disclosure) |
| `/accreditation/programs/apply` | Program accreditation application (one program per application; reference `PRG-YYYY-NNNN`) |
| `/directory/programs` (`?q=`, `?country=`, `?cls=`) | Directory of approved programs; entering a verification number (`ACCPHE-P-YYYY-NNNN`) opens its record |
| `/directory/programs/<slug>` | One approved program's record (with `Course` + credential structured data) |
| `/news` (`?category=`), `/news/<slug>`, `/news/rss.xml` | News & Insights (articles dated in the future are scheduled) |
| `/apply` | Institutional inquiry with pathway finder and document upload |
| `/contact` (`?topic=general|membership|verification|ethics`) | Contact form |
| `/privacy`, `/accessibility`, `/terms` | Policies |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/opengraph-image` | Search and AI crawlers |

Site search: `/` or Ctrl/Cmd + K. Navigation language: EN / FR / ES / PT (official texts remain in English).

## Portal roles

| Role | Modules |
|---|---|
| Administrator | Overview, Applications, Directory records, News & articles, Complaints & appeals, Messages, Site content, Users & access, Reports & audit |
| Accreditation Officer | Overview, Applications (institutions and programs), Directory records (institutions and programs) |
| Communications Editor | Overview, News & articles, Messages, Site content |
| Standards & Ethics Officer | Overview, Complaints & appeals, Messages |
| Institutional Reviewer | My reviews (assigned only; conflict-of-interest declaration; rating against the 12 institutional or 8 program standards; report) |
| Accreditation Commission Member | Decisions (review record, own vote, recusal) |
| Institution Representative | My application — institution or program (pathway, uploads, correspondence, reports and substantive change once decided) |

Everyone has Account settings (profile, notifications, password, two-step verification). Permissions are enforced on
the server for every page, action, download and export.

## Editing the website (no coding)

- **Site content → Notices & contact details**: announcement banner, status notice, Secretariat contact details.
- **Site content → Website pages**: every institutional text — homepage introduction and welcome, pillars, vision/mission/purpose, values, objectives, eligibility, the 8-stage pathway, classifications, FAQ, the 12 standards (and their adoption status), Code of Ethics, governance bodies, executive structure, and the privacy, accessibility and terms pages. Each section shows whether it carries the official text or an edit, and can be restored to the official text. Lists the workflow depends on (8 stages, 12 standards, 3 classifications) keep their length.
- **News & articles**: drafts, publication, scheduling by date; body text supports `## headings`, `- lists`, `**bold**` and `[links](https://…)`.
- **Directory records**: publish verified decisions; status changes (suspension, withdrawal, expiry) appear on the public record with a dated history and optional reason, and in "Membership developments".

## End-to-end flow

1. An institution submits the inquiry form → application at stage 1 with a reference (`ACC-YYYY-NNNN`), acknowledgement email, staff alert.
2. Staff assign an officer and work through the 8 stages with checklists, documents, notes and messages to the institution.
3. Staff appoint reviewers; each reviewer declares no conflict of interest, rates the 12 standards and submits a report.
4. At stage 7 Commission members vote (or recuse). Staff are alerted at quorum (`COMMISSION_QUORUM`, default 3) and record the decision → a draft directory record is created.
5. Staff verify and publish the record → it appears in the public directory and the sitemap.
6. The institution's representative requests an account quoting the reference; an administrator approves and links it; the representative follows progress, uploads documents and, once accredited, submits annual reports and substantive-change notices.
7. Articles, the announcement banner, the status notice and contact details published in the portal appear on the website immediately.

### Program accreditation flow

1. A provider submits `/accreditation/programs/apply` → program application at step 1 (`PRG-YYYY-NNNN`), acknowledgement email, staff alert. (Staff can also log one: Applications → Programs → *Log a program application*.)
2. Staff work the six steps (Application → Documentation & self-evaluation → Independent program review → Accreditation decision → Certification & public verification → Ongoing quality assurance) with step checklists and the program document list.
3. Reviewers rate the program against the eight program standards (Site content → Program Accreditation; the list length is fixed because reviews depend on it).
4. Commission members vote (*Award program accreditation*, *Grant program recognition*, *Decline*, *Defer*); staff record the decision → a draft program record with a unique verification number (`ACCPHE-P-YYYY-NNNN`, valid three years by default).
5. Staff verify and publish the record (Directory records → Programs) → it appears in `/directory/programs`, the sitemap and site search; status changes keep a dated public history. Staff then move the program to Ongoing quality assurance; renewals due within 90 days appear on the Overview.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Develop, build, serve |
| `npm run typecheck`, `npm run lint` | Static checks |
| `npm run db:push` | Apply the schema to the local SQLite file |
| `npm run db:generate` | Create a migration after changing `src/db/schema.ts` (also bundles it for production start-up) |
| `npm run db:migrate` | Apply migrations by hand (production also applies them when it starts) |
| `npm run db:seed` / `db:reset` | Load demonstration data (local databases only) |
| `npm run admin:create -- "Full Name" admin@domain` | Create the first administrator; prints a one-time link to set the password |
| `npm run test:e2e` | End-to-end tests against a production build on an isolated database (port 3200). First time: `npx playwright install chromium` |

## Going live (Vercel)

1. **Database** — add the Turso integration (or set `DATABASE_URL` and `DATABASE_AUTH_TOKEN`). Production applies pending migrations when it starts (`src/server/bootstrap.ts`).
2. **Files** — connect a **private** Vercel Blob store and set `STORAGE_DRIVER=vercel-blob`.
3. **Secrets** — `AUTH_SECRET` (`openssl rand -base64 48`), `CRON_SECRET` (16+ chars).
4. **Domain** — `APP_URL=https://<domain>` (no trailing slash). Canonical URLs, sitemap, structured data and email links use it.
5. **Email** — verify the sending domain in Resend; set `RESEND_API_KEY`, `EMAIL_FROM`, and optionally `SECRETARIAT_EMAIL`.
   To launch before email is ready, set `EMAIL_DELIVERY=off` instead (messages are kept in the outbox; `EMAIL_FROM` is then optional).
6. **Security** — set `REQUIRE_STAFF_MFA=1` so staff, reviewers and Commission members must use an authenticator app.
7. **First administrator** — set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_TOKEN` (`openssl rand -hex 32`) for Production and redeploy; within 24 hours open `/portal/reset/<token>` to choose a password, then remove both variables. (Alternatively, `npm run admin:create -- "Name" admin@domain` against the production database.) Then create staff accounts in *Users & access*.
8. **Content** — in *Site content*, enter the Secretariat's official email, telephone and address.
9. **Search** — set `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION`, register the site in Google Search Console and Bing Webmaster Tools, submit `/sitemap.xml`. Replace the generated social image when the official logo is available (`src/app/opengraph-image.tsx`, `src/app/icon.tsx`).

The build and the server refuse to start on Vercel production/preview with a missing or placeholder setting
(`src/env.ts`), and `DEMO_MODE` is refused in production.

## Project layout

```
src/app/(site)/…          public website (server-rendered)
src/app/portal/(auth)/…   sign-in, account request, password reset, two-step verification
src/app/portal/(app)/…    portal modules (one folder per module)
src/app/api/…             file downloads, weekly digest
src/server/actions/…      server actions (each checks the role)
src/server/…              auth, email, storage, notifications, audit, queries
src/db/schema.ts          data model
src/content/site.ts       official Council texts (from the approved prototype)
src/lib/domain.ts         pathway stages, checklists, roles and modules
tests/e2e/…               Playwright tests
docs/PROTOTYPE-REVIEW.md  review of the prototype and decisions
```
