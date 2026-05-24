import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";

let bootstrapped = false;
let inFlight: Promise<void> | null = null;

/**
 * Idempotently ensures the admin user exists. Safe to call on every request
 * (the early-return guard means it only does real work the first time per
 * lambda warm cycle).
 */
export async function ensureBootstrap(): Promise<void> {
  if (bootstrapped) return;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@aimeter.com").toLowerCase();
      const adminPassword = process.env.ADMIN_PASSWORD ?? "admin12345";
      const adminName = process.env.ADMIN_NAME ?? "Administrator";

      const [existing] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
      if (!existing) {
        const passwordHash = await hashPassword(adminPassword);
        await db.insert(users).values({
          email: adminEmail,
          name: adminName,
          passwordHash,
          role: "admin",
          isActive: true,
        });
      }
      bootstrapped = true;
    } finally {
      inFlight = null;
    }
  })();

  await inFlight;
}
