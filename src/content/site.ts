/**
 * Official public content of the Council, carried over verbatim from the approved prototype
 * (ACCPHE Website v2 + accphe-content.js). Editable institutional details (banner, status notice, contact details),
 * articles and directory records live in the database and are managed in the portal.
 */
import { PROGRAM_CATEGORIES } from "@/lib/domain";


export type TextItem = { t: string; d: string };

export const VMP: TextItem[] = [
  {
    "t": "Vision",
    "d": "To become a respected international reference point for academic quality, institutional integrity, ethical leadership, and continuous improvement in Christian and private higher education."
  },
  {
    "t": "Mission",
    "d": "To accredit and recognize eligible Christian and private higher education institutions through rigorous, transparent, and evidence-based quality assurance processes that promote transformative education and cultivate graduates equipped for leadership, professional influence, and ethical responsibility."
  },
  {
    "t": "Purpose",
    "d": "To strengthen the quality, credibility, accountability, and societal contribution of Christian and private higher education institutions through institutional evaluation, professional guidance, standards development, and continuous improvement."
  }
];

export const PILLARS: { n: string; t: string; d: string }[] = [
  {
    "n": "I",
    "t": "Faith & Values Integration",
    "d": "We support Christian institutions in preserving their stated faith-based educational identity while encouraging all participating institutions to demonstrate ethical leadership, institutional integrity, and respect for their educational commitments."
  },
  {
    "n": "II",
    "t": "Academic Excellence",
    "d": "We promote rigorous academic standards, meaningful learning outcomes, responsible assessment practices, and continuous evaluation of institutional and program quality."
  },
  {
    "n": "III",
    "t": "Market Relevance",
    "d": "We encourage institutions to align curricula, teaching practices, and graduate competencies with changing professional expectations, Kingdom principles, community needs, entrepreneurship, and responsible innovation."
  },
  {
    "n": "IV",
    "t": "Global Recognition",
    "d": "We seek to strengthen institutional credibility, promote transparent quality assurance practices, and support opportunities for international academic cooperation, subject to applicable recognition requirements."
  }
];

export const FRAMEWORK: { n: string; t: string }[] = [
  {
    "n": "01",
    "t": "Preparatory membership and institutional development"
  },
  {
    "n": "02",
    "t": "Eligibility assessment and accreditation application"
  },
  {
    "n": "03",
    "t": "Institutional self-study and supporting documentation"
  },
  {
    "n": "04",
    "t": "Independent evaluation and institutional review"
  },
  {
    "n": "05",
    "t": "Accreditation decisions and ongoing quality monitoring"
  }
];

export const CLASSES: { kind: string; t: string; plural: string; short: string; note: string; long: string[] }[] = [
  {
    "kind": "Membership",
    "t": "Associate Membership",
    "plural": "Associate Members",
    "short": "For institutions participating in the Council’s preparatory development framework — standards orientation, readiness guidance, and structured preparation for future evaluation.",
    "note": "Not an accreditation award.",
    "long": [
      "Associate Membership is intended for institutions participating in the Council’s preparatory institutional development framework. It may provide access to standards orientation, institutional readiness guidance, professional learning opportunities, and structured preparation for future accreditation evaluation.",
      "Associate Membership is not an accreditation award and must not be presented as evidence that the institution has satisfied the Council’s accreditation standards."
    ]
  },
  {
    "kind": "Accreditation",
    "t": "Accredited Institution",
    "plural": "Accredited Institutions",
    "short": "Reserved for institutions that have completed the approved evaluation process and received a formal accreditation award from the authorized Council body.",
    "note": "Each award states scope, effective date, review date, and conditions.",
    "long": [
      "Accredited Institution status is reserved for institutions that have successfully completed the approved evaluation process and received a formal accreditation award from the authorized Council body.",
      "The award must specify the accredited institution, scope of accreditation, effective date, expiry or review date, and any applicable conditions."
    ]
  },
  {
    "kind": "Designation",
    "t": "Distinguished Membership",
    "plural": "Distinguished Members",
    "short": "A separate designation recognizing exceptional educational leadership, institutional innovation, sustained excellence, or notable contribution to higher education.",
    "note": "A distinct recognition, separate from accreditation.",
    "long": [
      "Distinguished Membership is a separate institutional designation intended to recognize exceptional educational leadership, institutional innovation, sustained excellence, or notable contribution to higher education."
    ]
  }
];

/** Governing bodies (homepage summary). */
export const GOVERNING_BODIES: { t: string; r: string }[] = [
  {
    "t": "Board of Trustees",
    "r": "Strategic direction, policy approval, and financial oversight"
  },
  {
    "t": "Accreditation Commission",
    "r": "Independent evaluation and accreditation decisions"
  },
  {
    "t": "Standards & Ethics Committee",
    "r": "Ethical conduct, complaints, and appeals"
  },
  {
    "t": "Academic Advisory Council",
    "r": "Academic expertise and educational relevance"
  },
  {
    "t": "Regional Councils",
    "r": "Regional engagement and institutional relations"
  },
  {
    "t": "Executive Secretariat",
    "r": "Administration and implementation of policy"
  }
];

export const VALUES: TextItem[] = [
  {
    "t": "Academic Integrity",
    "d": "We uphold intellectual honesty, rigorous scholarship, responsible assessment, and truthful representation of academic qualifications and institutional achievements."
  },
  {
    "t": "Institutional Accountability",
    "d": "We encourage clear governance structures, reliable records, fulfilled responsibilities, and measurable educational outcomes."
  },
  {
    "t": "Independence and Impartiality",
    "d": "Accreditation decisions should rest on documented evidence, approved standards, and independent professional judgment, free from improper influence or conflicts of interest."
  },
  {
    "t": "Ethical Leadership",
    "d": "We promote leadership characterized by honesty, stewardship, responsibility, fairness, and respect for the individuals and communities served."
  },
  {
    "t": "Faith and Values",
    "d": "We respect the distinctive missions of Christian institutions and encourage the responsible integration of faith and learning, while requiring ethical conduct across all participating institutions."
  },
  {
    "t": "Continuous Improvement",
    "d": "Quality assurance is an ongoing responsibility rather than a single evaluation event. Institutions should regularly assess their effectiveness and respond constructively."
  },
  {
    "t": "Global Engagement",
    "d": "We encourage professional cooperation across national and regional boundaries while respecting applicable laws, regulatory systems, and institutional diversity."
  }
];

