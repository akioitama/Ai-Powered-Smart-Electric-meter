import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
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
  const { forbidden, notFound } = await loadMeterForUser(id, auth);
  if (notFound) return jsonError("Not found", 404);
  if (forbidden) return jsonError("Forbidden", 403);

  const [r] = await db
    .select()
    .from(readings)
    .where(eq(readings.meterId, id))
    .orderBy(desc(readings.ts))
    .limit(1);

  if (!r) return jsonError("No readings yet", 404);

  return NextResponse.json({
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
  });
}
