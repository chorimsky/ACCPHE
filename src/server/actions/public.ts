"use server";

import { z } from "zod";
import { db } from "@/db";
import { files, messages, MESSAGE_ROUTES, PATHWAYS } from "@/db/schema";
import { attempt, fail, ok, parseForm, zs, type ActionState } from "@/lib/action";
import { INSTITUTION_TYPES, PROGRAM_DELIVERY, PROVIDER_TYPES } from "@/lib/domain";
import { abs } from "@/lib/site";
import { audit } from "@/server/audit";
import { trySendEmail } from "@/server/email";
import { notifyModule } from "@/server/notify";
import { overIpLimit } from "@/server/security/rate-limit";
import { createApplication, WEBSITE } from "@/server/services/applications";
import { MAX_UPLOAD_BYTES, putFile } from "@/server/storage";

const MAX_INQUIRY_FILES = 3;

/** Optional link to the institution's page on a social network; accepts the address with or without https://. */
const socialUrl = (label: string, host: string) =>
  z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (!v ? "" : /^https?:\/\//i.test(v) ? v.replace(/^http:/i, "https:") : `https://${v}`))
    .refine((v) => v === "" || new RegExp(`^https://([a-z0-9-]+\\.)*${host.replace(".", "\\.")}/\\S+$`, "i").test(v), `Enter the ${label} page as a full address, for example https://www.${host}/…`);

const inquirySchema = z.object({
  name: zs.text("Legal institution name", 200),
  country: zs.text("Country of establishment", 100),
  year: z
    .string({ error: "Year of establishment is required." })
    .trim()
    .regex(/^\d{4}$/, "Enter the year of establishment as four digits.")
    .refine((y) => +y >= 1000 && +y <= new Date().getUTCFullYear(), "Enter a valid year of establishment."),
  website: z
    .string({ error: "Official website is required." })
    .trim()
    .max(300)
    .refine((v) => /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v), "Enter the official website as a full address, starting with https://"),
  facebook: socialUrl("Facebook", "facebook.com"),
  linkedin: socialUrl("LinkedIn", "linkedin.com"),
  type: z.enum(INSTITUTION_TYPES as [string, ...string[]], { error: "Select the institution type." }),
  authRef: zs.text("Government authorization or registration reference", 200),
  repName: zs.text("Full name", 150),
  repPosition: zs.text("Position", 150),
  repEmail: zs.email("Official institutional email"),
  repPhone: zs.text("Telephone number", 60),
  pathway: z.enum(PATHWAYS, { error: "Select the pathway you are interested in." }),
  profile: zs.text("Brief institutional profile", 6000),
  declareAccurate: z.literal("on", { error: "Confirm the accuracy declaration." }),
  declarePrivacy: z.literal("on", { error: "Acknowledge the privacy declaration." }),
  /** honeypot: real visitors never see or fill it */
  company_website: z.string().optional(),
});

