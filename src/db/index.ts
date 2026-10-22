import "server-only";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * libSQL: a local SQLite file in development (file:./data/accphe.db) and Turso in production
 * (DATABASE_URL + DATABASE_AUTH_TOKEN, or TURSO_DATABASE_URL + TURSO_AUTH_TOKEN from the Vercel integration).
 */
const globalForDb = globalThis as unknown as { __accpheDb?: ReturnType<typeof makeDb> };

function makeDb() {
  const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "file:./data/accphe.db";
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN });
  if (url.startsWith("file:")) {
    void client.execute("PRAGMA journal_mode=WAL").then(() => client.execute("PRAGMA busy_timeout=5000"));
  }
  return drizzle(client, { schema });
}

export const db = globalForDb.__accpheDb ?? makeDb();
if (process.env.NODE_ENV !== "production") globalForDb.__accpheDb = db;

export type DB = typeof db;
export { schema };