export const OBJECTIVES: string[] = [
  "Establish and maintain a coherent framework of accreditation and quality assurance standards.",
  "Support Christian and private higher education institutions in strengthening academic quality and institutional effectiveness.",
  "Promote responsible governance, financial accountability, and ethical institutional leadership.",
  "Encourage evidence-based teaching, learning, assessment, and educational improvement.",
  "Advance the integration of Christian institutional identity and ethical educational practice.",
  "Strengthen curriculum relevance, employability, entrepreneurship, and community engagement.",
  "Facilitate institutional development through training, advisory activities, and professional engagement.",
  "Encourage international academic cooperation and the exchange of quality assurance practices.",
  "Maintain transparent processes for accreditation decisions, institutional status verification, complaints, and appeals.",
  "Promote continuous improvement through institutional reporting, periodic review, and ongoing compliance monitoring."
];

export const ACCREDITATION_OBJECTIVES: string[] = [
  "Promote academic integrity and the quality of teaching and learning.",
  "Assess the effectiveness of institutional governance and administration.",
  "Encourage qualified faculty, appropriate learning resources, and effective student support.",
  "Strengthen institutional planning, assessment, and continuous improvement.",
  "Support responsible financial management and organizational sustainability.",
  "Encourage relevant educational programs and meaningful graduate outcomes.",
  "Promote truthful public communication and ethical institutional conduct.",
  "Provide a structured basis for periodic institutional review and accountability."
];

export const ELIGIBILITY: TextItem[] = [
  {
    "t": "Legal and institutional identity",
    "d": "Documentary evidence of legal establishment and authorization to conduct educational activities in the relevant jurisdiction."
  },
  {
    "t": "Educational mission",
    "d": "A clearly articulated mission, institutional objectives, and governance framework."
  },
  {
    "t": "Academic operations",
    "d": "Active educational programs, defined learning outcomes, curriculum structures, and appropriate assessment procedures."
  },
  {
    "t": "Faculty and academic leadership",
    "d": "Appropriate qualifications, responsibilities, and academic oversight arrangements."
  },
  {
    "t": "Institutional resources",
    "d": "Adequate learning facilities, digital infrastructure, library resources, and student support relative to the delivery model."
  },
  {
    "t": "Financial and administrative capacity",
    "d": "Responsible financial management, administrative continuity, and institutional sustainability."
  },
  {
    "t": "Quality assurance",
    "d": "Documented internal processes for monitoring educational quality and implementing improvement measures."
  },
  {
    "t": "Ethical compliance",
    "d": "Policies addressing academic integrity, institutional conduct, student protection, complaints, and accurate public representation."
  }
];

export const PROCESS: TextItem[] = [
  {
    "t": "Initial Inquiry and Institutional Orientation",
    "d": "The institution submits an inquiry and receives information about the Council’s standards, eligibility requirements, application procedures, and applicable fees."
  },
  {
    "t": "Preliminary Eligibility Review",
    "d": "The Council reviews foundational institutional documents to determine whether the applicant meets the requirements to proceed."
  },
  {
    "t": "Formal Application",
    "d": "The institution submits its application, institutional profile, required declarations, and supporting documentation."
  },
  {
    "t": "Institutional Self-Study",
    "d": "The applicant conducts a systematic internal evaluation against the approved standards and prepares an evidence-based self-study report."
  },
  {
    "t": "Independent Evaluation",
    "d": "Qualified reviewers assess the application, self-study, and evidence. The review may include interviews, document verification, and an on-site or authorized virtual evaluation."
  },
  {
    "t": "Review Findings and Institutional Response",
    "d": "The institution may address factual inaccuracies, respond to findings, and provide additional evidence within established procedures."
  },
  {
    "t": "Accreditation Decision",
    "d": "The authorized decision-making body evaluates the review record and determines the institution’s status under approved policies."
  },
  {
    "t": "Publication and Ongoing Monitoring",
    "d": "Final decisions are recorded in the official directory. Accredited institutions remain subject to reporting, substantive change requirements, and periodic review."
  }
];

export const FAQS: { q: string; a: string }[] = [
  {
    "q": "What is institutional accreditation?",
    "a": "Institutional accreditation is an evaluation process through which an institution is assessed against established standards of academic quality, governance, resources, effectiveness, and continuous improvement."
  },
  {
    "q": "Is Associate Membership equivalent to accreditation?",
    "a": "No. Associate Membership indicates participation in the Council’s preparatory membership framework. It does not establish accredited status."
  },
  {
    "q": "Does accreditation automatically authorize an institution to award degrees?",
    "a": "ACCPHE accreditation strengthens institutional credibility by affirming commitment to academic excellence and quality standards. While degree-awarding authority remains subject to applicable national laws and regulations, accreditation provides valuable independent recognition that supports institutional development and educational integrity."
  },
  {
    "q": "Does ACCPHE accreditation guarantee international recognition of degrees?",
    "a": "ACCPHE accreditation positions institutions for greater international visibility, credibility, and potential academic partnerships. While recognition of degrees ultimately depends on relevant authorities and institutional policies, accreditation demonstrates commitment to established quality standards and strengthens an institution’s international profile."
  },
  {
    "q": "Can an institution lose its accreditation?",
    "a": "Under the approved monitoring and enforcement framework, accreditation may be subject to conditions, suspension, withdrawal, or expiration, as set out in published Council policy."
  },
  {
    "q": "How can the public verify an institution’s status?",
    "a": "The official institutional directory provides current, verifiable membership and accreditation information, including effective dates and any applicable conditions."
  }
];