export async function submitInquiry(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return attempt(async () => {
    const parsed = parseForm(inquirySchema, fd);
    if ("error" in parsed) return fail(parsed.error);
    const d = parsed.data;
    if (d.company_website) return ok("received", { ref: "ACC-0000" }); // silently drop bots
    if (await overIpLimit("inquiry", 5, 60 * 60_000)) return fail("Too many inquiries were sent from this connection. Please try again in an hour or contact the Secretariat.");

    const uploads = fd.getAll("documents").filter((f): f is File => f instanceof File && f.size > 0);
    if (uploads.length > MAX_INQUIRY_FILES) return fail(`Attach at most ${MAX_INQUIRY_FILES} files. The Secretariat will request further documents if required.`);
    if (uploads.reduce((n, f) => n + f.size, 0) > MAX_UPLOAD_BYTES) return fail("Attachments may total at most 4 MB. Send larger documents after the Secretariat contacts you.");
    // Validate and store files before creating the record, so a rejected file doesn't leave a half-created inquiry.
    const stored = [];
    for (const f of uploads) stored.push(await putFile(f));

    const app = await createApplication(
      {
        name: d.name,
        country: d.country,
        yearEstablished: d.year,
        website: d.website,
        facebook: d.facebook,
        linkedin: d.linkedin,
        type: d.type,
        authRef: d.authRef,
        repName: d.repName,
        repPosition: d.repPosition,
        repEmail: d.repEmail,
        repPhone: d.repPhone,
        pathway: d.pathway,
        profile: d.profile,
      },
      WEBSITE,
      "website",
    );
    if (stored.length) {
      await db.insert(files).values(stored.map((s) => ({ applicationId: app.id, fileName: s.fileName, storageKey: s.key, size: s.size, mimeType: s.mimeType, uploadedByLabel: "Website" })));
    }

    await trySendEmail(
      d.repEmail,
      `Inquiry received — ${app.ref}`,
      `Dear ${d.repName},\n\nThank you for contacting ACCPHE. Your institutional inquiry for ${app.name} has been received under the reference ${app.ref}.\n\nThe Secretariat will review the information submitted and communicate the next steps: orientation on the Council’s standards, eligibility requirements, application procedures, and applicable fees, followed by a preliminary eligibility review.\n\nKeep your reference for all correspondence. You may request an account in the Institution Portal to follow your institution’s progress; quote the reference so the Secretariat can link it.\n\nSubmitting an inquiry does not guarantee admission, accreditation, or any particular decision.`,
      { label: "Request a portal account", url: abs(`/portal/register?ref=${encodeURIComponent(app.ref)}`) },
    );
    await notifyModule("applications", {
      subject: `New institutional inquiry: ${app.name} (${app.ref})`,
      text: `${app.name} (${app.country}) submitted an inquiry for ${app.pathway} through the website.${stored.length ? ` ${stored.length} supporting document(s) attached.` : ""}`,
      link: `/portal/applications/${app.id}`,
    });
    return ok("received", { ref: app.ref });
  });
}

const programSchema = z.object({
  programTitle: zs.text("Program title", 200),
  programCategory: zs.text("Program category", 200),
  programDelivery: z.enum(PROGRAM_DELIVERY as [string, ...string[]], { error: "Select the delivery mode." }),
  programDuration: zs.text("Duration or learning hours", 120),
  programLearners: zs.text("Intended learners", 600),
  profile: zs.text("Program description and objectives", 6000),
  name: zs.text("Education provider (legal name)", 200),
  country: zs.text("Country", 100),
  website: z
    .string({ error: "Website is required." })
    .trim()
    .max(300)
    .refine((v) => /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v), "Enter the website as a full address, starting with https://"),
  type: z.enum(PROVIDER_TYPES as [string, ...string[]], { error: "Select the provider type." }),
  authRef: zs.opt(200),
  repName: zs.text("Full name", 150),
  repPosition: zs.text("Position", 150),
  repEmail: zs.email("Official email"),
  repPhone: zs.text("Telephone number", 60),
  declareAccurate: z.literal("on", { error: "Confirm the accuracy declaration." }),
  declareDisclosure: z.literal("on", { error: "Acknowledge the accreditation disclosure." }),
  declarePrivacy: z.literal("on", { error: "Acknowledge the privacy declaration." }),
  company_website: z.string().optional(),
});

