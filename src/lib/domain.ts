import type { AppKind, Classification, DistinctionCode, Rating, Role, Vote } from "@/db/schema";

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

/* ─────────── Independent Program Accreditation ─────────── */

/** The six published steps of program accreditation (/accreditation/programs). Index = applications.stage. */
export const PROGRAM_STAGES = [
  "Application",
  "Documentation & self-evaluation",
  "Independent program review",
  "Accreditation decision",
  "Certification & public verification",
  "Ongoing quality assurance",
] as const;

export const PROGRAM_STAGE_DESC = [
  "The provider has identified the program, its objectives, intended learners, delivery model, and responsible education provider.",
  "The provider supplies curriculum documentation, learning outcomes, assessment procedures, instructor qualifications, and quality assurance evidence.",
  "Qualified reviewers assess the program against the eight program evaluation standards; further evidence, interviews, or demonstrations may be requested.",
  "The authorized accreditation body considers the evaluation findings and determines whether the program is accredited or recognized.",
  "The program record — status, approved title, scope, validity period, and verification number — is verified and published.",
  "The provider maintains compliance and takes part in periodic monitoring, reporting, and renewal reviews.",
];

export const PROGRAM_ACTIONS = [
  "No action required. The Secretariat is reviewing your application and will confirm eligibility and the documents required.",
  "Upload the program documentation listed below, including your program self-evaluation against the eight standards.",
  "Make instructors, materials, and records available to the reviewers; respond to any request for further evidence.",
  "No action required. The authorized body is considering the evaluation findings.",
  "No action required. The Secretariat is preparing your certificate and the public program record.",
  "Maintain compliance with the program standards, report substantive changes, and prepare for renewal before the validity period ends.",
];

export const PROGRAM_CHECKS: string[][] = [
  ["Application acknowledged and reference issued", "Program within the scope of the framework", "Responsible officer assigned"],
  ["Curriculum, learning outcomes and assessment documents received", "Instructor qualifications received", "Program self-evaluation received"],
  ["Reviewers appointed with conflict-of-interest declarations", "Program assessed against the eight standards", "Evaluation findings documented"],
  ["Evaluation findings submitted to the authorized body", "Deliberations documented"],
  ["Program record verified and published", "Certificate and verification number issued", "Recognition statement or mark guidance sent"],
  ["Monitoring and renewal schedule communicated"],
];

export const PROGRAM_REQUIREMENTS = [
  "Program description and objectives",
  "Curriculum and syllabus",
  "Intended learning outcomes",
  "Assessment and certification procedures",
  "Instructor qualifications",
  "Learning resources and learner support",
  "Program self-evaluation against the eight standards",
];

/** The published list of programs eligible for review (also the default text on /accreditation/programs). */
export const PROGRAM_CATEGORIES = [
  "Professional certificate and diploma programs",
  "Executive education and leadership development programs",
  "Continuing Professional Development (CPD) courses",
  "Business, entrepreneurship, and management training",
  "Christian ministry and theological certificate programs",
  "Digital transformation, artificial intelligence, and technology training",
  "Vocational and workforce development programs",
  "Professional coaching, consulting, and facilitation programs",
  "Short courses, microcredentials, and specialized learning pathways",
  "Innovative interdisciplinary and industry-focused educational programs",
];

export const PROVIDER_TYPES = ["University", "College", "Christian institution or seminary", "Professional academy", "Training organization", "Independent education provider", "Other"];
export const PROGRAM_DELIVERY = ["In person", "Online", "Blended"];

/* ─────────── College of Fellows & Professional Distinctions ─────────── */

export const DISTINCTION_GROUPS = ["Council Fellowship", "Professional Certification", "Distinguished Council Recognition"] as const;

/** The College's distinctions, in the order shown on /fellows. Certifications are renewed; the others do not expire. */
export const DISTINCTIONS: { code: DistinctionCode; t: string; group: (typeof DISTINCTION_GROUPS)[number] }[] = [
  { code: "FACCPHE", t: "Fellow of ACCPHE", group: "Council Fellowship" },
  { code: "SFACCPHE", t: "Senior Fellow of ACCPHE", group: "Council Fellowship" },
  { code: "DFACCPHE", t: "Distinguished Fellow of ACCPHE", group: "Council Fellowship" },
  { code: "FCLM", t: "Fellow in Christian Leadership & Ministry", group: "Council Fellowship" },
  { code: "CCHEP", t: "Certified Christian Higher Education Professional", group: "Professional Certification" },
  { code: "DCEL", t: "Distinguished Christian Educational Leader", group: "Distinguished Council Recognition" },
  { code: "DCS-ACCPHE", t: "Distinguished Christian Scholar", group: "Distinguished Council Recognition" },
  { code: "DCME", t: "Distinguished Christian Ministry Educator", group: "Distinguished Council Recognition" },
];