export const STANDARDS: { t: string; s: string; items: string[]; note?: string }[] = [
  {
    "t": "Institutional Mission and Identity",
    "s": "The institution shall maintain a clearly defined mission that informs its academic programs, strategic priorities, institutional policies, and educational activities.",
    "items": [
      "Published mission, vision, and institutional objectives.",
      "Alignment between mission and academic operations.",
      "Evidence of mission-based institutional planning.",
      "Communication of institutional identity to stakeholders.",
      "Periodic assessment of mission fulfillment."
    ],
    "note": "Christian institutions should demonstrate consistency between their stated faith-based identity and their educational practices."
  },
  {
    "t": "Legal Authorization and Regulatory Compliance",
    "s": "The institution shall demonstrate lawful establishment and compliance with applicable educational, corporate, and regulatory requirements in the jurisdictions where it operates.",
    "items": [
      "Legal registration and institutional authorization.",
      "Applicable educational licenses or approvals.",
      "Compliance with degree-awarding requirements.",
      "Regulatory reporting and institutional disclosures.",
      "Compliance with relevant employment, financial, and student protection laws."
    ]
  },
  {
    "t": "Governance and Institutional Leadership",
    "s": "The institution shall maintain an effective governance structure that provides strategic direction, protects academic integrity, and ensures responsible institutional administration.",
    "items": [
      "Clearly defined governing authority.",
      "Documented leadership responsibilities.",
      "Appropriate separation of governance and management.",
      "Institutional policies and decision-making procedures.",
      "Leadership accountability and succession planning.",
      "Conflict-of-interest safeguards."
    ]
  },
  {
    "t": "Academic Programs and Curriculum",
    "s": "The institution shall offer academic programs with clearly defined objectives, appropriate academic content, coherent curriculum structures, and demonstrable educational outcomes.",
    "items": [
      "Program objectives and learning outcomes.",
      "Curriculum design and academic progression.",
      "Appropriate academic level and rigor.",
      "Periodic curriculum review.",
      "Program relevance and professional alignment.",
      "Academic assessment and examination procedures."
    ]
  },
  {
    "t": "Faculty Qualifications and Development",
    "s": "The institution shall appoint qualified academic personnel and provide appropriate conditions for effective teaching, scholarship, professional development, and academic leadership.",
    "items": [
      "Faculty qualifications and experience.",
      "Academic appointment procedures.",
      "Faculty workload and teaching responsibilities.",
      "Professional development opportunities.",
      "Teaching effectiveness assessment.",
      "Faculty participation in academic governance."
    ]
  },
  {
    "t": "Teaching, Learning, and Student Assessment",
    "s": "The institution shall implement educational practices that support meaningful learning, fair assessment, academic integrity, and demonstrable student achievement.",
    "items": [
      "Teaching and learning methodologies.",
      "Student assessment policies.",
      "Academic integrity procedures.",
      "Evaluation of learning outcomes.",
      "Student feedback mechanisms.",
      "Appropriate academic support and intervention."
    ]
  },
  {
    "t": "Student Admission, Support, and Protection",
    "s": "The institution shall establish fair, transparent, and appropriate policies governing student admission, progression, support, complaints, and academic records.",
    "items": [
      "Published admission requirements.",
      "Student orientation and academic advising.",
      "Student support and welfare services.",
      "Fair complaints and appeals procedures.",
      "Accurate academic records.",
      "Graduation requirements and certification controls.",
      "Appropriate safeguarding and nondiscrimination obligations."
    ]
  },
  {
    "t": "Institutional Resources and Infrastructure",
    "s": "The institution shall maintain resources sufficient to support its mission, academic programs, students, faculty, and administrative operations.",
    "items": [
      "Learning facilities and educational infrastructure.",
      "Library and information resources.",
      "Digital learning systems.",
      "Information technology support.",
      "Accessibility of educational resources.",
      "Maintenance, safety, and resource planning."
    ]
  },
  {
    "t": "Financial Integrity and Institutional Sustainability",
    "s": "The institution shall demonstrate responsible financial stewardship, transparent financial administration, and reasonable capacity to sustain its educational commitments.",
    "items": [
      "Financial planning and budgeting.",
      "Accounting records and internal controls.",
      "Financial reporting and independent review where required.",
      "Institutional revenue and expenditure management.",
      "Risk management and continuity planning.",
      "Student financial protection arrangements."
    ]
  },
  {
    "t": "Internal Quality Assurance and Continuous Improvement",
    "s": "The institution shall maintain a functioning internal quality assurance system that regularly evaluates institutional effectiveness and supports measurable improvement.",
    "items": [
      "Institutional quality assurance policies.",
      "Internal reviews and academic audits.",
      "Institutional performance indicators.",
      "Stakeholder feedback.",
      "Documented improvement plans.",
      "Evidence of completed corrective actions."
    ]
  },
  {
    "t": "Ethical Leadership and Faith or Values Integration",
    "s": "The institution shall demonstrate ethical conduct in its governance, academic operations, communications, and treatment of stakeholders.",
    "items": [
      "Institutional code of ethics.",
      "Academic honesty and professional conduct.",
      "Transparent institutional representations.",
      "Responsible treatment of students and employees.",
      "Mission-consistent faith integration, where applicable.",
      "Ethical handling of complaints and misconduct."
    ],
    "note": "Christian institutions shall additionally demonstrate appropriate integration of their stated faith commitments into institutional life."
  },
  {
    "t": "Professional Relevance and Societal Contribution",
    "s": "The institution shall demonstrate reasonable alignment between its educational programs and the professional, economic, cultural, and community needs relevant to its mission.",
    "items": [
      "Graduate competencies.",
      "Employer and professional stakeholder engagement.",
      "Entrepreneurship and innovation initiatives.",
      "Community engagement and service.",
      "Graduate outcome assessment.",
      "Periodic review of workforce and societal relevance."
    ]
  }
];

export const ETHICS: TextItem[] = [
  {
    "t": "Integrity",
    "d": "Council representatives shall act honestly and avoid misrepresentation in all official activities."
  },
  {
    "t": "Impartiality",
    "d": "Institutional evaluations shall be conducted objectively and without improper preference or prejudice."
  },
  {
    "t": "Confidentiality",
    "d": "Nonpublic information obtained during evaluation shall be protected and disclosed only in accordance with approved policy and applicable law."
  },
  {
    "t": "Conflict of Interest",
    "d": "Those involved in evaluation or decision-making shall disclose actual, potential, or perceived conflicts and recuse themselves when required."
  },
  {
    "t": "Professional Competence",
    "d": "Reviewers and decision-makers shall undertake responsibilities for which they possess appropriate qualifications and expertise."
  },
  {
    "t": "Transparency",
    "d": "The Council shall communicate its standards, procedures, decisions, and institutional classifications accurately."
  },
  {
    "t": "Accountability",
    "d": "Council officials shall remain subject to appropriate oversight, ethical review, and corrective procedures."
  },
  {
    "t": "Respect for Institutional Diversity",
    "d": "Evaluation shall recognize legitimate institutional differences while applying approved standards consistently."
  }
];