/** Independent Program Accreditation & Recognition: public application for one program. */
export async function submitProgramApplication(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return attempt(async () => {
    const parsed = parseForm(programSchema, fd);
    if ("error" in parsed) return fail(parsed.error);
    const d = parsed.data;
    if (d.company_website) return ok("received", { ref: "PRG-0000" });
    if (await overIpLimit("program-application", 5, 60 * 60_000)) return fail("Too many applications were sent from this connection. Please try again in an hour or contact the Secretariat.");

    const uploads = fd.getAll("documents").filter((f): f is File => f instanceof File && f.size > 0);
    if (uploads.length > MAX_INQUIRY_FILES) return fail(`Attach at most ${MAX_INQUIRY_FILES} files. The Secretariat will request the full documentation after reviewing your application.`);
    if (uploads.reduce((n, f) => n + f.size, 0) > MAX_UPLOAD_BYTES) return fail("Attachments may total at most 4 MB. Send larger documents after the Secretariat contacts you.");
    const stored = [];
    for (const f of uploads) stored.push(await putFile(f));

    const app = await createApplication(
      {
        kind: "program",
        programTitle: d.programTitle,
        programCategory: d.programCategory,
        programDelivery: d.programDelivery,
        programDuration: d.programDuration,
        programLearners: d.programLearners,
        profile: d.profile,
        name: d.name,
        country: d.country,
        website: d.website,
        type: d.type,
        authRef: d.authRef,
        repName: d.repName,
        repPosition: d.repPosition,
        repEmail: d.repEmail,
        repPhone: d.repPhone,
        pathway: "Accreditation",
      },
      WEBSITE,
      "website",
    );
    if (stored.length) {
      await db.insert(files).values(stored.map((s) => ({ applicationId: app.id, fileName: s.fileName, storageKey: s.key, size: s.size, mimeType: s.mimeType, uploadedByLabel: "Website" })));
    }

    await trySendEmail(
      d.repEmail,
      `Program application received — ${app.ref}`,
      `Dear ${d.repName},\n\nThank you for applying for ACCPHE Independent Program Accreditation & Recognition. Your application for “${d.programTitle}” (${d.name}) has been received under the reference ${app.ref}.\n\nThe Secretariat will confirm that the program falls within the scope of the framework and tell you which documents to provide: curriculum, learning outcomes, assessment and certification procedures, instructor qualifications, and your program self-evaluation against the eight program standards.\n\nKeep your reference for all correspondence. You may request a portal account to follow the review and upload documents; quote the reference so the Secretariat can link it.\n\nSubmitting an application does not guarantee accreditation, recognition, or any particular decision. ACCPHE program accreditation is an independent evaluation against ACCPHE’s own published standards and is not government approval.`,
      { label: "Request a portal account", url: abs(`/portal/register?ref=${encodeURIComponent(app.ref)}`) },
    );
    await notifyModule("applications", {
      subject: `New program application: ${d.programTitle} — ${d.name} (${app.ref})`,
      text: `${d.name} (${d.country}) applied for program accreditation of “${d.programTitle}” (${d.programCategory}, ${d.programDelivery}).${stored.length ? ` ${stored.length} supporting document(s) attached.` : ""}`,
      link: `/portal/applications/${app.id}`,
    });
    return ok("received", { ref: app.ref });
  });
}

const contactSchema = z.object({
  route: z.enum(MESSAGE_ROUTES.filter((r) => r !== "Account request") as [string, ...string[]], { error: "Select the nature of your inquiry." }),
  name: zs.text("Full name", 150),
  org: zs.opt(200),
  email: zs.email(),
  body: zs.text("Message", 8000),
  company_website: z.string().optional(),
});

export async function submitContact(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return attempt(async () => {
    const parsed = parseForm(contactSchema, fd);
    if ("error" in parsed) return fail(parsed.error);
    const d = parsed.data;
    if (d.company_website) return ok("received");
    if (await overIpLimit("contact", 8, 60 * 60_000)) return fail("Too many messages were sent from this connection. Please try again later.");
    const route = d.route as (typeof MESSAGE_ROUTES)[number];
    const [m] = await db.insert(messages).values({ name: d.name, org: d.org, email: d.email, route, body: d.body }).returning();
    await audit({ who: "Website", action: "message.receive", entityType: "message", entityId: m.id, summary: `Message received: ${route}` });
    await notifyModule("messages", {
      subject: `New message: ${route} — ${d.name}`,
      text: `${d.name}${d.org ? ` (${d.org})` : ""} wrote through the website:\n\n${d.body.slice(0, 1200)}`,
      link: `/portal/messages?id=${m.id}`,
    });
    return ok("received");
  });
}
