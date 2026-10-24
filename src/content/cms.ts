/**
 * Editable institutional content ("update institutional information without coding").
 *
 * Every block has a field schema (drives the portal editor and server validation) and a default: the official text
 * in ./site.ts. Lists whose length the system depends on are fixed: 8 pathway stages, 12 standards, 8 program standards, 3 classifications,
 * vision/mission/purpose. Editors can reword them but not add or remove entries.
 */
import { ACCREDITATION_OBJECTIVES, CLASSES, ELIGIBILITY, ETHICS, EXECUTIVE, FAQS, GOVERNANCE, GOVERNING_BODIES, OBJECTIVES, PILLARS, POLICIES, PROCESS, PROGRAM_ACCREDITATION as PA, ACCREDITATION_BENEFITS as AB, STANDARDS, VALUES, VMP } from "./site";

export type Field =
  | { name: string; label: string; type: "text"; max?: number; hint?: string }
  | { name: string; label: string; type: "textarea"; max?: number; rows?: number; hint?: string }
  /** textarea; blank lines separate paragraphs → string[] */
  | { name: string; label: string; type: "paragraphs"; hint?: string }
  /** textarea; one entry per line → string[] */
  | { name: string; label: string; type: "lines"; hint?: string }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; hint?: string }
  | { name: string; label: string; type: "date"; hint?: string };

export type Block =
  | { kind: "object"; fields: Field[] }
  | { kind: "list"; item: Field[]; itemLabel: (v: Record<string, unknown>, i: number) => string; fixed?: boolean; min?: number; max?: number }
  | { kind: "strings"; itemLabel: string; fixed?: boolean; min?: number; max?: number };

export type BlockDef = { key: string; group: string; title: string; description: string; usedOn: string; block: Block; default: unknown };

const t = (name: string, label: string, max = 300): Field => ({ name, label, type: "text", max });
const ta = (name: string, label: string, rows = 3, max = 4000): Field => ({ name, label, type: "textarea", rows, max });