export const GOVERNANCE: { id: string; kicker: string; t: string; intro: string[]; items: string[]; foot?: string }[] = [
  {
    "id": "g-board",
    "kicker": "Highest governing authority",
    "t": "Board of Trustees",
    "intro": [
      "The Board of Trustees is responsible for institutional direction, policy approval, financial oversight, and the long-term sustainability of the organization.",
      "The Board provides strategic leadership while safeguarding the independence and integrity of the Council’s accreditation activities."
    ],
    "items": [
      "Establish the Council’s strategic direction and institutional priorities.",
      "Approve accreditation standards, major policies, and governance arrangements.",
      "Oversee institutional finances, financial accountability, and organizational sustainability.",
      "Safeguard the independence and credibility of accreditation activities.",
      "Authorize appropriate institutional partnerships and external engagements.",
      "Evaluate executive leadership and monitor organizational performance.",
      "Ensure the Council’s activities remain consistent with its mission and applicable legal obligations."
    ]
  },
  {
    "id": "g-commission",
    "kicker": "Independent evaluation and decisions",
    "t": "Accreditation Commission",
    "intro": [
      "The professional body responsible for overseeing institutional accreditation evaluation and making accreditation decisions under the Council’s approved standards and procedures.",
      "The Commission operates with appropriate independence from institutional applicants, commercial influence, and administrative interference."
    ],
    "items": [
      "Review and recommend improvements to accreditation criteria.",
      "Oversee institutional evaluation procedures.",
      "Appoint or authorize qualified institutional review teams.",
      "Review self-study reports, evaluation findings, and institutional responses.",
      "Make accreditation decisions within its formally delegated authority.",
      "Determine applicable conditions and monitoring requirements.",
      "Review institutional compliance and accreditation renewal matters.",
      "Authorize appropriate public disclosure of accreditation outcomes."
    ],
    "foot": "Decision-making procedures provide for reviewer independence, conflict-of-interest management, documented deliberations, and clear institutional notification."
  },
  {
    "id": "g-ethics",
    "kicker": "Fairness and professional integrity",
    "t": "Standards & Ethics Committee",
    "intro": [
      "Responsible for promoting ethical conduct, procedural fairness, and integrity in the Council’s activities."
    ],
    "items": [
      "Maintain and recommend updates to the Council’s Code of Ethics.",
      "Oversee conflict-of-interest requirements.",
      "Review allegations of ethical misconduct.",
      "Examine complaints and appeals within its delegated jurisdiction.",
      "Recommend corrective measures when ethical breaches are established.",
      "Promote transparency and procedural consistency.",
      "Prepare periodic ethics and compliance reports for the appropriate governing authority."
    ]
  },
  {
    "id": "g-regional",
    "kicker": "Regional engagement",
    "t": "Regional Councils",
    "intro": [
      "Regional Councils support the Council’s engagement with institutions across different regions, within the policies approved by the Board of Trustees.",
      "They are not decision-making bodies for accreditation; formal decisions remain with the Accreditation Commission."
    ],
    "items": [
      "Support awareness of the Council’s standards and procedures within their regions.",
      "Advise on regional higher education contexts and national regulatory environments.",
      "Facilitate professional learning and the exchange of quality assurance practice.",
      "Support approved international and regional partnerships.",
      "Refer complaints and concerns to the appropriate Council body.",
      "Report on regional activities to the Executive Secretariat."
    ]
  },
  {
    "id": "g-advisory",
    "kicker": "Academic expertise and relevance",
    "t": "Academic Advisory Council",
    "intro": [
      "Provides professional guidance on higher education quality, academic standards, curriculum relevance, and emerging educational developments.",
      "Its role is advisory, not a substitute for the Accreditation Commission’s formal decision-making responsibilities."
    ],
    "items": [
      "Advise on academic standards and educational quality.",
      "Recommend improvements to curriculum evaluation criteria.",
      "Examine developments in higher education and professional practice.",
      "Support appropriate alignment between education and workforce needs.",
      "Provide guidance on faith and values integration.",
      "Contribute to professional learning and institutional development initiatives."
    ]
  }
];

export const EXECUTIVE: TextItem[] = [
  {
    "t": "Executive Director / Chief Executive Officer",
    "d": "Provides executive leadership, manages institutional operations, implements approved policies, and reports to the Board of Trustees."
  },
  {
    "t": "Deputy Director, Accreditation",
    "d": "Coordinates accreditation applications, institutional evaluation procedures, reviewer administration, and accreditation records."
  },
  {
    "t": "Deputy Director, Research and Quality Assurance",
    "d": "Supports standards development, institutional research, quality assurance publications, and professional development activities."
  },
  {
    "t": "Deputy Director, International Relations",
    "d": "Coordinates approved international engagement, institutional partnerships, and regional relations."
  },
  {
    "t": "Program Officers",
    "d": "Support membership administration, institutional communications, events, reporting, and compliance monitoring."
  },
  {
    "t": "Administrative and Communications Personnel",
    "d": "Maintain institutional records, official correspondence, publications, and operational support services."
  }
];

/** Contact routes; the first four are offered on the contact form. */
export const CONTACT_ROUTES: TextItem[] = [
  {
    "t": "General inquiry",
    "d": "Questions about the Council, its mission, and its activities."
  },
  {
    "t": "Membership and accreditation",
    "d": "Pathways, eligibility, and application procedures."
  },
  {
    "t": "Program accreditation",
    "d": "Independent accreditation or recognition of a certificate, diploma, or training program."
  },
  {
    "t": "Status verification",
    "d": "Confirming an institution’s membership or accreditation status."
  },
  {
    "t": "Standards & Ethics Committee",
    "d": "Complaints, appeals, and ethical concerns, submitted in writing."
  }
];

export const PAGE_TOCS: Record<"about" | "accreditation", [string, string][]> = {
  "about": [
    [
      "a-intro",
      "Who we are"
    ],
    [
      "a-history",
      "Institutional history"
    ],
    [
      "a-vmp",
      "Vision, mission, purpose"
    ],
    [
      "a-values",
      "Core values"
    ],
    [
      "a-objectives",
      "Strategic objectives"
    ],
    [
      "a-commitment",
      "Responsible accreditation"
    ]
  ],
  "accreditation": [
    [
      "c-benefits",
      "Benefits"
    ],
    [
      "c-objectives",
      "Objectives"
    ],
    [
      "c-eligibility",
      "Eligibility"
    ],
    [
      "c-process",
      "The process"
    ],
    [
      "c-classes",
      "Classifications"
    ],
    [
      "c-programs",
      "Program accreditation"
    ],
    [
      "c-maintaining",
      "Maintaining accreditation"
    ],
    [
      "c-faq",
      "Questions"
    ]
  ]
};

