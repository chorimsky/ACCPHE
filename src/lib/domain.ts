import type { Classification, Rating, Role, Vote } from "@/db/schema";

/** The eight-stage institutional evaluation pathway. Index = applications.stage. */
export const STAGES = [
  "Inquiry & orientation",
  "Eligibility review",
  "Formal application",
  "Self-study",
  "Independent evaluation",
  "Findings & response",
  "Decision",
  "Published & monitoring",
] as const;

export const LAST_STAGE = STAGES.length - 1;
export const DECISION_STAGE = 6;
export const EVALUATION_STAGE = 4;
export const FINDINGS_STAGE = 5;

/** Added to the document list when an application reaches Findings & response. */
export const RESPONSE_REQUIREMENT = "Institutional response to review findings";

export const STAGE_DESC = [
  "The Secretariat reviews the inquiry and shares standards, requirements, procedures, and applicable fees.",
  "Foundational institutional documents are reviewed to confirm eligibility to proceed.",
  "The institution submits its application, profile, declarations, and supporting documentation.",
  "The institution evaluates itself against the standards and prepares an evidence-based self-study report.",
  "Qualified reviewers assess the evidence; this may include interviews and an on-site or virtual evaluation.",
  "The institution may correct factual inaccuracies and respond to the review findings.",
  "The authorized body evaluates the review record and determines the institution’s status.",
  "The decision is recorded in the official directory, followed by reporting and periodic review.",
];

/** What the institution should do at each stage (shown in the institution's portal). */
export const INSTITUTION_ACTIONS = [
  "No action required. The Secretariat is reviewing your inquiry and will contact you with next steps.",
  "Provide foundational documents for the preliminary eligibility review.",
  "Complete the formal application, institutional profile, and required declarations.",
  "Prepare and upload your evidence-based self-study report against the twelve standards.",
  "Make personnel and records available to the review team for the independent evaluation.",
  "Review the findings and submit your institutional response within the stated period.",
  "No action required. The authorized body is considering the review record.",
  "Maintain compliance, submit required reports, and disclose any substantive institutional changes.",
];

/** Staff checklist for each stage. */
export const STAGE_CHECKS: string[][] = [
  ["Inquiry acknowledged and reference issued", "Standards, requirements, and fees shared with the institution", "Responsible officer assigned"],
  ["Legal establishment and authorization verified", "Mission and governance framework reviewed", "Eligibility outcome communicated to the institution"],
  ["Application form and declarations complete", "Institutional profile received", "Supporting documentation logged"],
  ["Self-study guidance provided", "Self-study report received", "Report checked for completeness against all twelve standards"],
  ["Review team appointed with conflict-of-interest declarations", "Evidence review and interviews completed", "Evaluation findings documented"],
  ["Findings issued to the institution", "Institutional response received or deadline passed", "Review record finalized"],
  ["Review record submitted to the authorized body", "Deliberations documented"],
  ["Directory record verified and published", "Reporting and review schedule communicated"],
];

/** Documents every application must provide. */
export const REQUIREMENTS = [
  "Legal establishment and authorization",
  "Governance framework and policies",
  "Academic catalog and curricula",
  "Faculty qualifications register",
  "Financial statements (two most recent years)",
  "Internal quality assurance policy",
  "Self-study report",
];

export const INSTITUTION_TYPES = ["University", "College", "Seminary / theological institution", "Institute / school", "Other"];

export const CASE_STAGES = ["Received", "Jurisdiction review", "Response requested", "Under review", "Determined"] as const;
export const CASE_CLOSED = CASE_STAGES.length - 1;

export const STANDARD_TITLES = [
  "Institutional Mission and Identity",
  "Legal Authorization and Regulatory Compliance",
  "Governance and Institutional Leadership",
  "Academic Programs and Curriculum",
  "Faculty Qualifications and Development",
  "Teaching, Learning, and Student Assessment",
  "Student Admission, Support, and Protection",
  "Institutional Resources and Infrastructure",
  "Financial Integrity and Institutional Sustainability",
  "Internal Quality Assurance and Continuous Improvement",
  "Ethical Leadership and Faith or Values Integration",
  "Professional Relevance and Societal Contribution",
];

