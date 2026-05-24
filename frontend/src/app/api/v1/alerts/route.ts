import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { alerts, meters } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(a: typeof alerts.$inferSelect) {
  return {
    id: a.id,
    meter_id: a.meterId,
    ts: a.ts.toISOString(),
    type: a.type,
    severity: a.severity,
    value: a.value,
    message: a.message,
    acknowledged_by: a.acknowledgedBy,
    acknowledged_at: a.acknowledgedAt ? a.acknowledgedAt.toISOString() : null,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const meterIdParam = url.searchParams.get("meter_id");
  const unackOnly = url.searchParams.get("unack_only") === "true";
  const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get("limit") ?? 100)));

  // Determine the meter ids accessible to this user.
  let allowedMeterIds: number[] | null = null;
  if (auth.role !== "admin") {
    const owned = await db
      .select({ id: meters.id })
      .from(meters)
      .where(eq(meters.ownerUserId, auth.id));
    allowedMeterIds = owned.map((m) => m.id);
    if (allowedMeterIds.length === 0) return NextResponse.json([]);
  }

  const conditions = [] as ReturnType<typeof eq>[];
  if (meterIdParam) {
    const mid = Number(meterIdParam);
    if (!Number.isFinite(mid)) return jsonError("Invalid meter_id");
    if (allowedMeterIds && !allowedMeterIds.includes(mid)) return jsonError("Forbidden", 403);
    conditions.push(eq(alerts.meterId, mid));
  } else if (allowedMeterIds) {
    conditions.push(inArray(alerts.meterId, allowedMeterIds));
  }
  if (unackOnly) conditions.push(isNull(alerts.acknowledgedAt) as unknown as ReturnType<typeof eq>);

  const where = conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : and(...conditions);

  const rows = where
    ? await db.select().from(alerts).where(where).orderBy(desc(alerts.ts)).limit(limit)
    : await db.select().from(alerts).orderBy(desc(alerts.ts)).limit(limit);

  return NextResponse.json(rows.map(serialize));
}