/** [title, description] per public page. */
export const SEO: Record<string, [string, string]> = {
  "home": [
    "ACCPHE — Accreditation & Compliance Council for Christian and Private Higher Education",
    "Independent quality assurance and accreditation for Christian and private higher education institutions worldwide: standards, evaluation, governance, and the official institutional directory."
  ],
  "about": [
    "About the Council — Mission, Vision, Values | ACCPHE",
    "ACCPHE is an independent, internationally oriented quality assurance organization advancing academic excellence, institutional integrity, and responsible governance in Christian and private higher education."
  ],
  "programDirectory": [
    "Directory of Approved Programs & Verification | ACCPHE",
    "Verify ACCPHE program accreditation or recognition: approved program title, provider, scope, validity period and unique verification number for every approved certificate, diploma and training program."
  ],
  "programApply": [
    "Apply for Program Accreditation | ACCPHE",
    "Submit a certificate, diploma, CPD, executive, ministry or professional training program for ACCPHE Independent Program Accreditation & Recognition."
  ],
  "programs": [
    "Independent Program Accreditation & Recognition | ACCPHE",
    "Program-level accreditation and recognition for certificate, diploma, CPD, executive, ministry and professional training programs: eligibility, the eight evaluation standards, the six-step process, and disclosures."
  ],
  "accreditation": [
    "Accreditation Process, Eligibility & Classifications | ACCPHE",
    "How ACCPHE accreditation works: eligibility requirements, the eight-stage evaluation pathway, Associate Membership, Accredited Institution and Distinguished Membership classifications, and FAQs."
  ],
  "standards": [
    "Institutional Accreditation Standards & Policies | ACCPHE",
    "The twelve proposed ACCPHE institutional accreditation standards, criteria and evidence, Code of Ethics, and complaints and appeals procedures for Christian and private higher education."
  ],
  "governance": [
    "Governance — Board, Accreditation Commission & Committees | ACCPHE",
    "ACCPHE governance: Board of Trustees, Accreditation Commission, Standards & Ethics Committee, Academic Advisory Council, Regional Councils, and Executive Secretariat."
  ],
  "directory": [
    "Institutional Directory & Status Verification | ACCPHE",
    "Search the official ACCPHE directory to verify the membership or accreditation status of Christian and private higher education institutions, with effective dates and conditions."
  ],
  "news": [
    "News & Insights on Accreditation and Quality Assurance | ACCPHE",
    "Announcements and insights from ACCPHE on accreditation, academic quality, institutional governance, and Christian higher education."
  ],
  "apply": [
    "Apply for Accreditation or Membership | ACCPHE",
    "Submit an institutional inquiry for ACCPHE Associate Membership, accreditation, or Distinguished Membership. Includes a pathway finder and next steps."
  ],
  "contact": [
    "Contact the Council | ACCPHE",
    "Contact the ACCPHE Executive Secretariat about membership, accreditation, status verification, complaints, or appeals."
  ],
  "privacy": [
    "Privacy Notice | ACCPHE",
    "How ACCPHE collects, uses, and protects information submitted through its website."
  ],
  "accessibility": [
    "Accessibility Statement | ACCPHE",
    "ACCPHE’s commitment to an accessible website and how to report barriers."
  ],
  "notfound": [
    "Page not found | ACCPHE",
    "The page you requested could not be found. Search the ACCPHE website or continue from the main sections."
  ],
  "terms": [
    "Terms of Use | ACCPHE",
    "Conditions for using the ACCPHE website and accurately representing ACCPHE status."
  ]
};

export type Lang = "en" | "fr" | "es" | "pt";
export type Chrome = {
  signin: string; search: string; searchPh: string; label: string; tagline: string; verify: string; apply: string;
  contactCouncil: string; contactUs: string; language: string; skip: string; menu: string; close: string; nav: string[];
  foot: string[]; langNote: string; consentTitle: string; consentText: string; consentOk: string; consentMore: string;
};
/** Navigation and site chrome only — official texts are published in English, which is authoritative. */
export const I18N: Record<Lang, Chrome> = {
  "en": {
    "signin": "Sign in",
    "search": "Search",
    "searchPh": "Search standards, pages, questions, news…",
    "label": "English",
    "tagline": "Independent quality assurance for Christian and private higher education",
    "verify": "Verify an institution",
    "apply": "Apply",
    "contactCouncil": "Contact the Council",
    "contactUs": "Contact Us",
    "language": "Language",
    "skip": "Skip to content",
    "menu": "Menu",
    "close": "Close",
    "nav": [
      "Home",
      "About Us",
      "Accreditation",
      "Standards & Policies",
      "Governance",
      "Member Institutions",
      "News & Insights"
    ],
    "foot": [
      "The Council",
      "Accreditation",
      "Accountability"
    ],
    "langNote": "",
    "consentTitle": "Your privacy",
    "consentText": "This website stores essential preferences on your device, such as language and form progress. No advertising or tracking cookies are used.",
    "consentOk": "Understood",
    "consentMore": "Privacy Notice"
  },
  "fr": {
    "signin": "Connexion",
    "search": "Rechercher",
    "searchPh": "Rechercher normes, pages, questions, actualités…",
    "label": "Français",
    "tagline": "Assurance qualité indépendante pour l’enseignement supérieur chrétien et privé",
    "verify": "Vérifier un établissement",
    "apply": "Candidater",
    "contactCouncil": "Contacter le Conseil",
    "contactUs": "Nous contacter",
    "language": "Langue",
    "skip": "Aller au contenu",
    "menu": "Menu",
    "close": "Fermer",
    "nav": [
      "Accueil",
      "À propos",
      "Accréditation",
      "Normes et politiques",
      "Gouvernance",
      "Établissements membres",
      "Actualités"
    ],
    "foot": [
      "Le Conseil",
      "Accréditation",
      "Redevabilité"
    ],
    "langNote": "La navigation est traduite. Les textes officiels du Conseil sont publiés en anglais, qui fait foi.",
    "consentTitle": "Votre vie privée",
    "consentText": "Ce site enregistre sur votre appareil des préférences essentielles, comme la langue. Aucun cookie publicitaire ou de suivi n’est utilisé.",
    "consentOk": "Compris",
    "consentMore": "Avis de confidentialité"
  },
  "es": {
    "signin": "Iniciar sesión",
    "search": "Buscar",
    "searchPh": "Buscar normas, páginas, preguntas, noticias…",
    "label": "Español",
    "tagline": "Aseguramiento independiente de la calidad para la educación superior cristiana y privada",
    "verify": "Verificar una institución",
    "apply": "Solicitar",
    "contactCouncil": "Contactar al Consejo",
    "contactUs": "Contacto",
    "language": "Idioma",
    "skip": "Ir al contenido",
    "menu": "Menú",
    "close": "Cerrar",
    "nav": [
      "Inicio",
      "Quiénes somos",
      "Acreditación",
      "Normas y políticas",
      "Gobernanza",
      "Instituciones miembro",
      "Noticias"
    ],
    "foot": [
      "El Consejo",
      "Acreditación",
      "Rendición de cuentas"
    ],
    "langNote": "La navegación está traducida. Los textos oficiales del Consejo se publican en inglés, que es la versión de referencia.",
    "consentTitle": "Su privacidad",
    "consentText": "Este sitio guarda en su dispositivo preferencias esenciales, como el idioma. No se utilizan cookies publicitarias ni de seguimiento.",
    "consentOk": "Entendido",
    "consentMore": "Aviso de privacidad"
  },
  "pt": {
    "signin": "Entrar",
    "search": "Pesquisar",
    "searchPh": "Pesquisar normas, páginas, perguntas, notícias…",
    "label": "Português",
    "tagline": "Garantia de qualidade independente para o ensino superior cristão e privado",
    "verify": "Verificar uma instituição",
    "apply": "Candidatar-se",
    "contactCouncil": "Contactar o Conselho",
    "contactUs": "Contacto",
    "language": "Idioma",
    "skip": "Ir para o conteúdo",
    "menu": "Menu",
    "close": "Fechar",
    "nav": [
      "Início",
      "Sobre nós",
      "Acreditação",
      "Normas e políticas",
      "Governança",
      "Instituições membros",
      "Notícias"
    ],
    "foot": [
      "O Conselho",
      "Acreditação",
      "Prestação de contas"
    ],
    "langNote": "A navegação está traduzida. Os textos oficiais do Conselho são publicados em inglês, que é a versão de referência.",
    "consentTitle": "A sua privacidade",
    "consentText": "Este site guarda no seu dispositivo preferências essenciais, como o idioma. Não são utilizados cookies de publicidade ou rastreamento.",
    "consentOk": "Compreendi",
    "consentMore": "Aviso de privacidade"
  }
};

