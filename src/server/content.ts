import "server-only";
import { cache } from "react";
import { z } from "zod";
import { db } from "@/db";
import { contentBlocks } from "@/db/schema";
import { BLOCK_BY_KEY, type Block, type Field } from "@/content/cms";
import { CLASSES, PILLARS, PROGRAM_ACCREDITATION, VMP, type TextItem } from "@/content/site";

const str = (max: number, label: string) => z.string().trim().max(max, `${label} is too long.`);
const req = (max: number, label: string) => str(max, label).min(1, `${label} is required.`);

function fieldSchema(f: Field): z.ZodType {
  switch (f.type) {
    case "text":
      return f.name === "note" || f.name === "foot" ? str(f.max ?? 300, f.label) : req(f.max ?? 300, f.label);
    case "textarea":
      return f.name === "note" || f.name === "foot" ? str(f.max ?? 4000, f.label) : req(f.max ?? 4000, f.label);
    case "paragraphs":
    case "lines":
      return z.array(z.string().trim().min(1).max(4000)).min(1, `${f.label} needs at least one entry.`).max(60);
    case "select":
      return z.enum(f.options.map((o) => o.value) as [string, ...string[]]);
    case "date":
      return z.string().trim().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), `${f.label}: enter a valid date.`);
  }
}

const objectSchema = (fields: Field[]) => z.object(Object.fromEntries(fields.map((f) => [f.name, fieldSchema(f)])));

export function blockSchema(key: string): z.ZodType {
  const def = BLOCK_BY_KEY[key];
  if (!def) throw new Error(`Unknown content block ${key}`);
  const b: Block = def.block;
  const n = Array.isArray(def.default) ? def.default.length : 0;
  if (b.kind === "object") {
    const base = objectSchema(b.fields);
    return key === "standards.meta" ? base.refine((v) => (v as { status: string; adoptedOn: string }).status !== "adopted" || !!(v as { adoptedOn: string }).adoptedOn, "Enter the date the standards were adopted.") : base;
  }
  const item = b.kind === "list" ? objectSchema(b.item) : req(1000, b.itemLabel);
  let arr = z.array(item);
  if ("fixed" in b && b.fixed) arr = arr.length(n, `This list must keep exactly ${n} entries.`);
  else arr = arr.min(b.min ?? 1, "Add at least one entry.").max(b.max ?? 50, "Too many entries.");
  return arr;
}

const all = cache(async () => {
  const rows = await db.select().from(contentBlocks);
  return new Map(rows.map((r) => [r.key, r]));
});

/** The saved value of a block, or its official default when unsaved (or no longer valid after a schema change). */
export async function getBlock<T>(key: string): Promise<T> {
  const def = BLOCK_BY_KEY[key];
  const row = (await all()).get(key);
  if (row) {
    const parsed = blockSchema(key).safeParse(row.value);
    if (parsed.success) return parsed.data as T;
  }
  return def.default as T;
}

export async function blockMeta(key: string) {
  const row = (await all()).get(key);
  return row ? { updatedAt: row.updatedAt, updatedById: row.updatedById, customised: true } : { updatedAt: null, updatedById: null, customised: false };
}

/* ─────────── Typed accessors used by the public pages ─────────── */

export type Standard = { t: string; s: string; items: string[]; note: string };
export type StandardsMeta = { status: "proposed" | "adopted"; adoptedOn: string };
export type Policy = { title: string; lede: string; sections: { h: string; p: string }[] };

export const getStandards = () => getBlock<Standard[]>("standards");
export const getStandardTitles = async () => (await getStandards()).map((s) => s.t);
/** The standards reviewers rate: the twelve institutional standards, or the eight program standards. */
export const getStandardTitlesFor = async (kind: "institution" | "program") => (kind === "program" ? (await getBlock<TextItem[]>("programs.standards")).map((s) => s.t) : getStandardTitles());
export const getStandardsMeta = () => getBlock<StandardsMeta>("standards.meta");
export const getFaqs = () => getBlock<{ q: string; a: string }[]>("faqs");
export const getProcess = () => getBlock<TextItem[]>("process");

