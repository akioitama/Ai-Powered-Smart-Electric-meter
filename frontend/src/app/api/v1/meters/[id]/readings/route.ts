import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { readings } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/api-auth";
import { loadMeterForUser } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) return jsonError("Invalid id");
  const { meter, forbidden, notFound } = await loadMeterForUser(id, auth);
  if (notFound) return jsonError("Not found", 404);
  if (forbidden || !meter) return jsonError("Forbidden", 403);

  const url = new URL(req.url);
  const hours = Math.min(720, Math.max(1, Number(url.searchParams.get("hours") ?? 24)));
  const limit = Math.min(5000, Math.max(1, Number(url.searchParams.get("limit") ?? 500)));

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(readings)
    .where(and(eq(readings.meterId, id), gte(readings.ts, since)))
    .orderBy(desc(readings.ts))
    .limit(limit);

  return NextResponse.json(
    rows
      .map((r) => ({
        id: r.id,
        meter_id: r.meterId,
        ts: r.ts.toISOString(),
        voltage: r.voltage,
        current: r.current,
        power: r.power,
        energy_kwh: r.energyKwh,
        frequency: r.frequency,
        power_factor: r.powerFactor,
        anomaly_score: r.anomalyScore,
        is_anomaly: r.isAnomaly,
      }))
      .reverse(),
  );
}
