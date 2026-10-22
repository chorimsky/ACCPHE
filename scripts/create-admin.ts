/**
 * Create the first administrator on a fresh database (production included):
 *   npm run admin:create -- "Full Name" admin@yourdomain
 * Prints a one-time link to choose a password (valid 60 minutes). Refuses if the email already exists.
 */
import bcrypt from "bcryptjs";
import { createHmac, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { authTokens, siteContent, users } from "@/db/schema";
import { DEFAULT_NOTICE } from "@/content/site";

const [name, emailRaw] = process.argv.slice(2);
const email = (emailRaw ?? "").trim().toLowerCase();
if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run admin:create -- "Full Name" admin@yourdomain');
  process.exit(1);
}
const secret = process.env.AUTH_SECRET;
if (!secret || secret.length < 32) {
  console.error("AUTH_SECRET must be set (32+ characters) — the same value as the deployment.");
  process.exit(1);
}

(async () => {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) throw new Error("An account already exists for this email.");
  const [u] = await db
    .insert(users)
    .values({ email, name, position: "Executive Secretariat", org: "Executive Secretariat", role: "admin", status: "active", passwordHash: await bcrypt.hash(randomBytes(24).toString("base64url"), 11) })
    .returning();
  await db.insert(siteContent).values({ id: 1, notice: DEFAULT_NOTICE }).onConflictDoNothing();
  const token = randomBytes(32).toString("base64url");
  await db.insert(authTokens).values({ userId: u.id, purpose: "password_reset", tokenHash: createHmac("sha256", secret).update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600_000) });
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  console.log(`Administrator created: ${name} <${email}>`);
  console.log(`Choose a password within 60 minutes: ${base}/portal/reset/${token}`);
  process.exit(0);
})().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
