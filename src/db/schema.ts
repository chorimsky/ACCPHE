import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * ACCPHE data model.
 *
 * The prototype kept everything in one localStorage document shared by the website and the portal. Here each
 * collection is a table, permissions are enforced on the server, and history (notes, votes, audit) is append-only.
 * Timestamps are stored as epoch milliseconds; calendar dates that people type (effective dates, article dates) are
 * stored as ISO "YYYY-MM-DD" strings so they never shift with time zones.
 */

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const ts = (name: string) => integer(name, { mode: "timestamp_ms" });
const now = () => ts("created_at").notNull().$defaultFn(() => new Date());

export const ROLES = ["admin", "officer", "editor", "ethics", "reviewer", "commission", "institution"] as const;
export type Role = (typeof ROLES)[number];
export const STAFF_ROLES: Role[] = ["admin", "officer", "editor", "ethics"];

export const USER_STATUS = ["pending", "active", "suspended"] as const;
export type UserStatus = (typeof USER_STATUS)[number];

/* ─────────── People and access ─────────── */

export const users = sqliteTable(
  "users",
  {
    id: id(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    position: text("position").notNull().default(""),
    /** Institution name (representatives), area of expertise (reviewers), or office (staff). */
    org: text("org").notNull().default(""),
    role: text("role", { enum: ROLES }).notNull(),
    status: text("status", { enum: USER_STATUS }).notNull().default("pending"),
    passwordHash: text("password_hash").notNull(),
    /** Inquiry reference typed when an institution representative requested access. */
    requestedRef: text("requested_ref").notNull().default(""),
    /** The application an institution representative may see. */
    applicationId: text("application_id"),
    totpSecret: text("totp_secret"),
    mfaEnabled: integer("mfa_enabled", { mode: "boolean" }).notNull().default(false),
    notifyAssign: integer("notify_assign", { mode: "boolean" }).notNull().default(true),
    notifyStatus: integer("notify_status", { mode: "boolean" }).notNull().default(true),
    notifyDigest: integer("notify_digest", { mode: "boolean" }).notNull().default(false),
    reviewedBy: text("reviewed_by"),
    reviewedAt: ts("reviewed_at"),
    lastLoginAt: ts("last_login_at"),
    createdAt: now(),
    updatedAt: ts("updated_at").notNull().$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email), index("users_role_status_idx").on(t.role, t.status)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    /** keyed hash of the cookie value — the raw id is never stored */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stage: text("stage", { enum: ["pending_mfa", "active"] }).notNull(),
    expiresAt: ts("expires_at").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: now(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const authTokens = sqliteTable(
  "auth_tokens",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: text("purpose", { enum: ["password_reset", "totp_used"] }).notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: ts("expires_at").notNull(),
    usedAt: ts("used_at"),
    createdAt: now(),
  },
  (t) => [index("auth_tokens_lookup_idx").on(t.purpose, t.tokenHash)],
);

/* ─────────── Accreditation pathway ─────────── */

export const PATHWAYS = ["Accreditation", "Associate Membership", "Distinguished Membership inquiry"] as const;
export type Pathway = (typeof PATHWAYS)[number];

export const CLASSIFICATIONS = ["Associate Member", "Accredited Institution", "Distinguished Member"] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

export const applications = sqliteTable(
  "applications",
  {
    id: id(),
    ref: text("ref").notNull(),
    name: text("name").notNull(),
    country: text("country").notNull().default(""),
    website: text("website").notNull().default(""),
    yearEstablished: text("year_established").notNull().default(""),
    type: text("type").notNull().default(""),
    authRef: text("auth_ref").notNull().default(""),
    repName: text("rep_name").notNull().default(""),
    repPosition: text("rep_position").notNull().default(""),
    repEmail: text("rep_email").notNull().default(""),
    repPhone: text("rep_phone").notNull().default(""),
    pathway: text("pathway", { enum: PATHWAYS }).notNull(),
    profile: text("profile").notNull().default(""),
    /** 0–7, see STAGES in src/lib/domain.ts */
    stage: integer("stage").notNull().default(0),
    officerId: text("officer_id").references(() => users.id, { onDelete: "set null" }),
    /** "" (none yet), a classification, or "Declined" */
    decision: text("decision").notNull().default(""),
    /** Stage checklists: { "<stage>": [true, false, …] } */
    checks: text("checks", { mode: "json" }).$type<Record<string, boolean[]>>().notNull().default(sql`'{}'`),
    source: text("source", { enum: ["website", "staff"] }).notNull().default("website"),
    submittedAt: ts("submitted_at").notNull().$defaultFn(() => new Date()),
    updatedAt: ts("updated_at").notNull().$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("applications_ref_uq").on(t.ref), index("applications_stage_idx").on(t.stage), index("applications_updated_idx").on(t.updatedAt)],
);

export const DOC_STATUS = ["Outstanding", "Submitted", "Received"] as const;
export type DocStatus = (typeof DOC_STATUS)[number];

/** The documents an institution must provide (one row per requirement per application). */
export const requirements = sqliteTable(
  "requirements",
  {
    id: id(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    status: text("status", { enum: DOC_STATUS }).notNull().default("Outstanding"),
    updatedAt: ts("updated_at").notNull().$defaultFn(() => new Date()),
  },
  (t) => [index("requirements_app_idx").on(t.applicationId, t.position)],
);

/** Uploaded files. requirementId is null for files sent with the public inquiry form. */
export const files = sqliteTable(
  "files",
  {
    id: id(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    requirementId: text("requirement_id").references(() => requirements.id, { onDelete: "set null" }),
    fileName: text("file_name").notNull(),
    storageKey: text("storage_key").notNull(),
    size: integer("size").notNull(),
    mimeType: text("mime_type").notNull(),
    uploadedById: text("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    uploadedByLabel: text("uploaded_by_label").notNull(),
    createdAt: now(),
  },
  (t) => [index("files_app_idx").on(t.applicationId), index("files_req_idx").on(t.requirementId)],
);

export const NOTE_KINDS = ["system", "staff", "message", "institution"] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];

export const applicationNotes = sqliteTable(
  "application_notes",
  {
    id: id(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: NOTE_KINDS }).notNull(),
    who: text("who").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    text: text("text").notNull(),
    createdAt: now(),
  },
  (t) => [index("notes_app_idx").on(t.applicationId, t.createdAt)],
);

export const RATINGS = ["met", "partial", "not"] as const;
export type Rating = (typeof RATINGS)[number];

/** One independent review per assigned reviewer per application. */
export const reviews = sqliteTable(
  "reviews",
  {
    id: id(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    reviewerId: text("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedById: text("assigned_by_id").references(() => users.id, { onDelete: "set null" }),
    coiConfirmedAt: ts("coi_confirmed_at"),
    conflictDeclaredAt: ts("conflict_declared_at"),
    ratings: text("ratings", { mode: "json" }).$type<(Rating | "")[]>().notNull(),
    comments: text("comments", { mode: "json" }).$type<string[]>().notNull(),
    summary: text("summary").notNull().default(""),
    submittedAt: ts("submitted_at"),
    createdAt: now(),
    updatedAt: ts("updated_at").notNull().$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("reviews_app_reviewer_uq").on(t.applicationId, t.reviewerId), index("reviews_reviewer_idx").on(t.reviewerId)],
);

export const VOTES = ["Award accreditation", "Admit as Associate Member", "Confer Distinguished Membership", "Decline", "Defer for further information", "Recused"] as const;
export type Vote = (typeof VOTES)[number];

export const votes = sqliteTable(
  "votes",
  {
    id: id(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    voterId: text("voter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vote: text("vote", { enum: VOTES }).notNull(),
    note: text("note").notNull().default(""),
    createdAt: now(),
  },
  (t) => [uniqueIndex("votes_app_voter_uq").on(t.applicationId, t.voterId)],
);

export const COMPLIANCE_TYPES = ["Annual report", "Substantive change notification"] as const;

export const complianceSubmissions = sqliteTable(
  "compliance_submissions",
  {
    id: id(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    type: text("type", { enum: COMPLIANCE_TYPES }).notNull(),
    text: text("text").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: now(),
  },
  (t) => [index("compliance_app_idx").on(t.applicationId)],
);

/* ─────────── Public directory ─────────── */

export const RECORD_STATUS = ["Draft", "Published", "Suspended", "Withdrawn", "Expired"] as const;
export type RecordStatus = (typeof RECORD_STATUS)[number];

export const records = sqliteTable(
  "records",
  {
    id: id(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    country: text("country").notNull(),
    cls: text("cls", { enum: CLASSIFICATIONS }).notNull(),
    /** YYYY-MM-DD */
    effective: text("effective").notNull().default(""),
    /** YYYY-MM-DD expiry or review date */
    review: text("review").notNull().default(""),
    scope: text("scope").notNull().default(""),
    conditions: text("conditions").notNull().default(""),
    status: text("status", { enum: RECORD_STATUS }).notNull().default("Draft"),
    verified: integer("verified", { mode: "boolean" }).notNull().default(false),
    applicationId: text("application_id").references(() => applications.id, { onDelete: "set null" }),
    /** When the record was first made public (drives "Membership developments"). */
    publishedAt: ts("published_at"),
    createdAt: now(),
    updatedAt: ts("updated_at").notNull().$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("records_slug_uq").on(t.slug), index("records_status_idx").on(t.status)],
);

/* ─────────── News & Insights ─────────── */

export const ARTICLE_CATEGORIES = ["Announcements", "Accreditation", "Standards", "Quality Assurance", "Governance", "Christian Higher Education"] as const;
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export const articles = sqliteTable(
  "articles",
  {
    id: id(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    category: text("category", { enum: ARTICLE_CATEGORIES }).notNull(),
    /** YYYY-MM-DD publication date shown on the website */
    date: text("date").notNull(),
    status: text("status", { enum: ["Draft", "Published"] }).notNull().default("Draft"),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull().default(""),
    createdAt: now(),
    updatedAt: ts("updated_at").notNull().$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("articles_slug_uq").on(t.slug), index("articles_status_date_idx").on(t.status, t.date)],
);

/* ─────────── Complaints & appeals ─────────── */

export const CASE_TYPES = ["Complaint", "Appeal"] as const;

export const cases = sqliteTable(
  "cases",
  {
    id: id(),
    ref: text("ref").notNull(),
    type: text("type", { enum: CASE_TYPES }).notNull(),
    subject: text("subject").notNull(),
    institution: text("institution").notNull().default(""),
    party: text("party").notNull().default(""),
    /** Where the determination is sent (optional). */
    partyEmail: text("party_email").notNull().default(""),
    /** The application concerned, for appeals against decisions. */
    applicationId: text("application_id").references(() => applications.id, { onDelete: "set null" }),
    details: text("details").notNull(),
    /** 0–4, see CASE_STAGES */
    stage: integer("stage").notNull().default(0),
    determination: text("determination").notNull().default(""),
    receivedAt: ts("received_at").notNull().$defaultFn(() => new Date()),
    updatedAt: ts("updated_at").notNull().$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("cases_ref_uq").on(t.ref)],
);

export const caseNotes = sqliteTable(
  "case_notes",
  {
    id: id(),
    caseId: text("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    who: text("who").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    text: text("text").notNull(),
    createdAt: now(),
  },
  (t) => [index("case_notes_case_idx").on(t.caseId, t.createdAt)],
);

/* ─────────── Website correspondence and content ─────────── */

export const MESSAGE_ROUTES = ["General inquiry", "Membership and accreditation", "Status verification", "Standards & Ethics Committee", "Account request"] as const;

export const messages = sqliteTable(
  "messages",
  {
    id: id(),
    name: text("name").notNull(),
    org: text("org").notNull().default(""),
    email: text("email").notNull(),
    route: text("route", { enum: MESSAGE_ROUTES }).notNull(),
    body: text("body").notNull(),
    read: integer("read", { mode: "boolean" }).notNull().default(false),
    /** Archived messages leave the inbox but are kept for the record. */
    archivedAt: ts("archived_at"),
    createdAt: now(),
  },
  (t) => [index("messages_inbox_idx").on(t.archivedAt, t.createdAt)],
);

/** Single row (id = 1): banner, status notice, and Secretariat contact details. */
export const siteContent = sqliteTable("site_content", {
  id: integer("id").primaryKey(),
  bannerOn: integer("banner_on", { mode: "boolean" }).notNull().default(false),
  bannerText: text("banner_text").notNull().default(""),
  notice: text("notice").notNull(),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  updatedAt: ts("updated_at").notNull().$defaultFn(() => new Date()),
});

/* ─────────── Operations ─────────── */

/** Append-only record of every change made through the portal or the website. */
export const auditLog = sqliteTable(
  "audit_log",
  {
    id: id(),
    actorId: text("actor_id"),
    /** Office shown in the log, e.g. "Accreditation Office" or "Website". */
    who: text("who").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    summary: text("summary").notNull(),
    ip: text("ip"),
    createdAt: now(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

export const emailOutbox = sqliteTable("email_outbox", {
  id: id(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  text: text("text").notNull(),
  html: text("html").notNull(),
  status: text("status", { enum: ["queued", "logged", "sent", "failed"] })
    .notNull()
    .default("queued"),
  error: text("error"),
  createdAt: now(),
});

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: ts("reset_at").notNull(),
});

/** Sequences for human references (ACC-2026-0001, CMP-2026-001). */
export const counters = sqliteTable("counters", {
  name: text("name").primaryKey(),
  value: integer("value").notNull(),
});

/* ─────────── Additions: CMS, status history, replies ─────────── */

/**
 * Editable institutional content (About, Accreditation, Standards, Governance, policies…). Each key holds one JSON
 * value; when a key is absent the official text in src/content/site.ts is used.
 */
export const contentBlocks = sqliteTable("content_blocks", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).$type<unknown>().notNull(),
  updatedById: text("updated_by_id").references(() => users.id, { onDelete: "set null" }),
  updatedAt: ts("updated_at").notNull().$defaultFn(() => new Date()),
});

/** Public history of a directory record (publication and every later change of status or classification). */
export const recordEvents = sqliteTable(
  "record_events",
  {
    id: id(),
    recordId: text("record_id")
      .notNull()
      .references(() => records.id, { onDelete: "cascade" }),
    status: text("status", { enum: RECORD_STATUS }).notNull(),
    cls: text("cls", { enum: CLASSIFICATIONS }).notNull(),
    /** YYYY-MM-DD the change takes effect */
    effective: text("effective").notNull(),
    note: text("note").notNull().default(""),
    createdAt: now(),
  },
  (t) => [index("record_events_record_idx").on(t.recordId, t.createdAt)],
);

/** Replies sent from the portal to website correspondents (also emailed). */
export const messageReplies = sqliteTable(
  "message_replies",
  {
    id: id(),
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    who: text("who").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: now(),
  },
  (t) => [index("message_replies_msg_idx").on(t.messageId)],
);
