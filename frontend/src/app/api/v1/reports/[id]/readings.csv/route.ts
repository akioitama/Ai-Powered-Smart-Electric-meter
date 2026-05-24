import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { readings } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/api-auth";
import { loadMeterForUser } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) return jsonError("Invalid id");
  const { meter, forbidden, notFound } = await loadMeterForUser(id, auth);
  if (notFound) return jsonError("Not found", 404);
  if (forbidden || !meter) return jsonError("Forbidden", 403);

  const url = new URL(req.url);
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get("days") ?? 7)));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(readings)
    .where(and(eq(readings.meterId, id), gte(readings.ts, since)))
    .orderBy(asc(readings.ts));

  const lines = [
    [
      "timestamp",
      "voltage_v",
      "current_a",
      "power_w",
      "energy_kwh",
      "frequency_hz",
      "power_factor",
      "anomaly_score",
      "is_anomaly",
    ].join(","),
    ...rows.map((r) =>
      [
        r.ts.toISOString(),
        r.voltage,
        r.current,
        r.power,
        r.energyKwh,
        r.frequency ?? "",
        r.powerFactor ?? "",
        r.anomalyScore ?? "",
        r.isAnomaly,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  const csv = lines.join("\n");
  const fname = `meter_${meter.meterUid}_readings_${days}d.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fname}"`,
    },
  });
}
