import type { Config } from "drizzle-kit";

// drizzle-kit auto-loads .env / .env.local from the project root.

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://invalid",
  },
  strict: true,
  verbose: true,
} satisfies Config;