export const distinction = (code: string) => DISTINCTIONS.find((d) => d.code === code);
/** "Fellow of ACCPHE (FACCPHE)" */
export const distinctionLabel = (code: string) => {
  const d = distinction(code);
  return d ? `${d.t} (${d.code})` : code;
};
/** Years a certification is valid before renewal. */
export const CERTIFICATION_YEARS = 3;

export const FELLOW_ROUTES = ["Application", "Nomination"] as const;

export const FELLOW_STAGES = [
  "Application or nomination",
  "Eligibility & documentation review",
  "Professional & ethical assessment",
  "Review & decision",
  "Formal recognition & registration",
  "Continued professional standing",
] as const;

export const FELLOW_STAGE_DESC = [
  "The application or nomination, with the professional information and supporting documentation required, has been received.",
  "The College Secretariat reviews the submission for completeness and verifies the preliminary eligibility requirements.",
  "Qualified reviewers evaluate the candidate’s credentials, experience, contributions, professional standing and evidence against the applicable standards.",
  "The appropriate credentialing or recognition body considers the assessment findings and decides in accordance with the College’s procedures.",
  "The candidate receives formal notification, the credential or distinction, and an official verification record.",
  "Recognized individuals remain subject to the College’s professional conduct requirements; certification holders meet renewal and continuing professional development requirements.",
];

export const FELLOW_ACTIONS = [
  "No action required. The College Secretariat is reviewing the submission and will confirm the documents required.",
  "Upload the evidence listed below: qualifications, curriculum vitae, publications or other contributions, and professional references.",
  "Respond to any request from the reviewers for further evidence or clarification.",
  "No action required. The recognition body is considering the assessment findings.",
  "No action required. The Secretariat is preparing the credential and the verification record.",
  "Maintain the College’s professional conduct requirements; certification holders complete continuing professional development before renewal.",
];

export const FELLOW_CHECKS: string[][] = [
  ["Submission acknowledged and reference issued", "Distinction sought confirmed", "Responsible officer assigned"],
  ["Curriculum vitae and qualifications received", "Evidence of contributions received", "Professional references received", "Ethics declaration received"],
  ["Reviewers appointed with conflict-of-interest declarations", "Candidate assessed against the assessment criteria", "Assessment findings documented"],
  ["Assessment findings submitted to the recognition body", "Deliberations documented"],
  ["Register entry verified and published", "Credential and verification number issued", "Guidance on use of the designation sent"],
  ["Conduct and renewal requirements communicated"],
];

export const FELLOW_REQUIREMENTS = [
  "Curriculum vitae",
  "Academic and professional qualifications",
  "Evidence of professional experience and leadership appointments",
  "Publications, research or educational resources (where applicable)",
  "Evidence of teaching, mentorship, ministry education or institutional contribution",
  "Professional references",
  "Declaration on professional ethics and conduct",
];

/* ─────────── Tracks: what differs between institutional and program evaluations ─────────── */

export type Track = {
  kind: AppKind;
  /** "Institutional accreditation" / "Program accreditation" */
  label: string;
  /** Whom the applicant represents: "institution" / "provider" */
  party: string;
  stages: readonly string[];
  desc: string[];
  actions: string[];
  checks: string[][];
  requirements: string[];
  /** Stage at which reviewers may submit their reports. */
  evaluationStage: number;
  /** Stage at which the applicant answers the findings (none for programs). */
  findingsStage: number | null;
  /** Stage at which the authorized body decides; recording the decision moves to decisionStage + 1. */
  decisionStage: number;
  lastStage: number;
  /** Number of standards each reviewer rates. */
  standards: number;
  voteOptions: Exclude<Vote, "Recused">[];
  /** Decisions staff can record (besides "Declined"), with button labels. */
  decisions: { value: string; label: string }[];
};