export type Policy = { title: string; lede: string; sections: { h: string; p: string }[] };
export const POLICIES: Record<"privacy" | "accessibility" | "terms", Policy> = {
  "privacy": {
    "title": "Privacy Notice",
    "lede": "How the Council collects, uses, and protects information submitted through this website.",
    "sections": [
      {
        "h": "Information we collect",
        "p": "We collect the information you provide when you submit an institutional inquiry or contact the Council, such as your name, position, institution, contact details, and the content of your submission, together with any documents you choose to upload."
      },
      {
        "h": "How we use information",
        "p": "Information is used to respond to your inquiry, to administer membership and accreditation procedures, to handle complaints and appeals, and to maintain accurate institutional records. It is not sold or used for unrelated marketing."
      },
      {
        "h": "Confidentiality of evaluation information",
        "p": "Nonpublic institutional information obtained during evaluation is protected and disclosed only in accordance with approved Council policy and applicable law. Final accreditation decisions and classifications are published in the official directory."
      },
      {
        "h": "Who can access information",
        "p": "Access is limited to Council personnel, reviewers, and governing bodies who require it to carry out their responsibilities, each of whom is bound by the Council's Code of Ethics and confidentiality requirements."
      },
      {
        "h": "Retention",
        "p": "Records are retained for as long as necessary to fulfil the purposes for which they were collected, including the maintenance of accurate accreditation records, and in accordance with applicable legal obligations."
      },
      {
        "h": "Your choices",
        "p": "You may ask to access or correct information you have submitted, or raise a concern about how it has been handled, by contacting the Executive Secretariat through the Contact page."
      }
    ]
  },
  "accessibility": {
    "title": "Accessibility Statement",
    "lede": "The Council is committed to making this website usable by as many people as possible.",
    "sections": [
      {
        "h": "Our approach",
        "p": "This website is designed to follow recognized web accessibility practice, including clear structure and headings, sufficient color contrast, keyboard operability, visible focus indicators, and text alternatives where images are used."
      },
      {
        "h": "Readability",
        "p": "Content is written in plain, professional language and set in legible type sizes. Pages reflow for smaller screens and browser zoom."
      },
      {
        "h": "Forms",
        "p": "Forms identify required fields, use descriptive labels, and confirm successful submission on screen."
      },
      {
        "h": "Known limitations",
        "p": "Some documents supplied by third parties may not yet meet the same standard. Where this is the case, the Secretariat can provide information in an alternative format on request."
      },
      {
        "h": "Feedback",
        "p": "If you encounter a barrier on this website, please tell us through the Contact page, describing the page and the difficulty. We will use your feedback to improve the site."
      }
    ]
  },
  "terms": {
    "title": "Terms of Use",
    "lede": "Conditions that apply to the use of this website and the information it contains.",
    "sections": [
      {
        "h": "Purpose of this website",
        "p": "This website provides information about the Council, its standards, procedures, governance, and the institutions participating in its membership and accreditation framework."
      },
      {
        "h": "Status information",
        "p": "The official institutional directory is the authoritative public record of membership and accreditation status. Statements made by third parties about ACCPHE status should be verified against the directory."
      },
      {
        "h": "Representation of status",
        "p": "Institutions must represent their ACCPHE status accurately. Membership must not be described as accreditation, and accreditation must not be described as equivalent to governmental authorization or to recognition by another body unless such equivalence has been independently established."
      },
      {
        "h": "Use of the Council's name",
        "p": "The Council's name and marks may be used only as permitted by a formal decision and in accordance with Council policy."
      },
      {
        "h": "Accuracy of information",
        "p": "The Council takes care to keep this website accurate and current. Published standards described as proposed remain subject to formal adoption."
      },
      {
        "h": "Contact",
        "p": "Questions about these terms may be directed to the Executive Secretariat through the Contact page."
      }
    ]
  }
};

