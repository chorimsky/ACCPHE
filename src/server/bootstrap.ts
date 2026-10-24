/**
 * Production start-up, run once per server instance from src/instrumentation.ts.
 *
 * 1. Applies pending migrations to the production database, so a new Turso database (or a deployment that adds a
 *    migration) never serves "no such table" errors. The migrations are bundled into the code
 *    (src/db/migrations.generated.ts) and applied in one atomic batch, recorded in drizzle-kit's __drizzle_migrations
 *    table. Preview deployments share the integration's database and never migrate it; development uses db:push.
 * 2. With BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_TOKEN set, creates the first administrator on an empty database, or
 *    issues that administrator a fresh password-setup link: /portal/reset/<BOOTSTRAP_ADMIN_TOKEN>, valid for 24 hours.
 *    Each token value works once; remove both variables after the password is set.
 *
 * Imports only what runs outside the React server environment (no "server-only" modules).
 */
import { createHmac, randomBytes } from "node:crypto";
import { type Client, createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { and, count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { DEFAULT_NOTICE } from "@/content/site";
import { MIGRATIONS } from "@/db/migrations.generated";
import { auditLog, authTokens, siteContent, users } from "@/db/schema";

export async function bootstrapProduction() {
  if (process.env.VERCEL_ENV !== "production") return;
  const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
  if (!url) return;
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN });
  const db = drizzle(client);
  try {
    await migrate(client);
    await createFirstAdmin(db);
  } catch (e) {
    // Another instance starting at the same moment may have applied the migration first; the next start retries.
    console.error("[bootstrap]", e instanceof Error ? e.message : e);
  } finally {
    client.close();
  }
}

async function migrate(client: Client) {
  await client.execute('CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric)');
  const last = await client.execute('SELECT created_at FROM "__drizzle_migrations" ORDER BY created_at DESC LIMIT 1');
  const appliedUntil = last.rows.length ? Number(last.rows[0].created_at) : -1;
  const pending = MIGRATIONS.filter((m) => m.when > appliedUntil);
  if (!pending.length) return;
  await client.batch(
    pending.flatMap((m) => [...m.statements, { sql: 'INSERT INTO "__drizzle_migrations" ("hash", "created_at") VALUES (?, ?)', args: [m.hash, m.when] }]),
    "write",
  );
  console.log(`[bootstrap] applied migrations: ${pending.map((m) => m.tag).join(", ")}`);
}

/**
 * BOOTSTRAP_ADMIN_EMAIL + BOOTSTRAP_ADMIN_TOKEN: on an empty database, create the first administrator; on a database
 * that already has that administrator, issue a fresh password-setup link instead (for when the first link expired).
 * Each token value is honoured once, ever (recorded in the audit log); set a new value to issue another link.
 */
async function createFirstAdmin(db: ReturnType<typeof drizzle>) {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const token = process.env.BOOTSTRAP_ADMIN_TOKEN?.trim();
  const secret = process.env.AUTH_SECRET;
  if (!email || !token || token.length < 32 || !secret) return;
  const tokenHash = createHmac("sha256", secret).update(token).digest("hex");
  const marker = `bootstrap:${tokenHash.slice(0, 32)}`;
  const [seen] = await db.select({ id: auditLog.id }).from(auditLog).where(and(eq(auditLog.action, "bootstrap.admin_link"), eq(auditLog.entityId, marker)));
  if (seen) return;

  const [{ n }] = await db.select({ n: count() }).from(users);
  let userId: string;
  let created = false;
  if (n === 0) {
    const [u] = await db
      .insert(users)
      .values({
        email,
        name: process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Site Administrator",
        position: "Executive Secretariat",
        org: "Executive Secretariat",
        role: "admin",
        status: "active",
        passwordHash: await bcrypt.hash(randomBytes(24).toString("base64url"), 11),
      })
      .returning();
    await db.insert(siteContent).values({ id: 1, notice: DEFAULT_NOTICE }).onConflictDoNothing();
    userId = u.id;
    created = true;
  } else {
    // Only an existing, active administrator with this email can be given a new link.
    const [u] = await db.select().from(users).where(and(eq(users.email, email), eq(users.role, "admin"), eq(users.status, "active")));
    if (!u) return;
    userId = u.id;
  }
  // Record first, so that two instances starting together cannot both issue the link.
  await db.insert(auditLog).values({
    who: "System",
    action: "bootstrap.admin_link",
    entityType: "user",
    entityId: marker,
    summary: created ? `First administrator created for ${email}; password-setup link issued (24 hours)` : `New password-setup link issued for ${email} (24 hours)`,
  });
  await db.insert(authTokens).values({ userId, purpose: "password_reset", tokenHash, expiresAt: new Date(Date.now() + 24 * 3600_000) });
  console.log(`[bootstrap] ${created ? "first administrator created" : "new password-setup link issued"} for ${email}; valid for 24 hours`);
}
