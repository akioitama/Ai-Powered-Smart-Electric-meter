import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { Sql } from "postgres";
import * as schema from "./schema";

let _client: Sql<{}> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getClient() {
  if (_client) return _client;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it in your .env.local or Vercel project settings.",
    );
  }
  _client = postgres(url, { max: 1, idle_timeout: 20, prepare: false });
  return _client;
}

function getDb() {
  if (_db) return _db;
  _db = drizzle(getClient(), { schema });
  return _db;
}

// Proxy so importing modules at build time doesn't trigger connection setup —
// only on first method call do we actually instantiate the client.
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    const real = getDb();
    const value = (real as unknown as Record<string | symbol, unknown>)[prop as string];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
