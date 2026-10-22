// Refuses destructive schema commands (db:push / db:reset) against anything but a local SQLite file.
const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "file:./data/accphe.db";
if (!url.startsWith("file:")) {
  console.error(`Refusing to run against ${url.replace(/\/\/.*@/, "//***@")}: use "npm run db:migrate" for remote databases.`);
  process.exit(1);
}
