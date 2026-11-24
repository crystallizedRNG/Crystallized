import { getDatabase, type DatabaseConnection } from "@netlify/database";
import { drizzle } from "drizzle-orm/netlify-db";
import type { Pool } from "pg";
import * as schema from "./schema";

/**
 * Netlify Database connection. The connection string is provided by the platform automatically
 * (NETLIFY_DB_URL). It is created lazily so that `next build` never needs a live database.
 */
const g = globalThis as typeof globalThis & {
  __crystallizedConn?: DatabaseConnection;
  __crystallizedDb?: ReturnType<typeof createDb>;
};

function createDb(conn: DatabaseConnection) {
  return drizzle({ schema, client: conn });
}

function connection(): DatabaseConnection {
  if (!g.__crystallizedConn) g.__crystallizedConn = getDatabase();
  return g.__crystallizedConn;
}

/** pg-compatible pool (node-postgres or Neon serverless, depending on the runtime) */
export function getPool(): Pool {
  return connection().pool as unknown as Pool;
}

export function getDb() {
  if (!g.__crystallizedDb) g.__crystallizedDb = createDb(connection());
  return g.__crystallizedDb;
}