export const DEFAULT_NOTICE =
  "ACCPHE membership is not accreditation. Accreditation by a nongovernmental body does not by itself confer legal authority to operate or award degrees, and does not guarantee recognition of qualifications by governments, regulators, or other institutions.";

/** First articles, loaded by the seed script. */
export const SEED_ARTICLES = [
  {
    "slug": "proposed-institutional-accreditation-standards-published",
    "title": "Proposed Institutional Accreditation Standards published",
    "category": "Standards",
    "status": "Published",
    "daysAgo": 6,
    "excerpt": "The Council has published twelve proposed standards as a recommended framework for formal adoption, covering mission, governance, academic programs, faculty, student protection, resources, finance, quality assurance, ethics, and societal contribution.",
    "body": "The Council has published twelve proposed Institutional Accreditation Standards as a recommended framework for formal adoption. The standards provide a structured basis for evaluating academic quality, institutional effectiveness, governance, ethical responsibility, and continuous improvement.\n\nThe framework addresses institutional mission and identity; legal authorization and regulatory compliance; governance and leadership; academic programs and curriculum; faculty qualifications and development; teaching, learning, and assessment; student admission, support, and protection; resources and infrastructure; financial integrity and sustainability; internal quality assurance; ethical leadership and faith or values integration; and professional relevance and societal contribution.\n\nThe standards are designed to apply to Christian and private higher education institutions while recognizing legitimate differences in institutional mission, educational delivery, size, and national regulatory environment. Christian institutions are additionally asked to demonstrate consistency between their stated faith-based identity and their educational practice.\n\nInstitutions seeking accreditation will be expected to demonstrate compliance through documented policies, operational evidence, institutional performance information, and the results of systematic self-evaluation. Document submission alone does not establish compliance: review considers the quality, consistency, authenticity, and practical application of the evidence provided.\n\nThe full text of each standard, with its evaluation considerations, is available in the Standards & Policies section of this website."
  },
  {
    "slug": "institutional-inquiries-now-open",
    "title": "Institutional inquiries now open",
    "category": "Announcements",
    "status": "Published",
    "daysAgo": 8,
    "excerpt": "Eligible Christian and private higher education institutions may submit an initial inquiry regarding Associate Membership, accreditation, or Distinguished Membership. The Secretariat will communicate next steps under the Council’s procedures.",
    "body": "The Council now welcomes initial inquiries from eligible Christian and private higher education institutions interested in Associate Membership, accreditation, or Distinguished Membership.\n\nAn inquiry is the first step in the institutional evaluation pathway. On receipt, the Secretariat reviews the information provided and shares the Council's standards, eligibility requirements, application procedures, and applicable fees. Where appropriate, the institution then proceeds to a preliminary eligibility review of its foundational documents.\n\nInstitutions should be prepared to demonstrate legal establishment and authorization in their jurisdiction, a clearly articulated mission and governance framework, active educational programs with defined learning outcomes, appropriately qualified faculty and academic leadership, adequate resources, responsible financial management, documented internal quality assurance, and policies addressing academic integrity, student protection, complaints, and accurate public representation.\n\nEligibility to apply does not guarantee admission, accreditation, or any particular decision. Associate Membership is a preparatory classification and is not an accreditation award.\n\nInquiries may be submitted through the Apply section of this website."
  },
  {
    "slug": "membership-accreditation-recognition-distinctions",
    "title": "Membership, accreditation, and recognition: why the distinctions matter",
    "category": "Quality Assurance",
    "status": "Published",
    "daysAgo": 12,
    "excerpt": "Accreditation, institutional membership, government authorization, professional licensing, and qualification recognition are separate matters. This note sets out how the Council communicates each, and what it expects of participating institutions.",
    "body": "Accreditation, institutional membership, government authorization, professional licensing, and academic qualification recognition are separate matters. The Council communicates these distinctions clearly and expects participating institutions to represent their status accurately.\n\nAssociate Membership indicates participation in the Council's preparatory development framework. It provides standards orientation, readiness guidance, and structured preparation for future evaluation. It does not establish accredited status and must not be presented as evidence that an institution has satisfied the Council's accreditation standards.\n\nAccredited Institution status is reserved for institutions that have completed the approved evaluation process and received a formal award from the authorized Council body. Each award specifies the institution, the scope of accreditation, the effective date, the expiry or review date, and any applicable conditions.\n\nAccreditation by a nongovernmental body does not by itself provide legal authorization to operate or to award qualifications. Degree-awarding authority depends on the laws of the institution's jurisdiction. Recognition of institutions and qualifications depends on the policies of governments, regulators, universities, employers, and professional bodies; an ACCPHE award should not be represented as a guarantee of recognition or transferability.\n\nThe official institutional directory is the authoritative public record of membership and accreditation status. Anyone who encounters a claim of ACCPHE status that does not appear in the directory is encouraged to contact the Secretariat."
  },
  {
    "slug": "call-for-expressions-of-interest-institutional-reviewers",
    "title": "Call for expressions of interest: institutional reviewers",
    "category": "Accreditation",
    "status": "Draft",
    "daysAgo": 1,
    "excerpt": "The Council invites experienced academics and quality assurance professionals to express interest in serving on institutional review teams.",
    "body": "The Council invites experienced academics, institutional leaders, and quality assurance professionals to express interest in serving on institutional review teams.\n\nReviewers assess applications, self-study reports, and supporting evidence against the approved standards, and may take part in interviews, document verification, and on-site or authorized virtual evaluations.\n\nReviewers are expected to act with integrity, impartiality, and professional competence; to protect the confidentiality of nonpublic institutional information; and to disclose any actual, potential, or perceived conflict of interest and recuse themselves where required.\n\nExpressions of interest may be submitted through the Contact page."
  }
];