export const TRACKS: Record<AppKind, Track> = {
  institution: {
    kind: "institution",
    label: "Institutional accreditation",
    party: "institution",
    stages: STAGES,
    desc: STAGE_DESC,
    actions: INSTITUTION_ACTIONS,
    checks: STAGE_CHECKS,
    requirements: REQUIREMENTS,
    evaluationStage: EVALUATION_STAGE,
    findingsStage: FINDINGS_STAGE,
    decisionStage: DECISION_STAGE,
    lastStage: LAST_STAGE,
    standards: STANDARD_TITLES.length,
    voteOptions: VOTE_OPTIONS,
    decisions: (Object.entries(DECISION_LABELS) as [string, string][]).map(([value, label]) => ({ value, label })),
  },
  program: {
    kind: "program",
    label: "Program accreditation",
    party: "provider",
    stages: PROGRAM_STAGES,
    desc: PROGRAM_STAGE_DESC,
    actions: PROGRAM_ACTIONS,
    checks: PROGRAM_CHECKS,
    requirements: PROGRAM_REQUIREMENTS,
    evaluationStage: 2,
    findingsStage: null,
    decisionStage: 3,
    lastStage: PROGRAM_STAGES.length - 1,
    standards: 8,
    voteOptions: ["Award program accreditation", "Grant program recognition", "Decline", "Defer for further information"],
    decisions: [
      { value: "Accredited Program", label: "Award program accreditation" },
      { value: "Recognized Program", label: "Grant program recognition" },
    ],
  },
  fellow: {
    kind: "fellow",
    label: "College of Fellows",
    party: "candidate",
    stages: FELLOW_STAGES,
    desc: FELLOW_STAGE_DESC,
    actions: FELLOW_ACTIONS,
    checks: FELLOW_CHECKS,
    requirements: FELLOW_REQUIREMENTS,
    evaluationStage: 2,
    findingsStage: null,
    decisionStage: 3,
    lastStage: FELLOW_STAGES.length - 1,
    standards: 6,
    voteOptions: ["Confer the distinction sought", "Confer a different distinction", "Decline", "Defer for further information"],
    decisions: DISTINCTIONS.map((d) => ({ value: d.code, label: `Confer ${d.code}` })),
  },
};

export const trackOf = (a: { kind: AppKind }) => TRACKS[a.kind] ?? TRACKS.institution;

/** Open = not declined and not yet in the final (monitoring) stage. */
export const isOpen = (a: { kind: AppKind; stage: number; decision: string }) => a.decision !== "Declined" && a.stage < trackOf(a).lastStage;
/** Waiting for the authorized body's decision. */
export const awaitingDecision = (a: { kind: AppKind; stage: number; decision: string }) => a.stage === trackOf(a).decisionStage && !a.decision;

/** The heading for an application: the program title for programs, the candidate or institution otherwise. */
export const appTitle = (a: { kind: AppKind; name: string; programTitle: string }) => (a.kind === "program" && a.programTitle ? a.programTitle : a.name);

/* ─────────── Roles and portal modules ─────────── */

export const MODULES = {
  overview: { title: "Overview", sub: "Activity across the Council’s work", href: "/portal/overview" },
  applications: { title: "Applications", sub: "Institutional and program evaluations", href: "/portal/applications" },
  directory: { title: "Directory records", sub: "Verified institution and program records published to the public directories", href: "/portal/directory" },
  news: { title: "News & articles", sub: "Articles and announcements published to the website", href: "/portal/news" },
  cases: { title: "Complaints & appeals", sub: "Cases handled under published procedures", href: "/portal/cases" },
  messages: { title: "Messages", sub: "Correspondence received through the website", href: "/portal/messages" },
  content: { title: "Site content", sub: "Institutional information shown on the public website", href: "/portal/content" },
  users: { title: "Users & access", sub: "Account requests and portal access", href: "/portal/users" },
  reports: { title: "Reports & audit", sub: "Operational statistics and the complete activity record", href: "/portal/reports" },
  reviews: { title: "My reviews", sub: "Independent evaluations assigned to you", href: "/portal/reviews" },
  decisions: { title: "Decisions", sub: "Applications awaiting Commission deliberation", href: "/portal/decisions" },
  myapp: { title: "My application", sub: "Your evaluation pathway", href: "/portal/my-application" },
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
