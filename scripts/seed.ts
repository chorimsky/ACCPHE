/**
 * Load the demonstration data set (see src/server/demo.ts). Destructive: it replaces all data.
 * Runs against local SQLite files; a remote (preview) database needs ALLOW_REMOTE_SEED=1 and is always refused
 * for production.
 */
import { seedDemo, DEMO_USERS } from "@/server/demo";

const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "file:./data/accphe.db";
if (process.env.VERCEL_ENV === "production" || (!url.startsWith("file:") && process.env.ALLOW_REMOTE_SEED !== "1")) {
  console.error("Refusing to seed demonstration data into this database. (Remote preview databases: set ALLOW_REMOTE_SEED=1.)");
  process.exit(1);
}

seedDemo()
  .then((r) => {
    console.log(`Demonstration data loaded: ${r.applications} applications, ${r.users} demo accounts.`);
    console.log(`Demo accounts (password: see src/server/demo-credentials.ts):`);
    for (const u of DEMO_USERS) console.log(`  ${u.role.padEnd(12)} ${u.email}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