/** Independent Program Accreditation & Recognition (/accreditation/programs). */
export const PROGRAM_ACCREDITATION = {
  tagline: "Advancing Educational Innovation Through Independent Quality Assurance",
  intro: [
    "At the Accreditation & Compliance Council for Christian and Private Higher Education (ACCPHE), we believe that educational excellence is not defined solely by the size, structure, or institutional status of an education provider. Excellence can also emerge through innovative certificate and diploma programs, specialized professional training, continuing education, and independent learning initiatives.",
    "Our Independent Program Accreditation and Recognition framework is designed to provide external quality assurance for educational programs developed and delivered by universities, colleges, Christian institutions, professional academies, training organizations, and independent education providers.",
    "The framework supports educational innovation while promoting academic integrity, professional relevance, measurable learning outcomes, and continuous improvement.",
  ],
  what: [
    "Independent Program Accreditation is a structured quality assurance process through which ACCPHE evaluates an individual educational or professional development program against established standards.",
    "Unlike institutional accreditation, which examines an institution as a whole, program-level accreditation focuses on the design, delivery, assessment, and educational quality of a specific program.",
    "This enables eligible education providers to submit individual certificate programs, professional development courses, and specialized training initiatives for independent evaluation without necessarily pursuing full institutional accreditation.",
    "Programs that satisfy the applicable ACCPHE standards may receive formal program-level accreditation or recognition within the scope of the Council’s independent quality assurance framework.",
  ],
  eligible: PROGRAM_CATEGORIES,
  eligibleNote: "Eligibility remains subject to ACCPHE’s published standards, applicable regulations, and the nature of the qualification being offered.",
  independence: [
    "ACCPHE recognizes that educational institutions and independent training providers have distinct missions, educational philosophies, instructional approaches, and professional objectives. Our program accreditation framework is intended to preserve this diversity.",
    "Institutions retain responsibility for curriculum ownership, instructional delivery, learner admission, program scheduling, tuition arrangements, and certificate issuance, subject to applicable laws and the quality requirements attached to their accreditation status.",
    "ACCPHE’s role is to provide independent evaluation, establish clear quality expectations, verify compliance, and support continuous educational improvement.",
  ],
  standards: [
    { t: "Program Purpose and Relevance", d: "Clear educational objectives, identified learner needs, and demonstrable academic, professional, or societal relevance." },
    { t: "Curriculum Quality", d: "Coherent curriculum structure, appropriate content, instructional depth, and alignment with intended learning outcomes." },
    { t: "Learning Outcomes", d: "Clearly defined knowledge, competencies, and practical capabilities that learners should demonstrate upon completion." },
    { t: "Instructional Competence", d: "Appropriate qualifications, professional expertise, and instructional capabilities of faculty, facilitators, and trainers." },
    { t: "Assessment and Certification", d: "Credible learner assessment methods, transparent completion requirements, and reliable certification procedures." },
    { t: "Learning Experience and Resources", d: "Suitable teaching methods, educational materials, learner support, and accessible learning environments." },
    { t: "Ethical Standards and Institutional Integrity", d: "Honest public representation, responsible administration, learner protection, and compliance with applicable requirements." },
    { t: "Quality Assurance and Continuous Improvement", d: "Effective mechanisms for learner feedback, program evaluation, performance monitoring, and curriculum enhancement." },
  ],
  steps: [
    { t: "Application", d: "The institution submits an application identifying the proposed program, its objectives, intended learners, delivery model, and responsible education provider." },
    { t: "Documentation and Self-Evaluation", d: "The applicant provides curriculum documentation, learning outcomes, assessment procedures, instructor qualifications, and relevant quality assurance evidence." },
    { t: "Independent Program Review", d: "Qualified reviewers assess the program against ACCPHE’s established evaluation standards. Additional evidence, interviews, or demonstrations may be requested." },
    { t: "Accreditation Decision", d: "The authorized accreditation body considers the evaluation findings and determines whether the program satisfies the requirements for accreditation or recognition." },
    { t: "Certification and Public Verification", d: "Approved programs receive formal documentation specifying their accreditation or recognition status, approved program title, scope, validity period, and verification reference." },
    { t: "Ongoing Quality Assurance", d: "Recognized providers maintain compliance with applicable standards and participate in periodic monitoring, reporting, and renewal reviews." },
  ],
  receiveIntro: "Subject to the approved program category and applicable accreditation policies, successful applicants will receive:",
  receive: [
    "An official ACCPHE program accreditation or recognition certificate",
    "A unique program verification number",
    "Authorization to use the appropriate ACCPHE program recognition statement or mark",
    "Inclusion in the ACCPHE public directory of approved programs",
    "A formal program evaluation outcome and recommendations for improvement",
    "Access to applicable quality assurance guidance and professional development resources",
  ],
  receiveNote: "Accreditation applies exclusively to the approved program and does not automatically extend to the institution or its other educational offerings.",
  disclosure: [
    "ACCPHE program accreditation or recognition represents an independent evaluation against ACCPHE’s own published quality assurance standards. It does not, by itself, constitute government approval, authorization to operate an educational institution, recognition by the United States Department of Education or the Council for Higher Education Accreditation, professional licensure approval, or guaranteed acceptance of academic credit by other institutions.",
    "Providers remain responsible for securing all licenses, approvals, and authorizations required in the jurisdictions where they operate.",
  ],
};

/** The Academic and Professional Benefits of ACCPHE Accreditation (/accreditation#c-benefits). */
export const ACCREDITATION_BENEFITS = {
  title: "The Academic and Professional Benefits of ACCPHE Accreditation",
  tagline: "Elevate Your Institution. Strengthen Your Credibility. Advance Your Global Influence.",
  intro: "Discover how ACCPHE accreditation can strengthen academic quality, enhance institutional credibility, and position your institution for meaningful educational partnerships and long-term growth.",
  items: [
    { t: "Enhanced Local and Global Credibility", d: "Strengthen the reputation and credibility of your institution, academic programs, and certificates through independent quality assurance." },
    { t: "Greater Marketplace Recognition", d: "Enhance the professional credibility and marketplace relevance of your programs and certificates, strengthening confidence among employers and industry stakeholders." },
    { t: "International Visibility and Institutional Prestige", d: "Position your institution for greater international exposure, professional recognition, and opportunities for global engagement." },
    { t: "Academic Excellence and Quality Assurance", d: "Demonstrate your institution’s commitment to rigorous academic standards, continuous improvement, and educational excellence." },
    { t: "Global Partnerships and Academic Collaboration", d: "Strengthen your institution’s position to pursue strategic partnerships, academic collaborations, and international educational networks." },
    { t: "Increased Student and Stakeholder Confidence", d: "Build greater trust among prospective students, parents, employers, and institutional partners through demonstrated commitment to educational quality and integrity." },
    { t: "Institutional Growth and Competitive Advantage", d: "Differentiate your institution in an increasingly competitive education sector while strengthening its foundation for sustainable growth, innovation, and long-term success." },
  ],
};

/** Official social media profiles (footer, contact page, and Organization structured data). */
export const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/company/accphe",
  facebook: "https://www.facebook.com/accphe",
  instagram: "https://www.instagram.com/accphe",
};