export const BLOCKS: BlockDef[] = [
  /* Home */
  {
    key: "home.hero",
    group: "Home",
    title: "Homepage introduction",
    description: "The headline and introduction at the top of the homepage.",
    usedOn: "/",
    block: { kind: "object", fields: [t("eyebrow", "Line above the headline", 120), t("title", "Headline", 160), ta("lede", "Introduction", 3, 400)] },
    default: {
      eyebrow: "Accreditation · Quality Assurance · Institutional Integrity",
      title: "Advancing Excellence in Christian and Private Higher Education",
      lede: "Supporting institutional quality, academic integrity, ethical leadership, and continuous improvement in Christian higher education.",
    },
  },
  {
    key: "home.welcome",
    group: "Home",
    title: "Welcome to ACCPHE",
    description: "The welcome section and the guiding conviction quotation.",
    usedOn: "/",
    block: {
      kind: "object",
      fields: [t("title", "Heading", 160), { name: "paragraphs", label: "Text", type: "paragraphs", hint: "Separate paragraphs with a blank line." }, ta("quote", "Guiding conviction (quotation)", 3, 500)],
    },
    default: {
      title: "Strengthening Institutions. Advancing Educational Quality.",
      paragraphs: [
        "Higher education institutions play an essential role in developing knowledge, preparing professionals, strengthening communities, and shaping the leadership of future generations. Their effectiveness depends not only on the programs they offer, but on the integrity of their academic systems, the competence of their leadership, and their commitment to measurable educational outcomes.",
        "ACCPHE exists to promote these qualities within Christian and private higher education — providing a framework through which institutions examine their academic practices, strengthen governance, improve educational delivery, and demonstrate their commitment to established standards of quality and accountability.",
      ],
      quote: "Credible higher education must combine academic quality with institutional accountability and a sustained commitment to the development of competent, principled, and responsible graduates.",
    },
  },
  {
    key: "pillars",
    group: "Home",
    title: "Core pillars",
    description: "The four commitments that guide the Council’s work.",
    usedOn: "/",
    block: { kind: "list", fixed: true, item: [t("t", "Pillar", 120), ta("d", "Description", 4, 800)], itemLabel: (v, i) => `${["I", "II", "III", "IV"][i]}. ${v.t}` },
    default: PILLARS.map(({ t, d }) => ({ t, d })),
  },

  /* About */
  {
    key: "about.intro",
    group: "About Us",
    title: "Who we are",
    description: "Introduction to the Council, history, and the commitment to responsible accreditation.",
    usedOn: "/about",
    block: {
      kind: "object",
      fields: [
        t("title", "Heading", 160),
        { name: "paragraphs", label: "Who we are", type: "paragraphs", hint: "Separate paragraphs with a blank line." },
        { name: "history", label: "Institutional history", type: "paragraphs" },
        ta("commitmentLead", "Commitment to responsible accreditation — statement", 3, 500),
        ta("commitmentBody", "Commitment to responsible accreditation — explanation", 5, 1500),
      ],
    },
    default: {
      title: "An independent body for quality and integrity in higher education",
      paragraphs: [
        "The Accreditation & Compliance Council for Christian and Private Higher Education (ACCPHE) is an independent, internationally oriented quality assurance organization dedicated to advancing academic excellence, institutional integrity, and responsible governance in Christian and private higher education.",
        "Through institutional standards, structured evaluation, professional guidance, and continuous improvement frameworks, ACCPHE seeks to strengthen educational institutions and support their capacity to deliver academically sound, ethically grounded, and professionally relevant education.",
        "Recognizing the diversity of Christian higher education systems worldwide, ACCPHE encourages standards-based institutional improvement while respecting legitimate differences in educational mission, cultural context, and national regulatory requirements.",
      ],
      history: [
        "ACCPHE’s institutional concept responds to the need for a quality assurance framework that recognizes the distinctive missions of Christian and private higher education institutions while maintaining a strong commitment to academic credibility, ethical governance, and professional relevance.",
        "The Council’s development framework brings together institutional accreditation, membership, professional guidance, standards development, and international academic engagement.",
      ],
      commitmentLead: "Accreditation, institutional membership, government authorization, professional licensing, and academic qualification recognition are separate matters.",
      commitmentBody:
        "The Council communicates these distinctions clearly and expects participating institutions to represent their status accurately. Any accreditation awarded by ACCPHE must be supported by a formal decision and must not be described as equivalent to governmental authorization or recognition by another accrediting or regulatory body unless such equivalence has been independently established.",
    },
  },
  {
    key: "vmp",
    group: "About Us",
    title: "Vision, mission and purpose",
    description: "Shown on the homepage and the About page.",
    usedOn: "/about",
    block: { kind: "list", fixed: true, item: [ta("d", "Statement", 4, 800)], itemLabel: (_v, i) => ["Vision", "Mission", "Purpose"][i] },
    default: VMP.map(({ d }) => ({ d })),
  },
  {
    key: "values",
    group: "About Us",
    title: "Core values",
    description: "Principles that shape every evaluation.",
    usedOn: "/about",
    block: { kind: "list", min: 1, max: 12, item: [t("t", "Value", 120), ta("d", "Description", 3, 800)], itemLabel: (v) => String(v.t) },
    default: VALUES,
  },
  {
    key: "objectives",
    group: "About Us",
    title: "Strategic objectives",
    description: "The Council’s institutional objectives.",
    usedOn: "/about",
    block: { kind: "strings", itemLabel: "Objective", min: 1, max: 20 },
    default: OBJECTIVES,
  },

  /* Accreditation */
  {
    key: "accreditation.objectives",
    group: "Accreditation",
    title: "Objectives of accreditation",
    description: "What the accreditation framework seeks to achieve.",
    usedOn: "/accreditation",
    block: { kind: "strings", itemLabel: "Objective", min: 1, max: 16 },
    default: ACCREDITATION_OBJECTIVES,
  },
  {
    key: "eligibility",
    group: "Accreditation",
    title: "Institutional eligibility",
    description: "What applicants should be prepared to demonstrate.",
    usedOn: "/accreditation",
    block: { kind: "list", min: 1, max: 16, item: [t("t", "Requirement", 160), ta("d", "Description", 3, 800)], itemLabel: (v) => String(v.t) },
    default: ELIGIBILITY,
  },
  {
    key: "process",
    group: "Accreditation",
    title: "The evaluation pathway (8 stages)",
    description: "Public description of each stage. The portal’s eight stages follow this order.",
    usedOn: "/accreditation",
    block: { kind: "list", fixed: true, item: [t("t", "Stage", 160), ta("d", "Description", 3, 800)], itemLabel: (v, i) => `${i + 1}. ${v.t}` },
    default: PROCESS,
  },
  {
    key: "classes",
    group: "Accreditation",
    title: "Membership and accreditation classifications",
    description: "The three classifications. Keep the distinction between membership and accreditation explicit.",
    usedOn: "/accreditation",
    block: {
      kind: "list",
      fixed: true,
      item: [ta("short", "Short description (homepage)", 3, 600), t("note", "Note", 200), { name: "long", label: "Full description (Accreditation page)", type: "paragraphs" }],
      itemLabel: (_v, i) => CLASSES[i].t,
    },
    default: CLASSES.map(({ short, note, long }) => ({ short, note, long })),
  },
  {
    key: "faqs",
    group: "Accreditation",
    title: "Frequently asked questions",
    description: "Also published as structured FAQ data for search engines.",
    usedOn: "/accreditation#c-faq",
    block: { kind: "list", min: 1, max: 30, item: [t("q", "Question", 200), ta("a", "Answer", 4, 2000)], itemLabel: (v) => String(v.q) },
    default: FAQS,
  },
  {
    key: "benefits.intro",
    group: "Accreditation",
    title: "Benefits of accreditation — heading",
    description: "Title, tagline and introduction of the benefits section at the top of the Accreditation page.",
    usedOn: "/accreditation#c-benefits",
    block: { kind: "object", fields: [t("title", "Title", 200), t("tagline", "Tagline", 200), ta("intro", "Introduction", 3, 800)] },
    default: { title: AB.title, tagline: AB.tagline, intro: AB.intro },
  },
  {
    key: "benefits",
    group: "Accreditation",
    title: "Benefits of accreditation",
    description: "The academic and professional benefits listed on the Accreditation page.",
    usedOn: "/accreditation#c-benefits",
    block: { kind: "list", min: 1, max: 12, item: [t("t", "Benefit", 160), ta("d", "Description", 3, 800)], itemLabel: (v) => String(v.t) },
    default: AB.items,
  },
  {
    key: "programs.page",
    group: "Program Accreditation",
    title: "Independent Program Accreditation — page text",
    description: "Introduction, eligible programs, independence, what accredited programs receive, and the disclosure.",
    usedOn: "/accreditation/programs",
    block: {
      kind: "object",
      fields: [
        t("tagline", "Line under the page title", 200),
        { name: "intro", label: "Introduction", type: "paragraphs", hint: "Separate paragraphs with a blank line." },
        { name: "what", label: "What is Independent Program Accreditation?", type: "paragraphs" },
        { name: "eligible", label: "Programs eligible for review", type: "lines", hint: "One program type per line." },
        ta("eligibleNote", "Note under the eligible programs", 2, 600),
        { name: "independence", label: "Our commitment to institutional independence", type: "paragraphs" },
        ta("receiveIntro", "What accredited programs receive — introduction", 2, 400),
        { name: "receive", label: "What accredited programs receive", type: "lines", hint: "One item per line." },
        ta("receiveNote", "Note under what accredited programs receive", 2, 600),
        { name: "disclosure", label: "Important accreditation disclosure", type: "paragraphs" },
      ],
    },
    default: { tagline: PA.tagline, intro: PA.intro, what: PA.what, eligible: PA.eligible, eligibleNote: PA.eligibleNote, independence: PA.independence, receiveIntro: PA.receiveIntro, receive: PA.receive, receiveNote: PA.receiveNote, disclosure: PA.disclosure },
  },
  {
    key: "programs.standards",
    group: "Program Accreditation",
    title: "Program evaluation standards",
    description: "The eight areas reviewers rate each program against. Reviews depend on this list, so its length is fixed.",
    usedOn: "/accreditation/programs#p-standards",
    block: { kind: "list", fixed: true, item: [t("t", "Area", 160), ta("d", "Description", 3, 800)], itemLabel: (v) => String(v.t) },
    default: PA.standards,
  },
  {
    key: "programs.steps",
    group: "Program Accreditation",
    title: "How program accreditation works",
    description: "The steps from application to ongoing quality assurance.",
    usedOn: "/accreditation/programs#p-process",
    block: { kind: "list", min: 1, max: 12, item: [t("t", "Step", 160), ta("d", "Description", 3, 800)], itemLabel: (v, i) => `Step ${i + 1}: ${String(v.t)}` },
    default: PA.steps,
  },

  /* Standards */
  {
    key: "standards.meta",
    group: "Standards & Policies",
    title: "Status of the standards",
    description: "While proposed, the standards are described as recommended for formal adoption. Record adoption here once the Board approves them.",
    usedOn: "/standards",
    block: {
      kind: "object",
      fields: [
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "proposed", label: "Proposed (recommended for formal adoption)" },
            { value: "adopted", label: "Adopted by the Council" },
          ],
        },
        { name: "adoptedOn", label: "Date of adoption", type: "date", hint: "Required when the standards are adopted." },
      ],
    },
    default: { status: "proposed", adoptedOn: "" },
  },
  {
    key: "standards",
    group: "Standards & Policies",
    title: "The twelve standards",
    description: "Each standard’s statement, evaluation considerations and notes. Reviewers rate institutions against these titles.",
    usedOn: "/standards",
    block: {
      kind: "list",
      fixed: true,
      item: [t("t", "Title", 160), ta("s", "Standard statement", 3, 1000), { name: "items", label: "Evaluation considerations", type: "lines", hint: "One consideration per line." }, ta("note", "Note (optional)", 2, 800)],
      itemLabel: (v, i) => `${i + 1}. ${v.t}`,
    },
    default: STANDARDS.map((s) => ({ ...s, note: s.note ?? "" })),
  },
  {
    key: "ethics",
    group: "Standards & Policies",
    title: "Code of Ethics",
    description: "Principles governing the Council’s work.",
    usedOn: "/standards#s-ethics",
    block: { kind: "list", min: 1, max: 16, item: [t("t", "Principle", 120), ta("d", "Description", 3, 800)], itemLabel: (v) => String(v.t) },
    default: ETHICS,
  },

  /* Governance */
  {
    key: "bodies",
    group: "Governance",
    title: "Governing bodies (summary)",
    description: "Short list on the homepage.",
    usedOn: "/",
    block: { kind: "list", min: 1, max: 10, item: [t("t", "Body", 120), t("r", "Role", 200)], itemLabel: (v) => String(v.t) },
    default: GOVERNING_BODIES,
  },
  {
    key: "governance",
    group: "Governance",
    title: "Governing bodies (detail)",
    description: "Board, Commission, committees and councils with their responsibilities.",
    usedOn: "/governance",
    block: {
      kind: "list",
      fixed: true,
      item: [t("kicker", "Line above the name", 120), t("t", "Name", 120), { name: "intro", label: "Introduction", type: "paragraphs" }, { name: "items", label: "Principal responsibilities", type: "lines", hint: "One per line." }, ta("foot", "Note (optional)", 2, 800)],
      itemLabel: (v) => String(v.t),
    },
    default: GOVERNANCE.map((g) => ({ kicker: g.kicker, t: g.t, intro: g.intro, items: g.items, foot: g.foot ?? "" })),
  },
  {
    key: "executive",
    group: "Governance",
    title: "Executive structure",
    description: "Executive Secretariat roles.",
    usedOn: "/governance#g-exec",
    block: { kind: "list", min: 1, max: 16, item: [t("t", "Role", 160), ta("d", "Description", 3, 800)], itemLabel: (v) => String(v.t) },
    default: EXECUTIVE,
  },

  /* Policies */
  ...(["privacy", "accessibility", "terms"] as const).map((k): BlockDef => ({
    key: `policy.${k}`,
    group: "Policies",
    title: POLICIES[k].title,
    description: "Policy page text.",
    usedOn: `/${k}`,
    block: { kind: "object", fields: [t("title", "Title", 120), ta("lede", "Introduction", 2, 400), { name: "sections", label: "Sections", type: "paragraphs", hint: "Write each section as a heading line followed by its text; separate sections with a blank line." }] },
    default: { title: POLICIES[k].title, lede: POLICIES[k].lede, sections: POLICIES[k].sections.map((s) => `${s.h}\n${s.p}`) },
  })),
];

export const BLOCK_BY_KEY = Object.fromEntries(BLOCKS.map((b) => [b.key, b])) as Record<string, BlockDef>;
export const BLOCK_GROUPS = [...new Set(BLOCKS.map((b) => b.group))];
