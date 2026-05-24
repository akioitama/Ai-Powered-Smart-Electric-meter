import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { readings } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/api-auth";
import { loadMeterForUser } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function bucket(meterId: number, hours: number) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const [row] = await db
    .select({
      max_energy: sql<number>`COALESCE(MAX(${readings.energyKwh}), 0)`,
      min_energy: sql<number>`COALESCE(MIN(${readings.energyKwh}), 0)`,
      avg_power: sql<number>`COALESCE(AVG(${readings.power}), 0)`,
      max_power: sql<number>`COALESCE(MAX(${readings.power}), 0)`,
      avg_voltage: sql<number>`COALESCE(AVG(${readings.voltage}), 0)`,
      samples: sql<number>`COUNT(*)`,
    })
    .from(readings)
    .where(and(eq(readings.meterId, meterId), gte(readings.ts, since)));

  const energy = Math.max(0, Number(row.max_energy) - Number(row.min_energy));
  return {
    energy_kwh: Number(energy.toFixed(3)),
    avg_power: Number(Number(row.avg_power).toFixed(2)),
    peak_power: Number(Number(row.max_power).toFixed(2)),
    avg_voltage: Number(Number(row.avg_voltage).toFixed(2)),
    samples: Number(row.samples),
  };
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) return jsonError("Invalid id");
  const { forbidden, notFound } = await loadMeterForUser(id, auth);
  if (notFound) return jsonError("Not found", 404);
  if (forbidden) return jsonError("Forbidden", 403);

  const [last24h, last7d, last30d] = await Promise.all([
    bucket(id, 24),
    bucket(id, 24 * 7),
    bucket(id, 24 * 30),
  ]);

  return NextResponse.json({ last_24h: last24h, last_7d: last7d, last_30d: last30d });
}
