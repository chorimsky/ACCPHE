import { z } from "zod";

/**
 * Deployment environment checks, run from next.config.ts on Vercel builds and from src/instrumentation.ts at boot.
 * - "production": VERCEL_ENV=production, or NODE_ENV=production with ENFORCE_ENV=1 (self-hosted).
 * - "preview": VERCEL_ENV=preview — same rules.
 * - anything else (development, local builds, e2e): no checks.
 * No "server-only" import: next.config.ts loads this file outside the React server environment.
 */

export type EnvTarget = "production" | "preview" | null;
export const PLACEHOLDER_AUTH_SECRET = "change-me-to-a-long-random-string";

export function envTarget(env: NodeJS.ProcessEnv = process.env): EnvTarget {
  if (env.VERCEL_ENV === "production") return "production";
  if (env.VERCEL_ENV === "preview") return "preview";
  if (!env.VERCEL_ENV && env.NODE_ENV === "production" && env.ENFORCE_ENV === "1") return "production";
  return null;
}

const set = (v: string | undefined) => typeof v === "string" && v.trim() !== "";

const schema = z.object({
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is required (Turso: libsql://<db>-<org>.turso.io)" })
    .trim()
    .refine((v) => v.startsWith("libsql://") || v.startsWith("https://"), "DATABASE_URL must be a Turso URL — a local file database does not persist on serverless"),
  DATABASE_AUTH_TOKEN: z.string({ error: "DATABASE_AUTH_TOKEN is required with a Turso DATABASE_URL" }).trim().min(1),
  AUTH_SECRET: z
    .string({ error: "AUTH_SECRET is required (openssl rand -base64 48)" })
    .min(32, "AUTH_SECRET must be at least 32 characters")
    .refine((v) => v !== PLACEHOLDER_AUTH_SECRET, "AUTH_SECRET is still the .env.example placeholder"),
  APP_URL: z
    .string({ error: "APP_URL is required (e.g. https://www.accphe.org)" })
    .trim()
    .refine((v) => v.startsWith("https://") && !v.endsWith("/"), "APP_URL must start with https:// and have no trailing slash"),
  STORAGE_DRIVER: z.literal("vercel-blob", { error: "STORAGE_DRIVER must be \"vercel-blob\" (local files do not persist on serverless)" }),
  CRON_SECRET: z.string({ error: "CRON_SECRET is required (16+ characters) for the weekly digest" }).min(16),
});

export function envProblems(env: NodeJS.ProcessEnv = process.env): string[] {
  if (!envTarget(env)) return [];
  env = { ...env, DATABASE_URL: env.DATABASE_URL ?? env.TURSO_DATABASE_URL, DATABASE_AUTH_TOKEN: env.DATABASE_AUTH_TOKEN ?? env.TURSO_AUTH_TOKEN };
  const problems: string[] = [];
  const parsed = schema.safeParse(env);
  if (!parsed.success) for (const i of parsed.error.issues) problems.push(`${i.path.join(".") || "env"}: ${i.message}`);
  if (env.STORAGE_DRIVER === "vercel-blob" && !set(env.BLOB_STORE_ID) && !set(env.BLOB_READ_WRITE_TOKEN)) {
    problems.push("BLOB_STORE_ID: connect a private Vercel Blob store to the project, or set BLOB_READ_WRITE_TOKEN");
  }
  if (env.EMAIL_DELIVERY !== "off") {
    if (!set(env.RESEND_API_KEY)) problems.push("RESEND_API_KEY is required (or set EMAIL_DELIVERY=off to launch without email)");
    if (!set(env.EMAIL_FROM)) problems.push('EMAIL_FROM is required with email delivery (e.g. "ACCPHE Secretariat <no-reply@yourdomain>")');
    else if (env.EMAIL_FROM!.includes(".example")) problems.push("EMAIL_FROM still uses the .example placeholder domain");
  }
  if (env.DEMO_MODE === "1" && envTarget(env) === "production") {
    problems.push("DEMO_MODE must not be enabled in production (it allows administrators to replace all data with samples)");
  }
  return problems;
}

export function assertEnv(env: NodeJS.ProcessEnv = process.env) {
  const problems = envProblems(env);
  if (problems.length) {
    throw new Error(`Invalid environment for ${envTarget(env)} deployment:\n  - ${problems.join("\n  - ")}\nSee README → Going live.`);
  }
}
