import { z } from "zod";

export type ActionResult = { ok: true; message?: string; data?: Record<string, unknown> } | { ok: false; error: string };
export type ActionState = ActionResult | null;

export const ok = (message?: string, data?: Record<string, unknown>): ActionResult => ({ ok: true, message, data });
export const fail = (error: string): ActionResult => ({ ok: false, error });

/** Parse FormData with a zod schema; returns the first human-readable error. */
export function parseForm<T extends z.ZodType>(schema: T, fd: FormData): { data: z.infer<T> } | { error: string } {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("$ACTION")) continue;
    if (k in obj) obj[k] = ([] as unknown[]).concat(obj[k], v);
    else obj[k] = v;
  }
  const res = schema.safeParse(obj);
  if (!res.success) return { error: res.error.issues[0].message };
  return { data: res.data };
}

/** Run a server action body; thrown errors become fail(message). Next.js redirects/notFound still propagate. */
export async function attempt(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_")) throw e;
    console.error(e);
    return fail(e instanceof UserError ? e.message : "Something went wrong. Please try again.");
  }
}

/** An error whose message is safe to show to the user. */
export class UserError extends Error {}

/** zod helpers for FormData strings. */
export const zs = {
  text: (label: string, max = 5000) => z.string({ error: `${label} is required.` }).trim().min(1, `${label} is required.`).max(max, `${label} is too long.`),
  opt: (max = 5000, label = "One of the fields") =>
    z
      .string()
      .trim()
      .max(max, `${label} is too long (at most ${max} characters).`)
      .optional()
      .transform((v) => v ?? ""),
  email: (label = "Email") => z.string({ error: `${label} is required.` }).trim().toLowerCase().email(`Enter a valid ${label.toLowerCase()}.`).max(200),
  date: () =>
    z
      .string()
      .trim()
      .optional()
      .transform((v) => v ?? "")
      .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Enter a valid date."),
  /** Optional web address; "example.edu" becomes "https://example.edu". */
  url: (label = "Website") =>
    z
      .string()
      .trim()
      .max(300, `${label} is too long.`)
      .optional()
      .transform((v) => (!v ? "" : /^https?:\/\//i.test(v) ? v : `https://${v}`))
      .refine((v) => v === "" || /^https?:\/\/[^\s/.]+\.[^\s]+$/i.test(v), `Enter the ${label.toLowerCase()} as a full address, for example https://www.example.edu`),
  bool: () => z.union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal("false"), z.literal("")]).optional().transform((v) => v === "on" || v === "true" || v === "1"),
};
