import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const PLACEHOLDER_SECRET = "change-me-to-a-long-random-string";

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32 || s === PLACEHOLDER_SECRET) {
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
      throw new Error("AUTH_SECRET must be set to 32+ random characters");
    }
    return "dev-only-insecure-secret-change-me";
  }
  return s;
}

/** URL-safe random token. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Keyed hash for storing session ids and one-time tokens (never stored in clear). */
export function hashToken(token: string): string {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