export async function getPolicy(k: "privacy" | "accessibility" | "terms"): Promise<Policy> {
  const v = await getBlock<{ title: string; lede: string; sections: string[] }>(`policy.${k}`);
  return {
    title: v.title,
    lede: v.lede,
    sections: v.sections.map((s) => {
      const [h, ...rest] = s.split("\n");
      return { h: h.trim(), p: rest.join("\n").trim() };
    }),
  };
}

/* ─────────── Merged views (fixed labels from site.ts + editable text) ─────────── */


export type ClassInfo = (typeof CLASSES)[number];
export async function getClasses(): Promise<ClassInfo[]> {
  const v = await getBlock<{ short: string; note: string; long: string[] }[]>("classes");
  return CLASSES.map((c, i) => ({ ...c, ...v[i] }));
}
export async function getVmp(): Promise<TextItem[]> {
  const v = await getBlock<{ d: string }[]>("vmp");
  return VMP.map((x, i) => ({ t: x.t, d: v[i]?.d ?? x.d }));
}
export async function getPillars() {
  const v = await getBlock<TextItem[]>("pillars");
  return PILLARS.map((p, i) => ({ n: p.n, t: v[i]?.t ?? p.t, d: v[i]?.d ?? p.d }));
}
export type GovBody = { id: string; kicker: string; t: string; intro: string[]; items: string[]; foot: string };
const GOV_IDS = ["g-board", "g-commission", "g-ethics", "g-regional", "g-advisory"];
export async function getGovernance(): Promise<GovBody[]> {
  const v = await getBlock<Omit<GovBody, "id">[]>("governance");
  return v.map((g, i) => ({ ...g, id: GOV_IDS[i] }));
}
/** "Proposed" wording while the standards await formal adoption. */
export async function standardsLabel() {
  const m = await getStandardsMeta();
  return m.status === "adopted" ? { adjective: "Adopted", phrase: `adopted by the Council${m.adoptedOn ? ` on ${m.adoptedOn}` : ""}`, adopted: true, adoptedOn: m.adoptedOn } : { adjective: "Proposed", phrase: "recommended for formal adoption by the Council", adopted: false, adoptedOn: "" };
}

export type ProgramAccreditation = Omit<typeof PROGRAM_ACCREDITATION, "standards" | "steps"> & { standards: TextItem[]; steps: TextItem[] };
export async function getProgramAccreditation(): Promise<ProgramAccreditation> {
  const [page, standards, steps] = await Promise.all([
    getBlock<Omit<ProgramAccreditation, "standards" | "steps">>("programs.page"),
    getBlock<TextItem[]>("programs.standards"),
    getBlock<TextItem[]>("programs.steps"),
  ]);
  return { ...page, standards, steps };
}

export async function getBenefits() {
  const [head, items] = await Promise.all([getBlock<{ title: string; tagline: string; intro: string }>("benefits.intro"), getBlock<TextItem[]>("benefits")]);
  return { ...head, items };
}

export type SocialLink = { key: "linkedin" | "facebook" | "instagram"; label: string; url: string };

/** The Council's social profiles, in display order; only well-formed https addresses are returned. */
export async function getSocial(): Promise<SocialLink[]> {
  const v = await getBlock<Record<string, string>>("social");
  const items: SocialLink[] = [
    { key: "linkedin", label: "LinkedIn", url: v.linkedin ?? "" },
    { key: "facebook", label: "Facebook", url: v.facebook ?? "" },
    { key: "instagram", label: "Instagram", url: v.instagram ?? "" },
  ];
  return items
    .map((i) => ({ ...i, url: i.url.trim().replace(/^http:\/\//i, "https://") }))
    .filter((i) => {
      try {
        return new URL(i.url).protocol === "https:";
      } catch {
        return false;
      }
    });
}
