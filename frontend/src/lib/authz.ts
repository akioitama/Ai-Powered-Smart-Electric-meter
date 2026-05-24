import { eq } from "drizzle-orm";
import { db } from "@/db";
import { meters } from "@/db/schema";
import type { AuthedUser } from "@/lib/api-auth";

/** Throws-by-returning-tuple style: returns the meter or `null` if forbidden / missing. */
export async function loadMeterForUser(meterId: number, user: AuthedUser) {
  const [m] = await db.select().from(meters).where(eq(meters.id, meterId)).limit(1);
  if (!m) return { meter: null as null, forbidden: false, notFound: true };
  if (user.role === "admin" || m.ownerUserId === user.id) {
    return { meter: m, forbidden: false, notFound: false };
  }
  return { meter: null as null, forbidden: true, notFound: false };
}