export const RATING_LABELS: Record<Rating, string> = { met: "Met", partial: "Partially met", not: "Not met" };

/** Commission vote options (Recused is recorded through its own button). */
export const VOTE_OPTIONS: Exclude<Vote, "Recused">[] = ["Award accreditation", "Admit as Associate Member", "Confer Distinguished Membership", "Decline", "Defer for further information"];

/** How staff record the authorized body's decision. */
export const DECISION_LABELS: Record<Classification, string> = {
  "Associate Member": "Admit as Associate Member",
  "Accredited Institution": "Award accreditation",
  "Distinguished Member": "Confer Distinguished Membership",
};

/* ─────────── Roles and portal modules ─────────── */

export const MODULES = {
  overview: { title: "Overview", sub: "Activity across the Council’s work", href: "/portal/overview" },
  applications: { title: "Applications", sub: "Institutional inquiries and accreditation evaluations", href: "/portal/applications" },
  directory: { title: "Directory records", sub: "Verified records published to the public directory", href: "/portal/directory" },
  news: { title: "News & articles", sub: "Articles and announcements published to the website", href: "/portal/news" },
  cases: { title: "Complaints & appeals", sub: "Cases handled under published procedures", href: "/portal/cases" },
  messages: { title: "Messages", sub: "Correspondence received through the website", href: "/portal/messages" },
  content: { title: "Site content", sub: "Institutional information shown on the public website", href: "/portal/content" },
  users: { title: "Users & access", sub: "Account requests and portal access", href: "/portal/users" },
  reports: { title: "Reports & audit", sub: "Operational statistics and the complete activity record", href: "/portal/reports" },
  reviews: { title: "My reviews", sub: "Independent evaluations assigned to you", href: "/portal/reviews" },
  decisions: { title: "Decisions", sub: "Applications awaiting Commission deliberation", href: "/portal/decisions" },
  myapp: { title: "My application", sub: "Your institution’s evaluation pathway", href: "/portal/my-application" },
  account: { title: "Account settings", sub: "Profile, notifications, and security", href: "/portal/account" },
} as const;

export type ModuleKey = keyof typeof MODULES;

export const ROLE_INFO: Record<Role, { label: string; who: string; desc: string; modules: ModuleKey[] }> = {
  admin: {
    label: "Administrator",
    who: "Executive Secretariat",
    desc: "Full access to every module",
    modules: ["overview", "applications", "directory", "news", "cases", "messages", "content", "users", "reports"],
  },
  officer: { label: "Accreditation Officer", who: "Accreditation Office", desc: "Applications and directory records", modules: ["overview", "applications", "directory"] },
  editor: { label: "Communications Editor", who: "Communications Office", desc: "Articles, messages, and site content", modules: ["overview", "news", "messages", "content"] },
  ethics: { label: "Standards & Ethics Officer", who: "Standards & Ethics Committee", desc: "Complaints, appeals, and messages", modules: ["overview", "cases", "messages"] },
  reviewer: { label: "Institutional Reviewer", who: "Review Team Member", desc: "Evaluate assigned institutions against the standards", modules: ["reviews"] },
  commission: { label: "Accreditation Commission Member", who: "Accreditation Commission", desc: "Deliberate and vote on accreditation decisions", modules: ["decisions"] },
  institution: { label: "Institution Representative", who: "Institution", desc: "Track your institution’s application", modules: ["myapp"] },
};

/** Roles that may be requested from the sign-up page (staff accounts are created by an administrator). */
export const SELF_SERVICE_ROLES = ["institution", "reviewer"] as const satisfies readonly Role[];

export function canAccess(role: Role, mod: ModuleKey): boolean {
  return mod === "account" || ROLE_INFO[role].modules.includes(mod);
}

export function homeFor(role: Role): string {
  return MODULES[ROLE_INFO[role].modules[0]].href;
}

/** Number of non-recused Commission votes at which staff are prompted to record the decision. */
export const COMMISSION_QUORUM = Number(process.env.COMMISSION_QUORUM ?? 3) || 3;
