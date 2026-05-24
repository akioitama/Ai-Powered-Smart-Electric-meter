import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { alerts, meters, readings } from "@/db/schema";
import { jsonError } from "@/lib/api-auth";
import { verifyPassword } from "@/lib/password";
import { scoreReading } from "@/lib/anomaly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface IngestReading {
  ts?: string;
  voltage: number;
  current: number;
  power?: number;
  energy_kwh?: number;
  frequency?: number | null;
  power_factor?: number | null;
}

interface IngestBatch {
  meter_uid: string;
  token: string;
  readings: IngestReading[];
}

/**
 * HTTP-first ingestion endpoint for the Pi. Auth-by-body
 * (`{ meter_uid, token, readings: [...] }`) so the Pi can use a single
 * cheap POST per batch without managing headers.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as IngestBatch | null;
  if (!body || !body.meter_uid || !body.token || !Array.isArray(body.readings)) {
    return jsonError("Invalid ingest payload");
  }

  const [meter] = await db.select().from(meters).where(eq(meters.meterUid, body.meter_uid)).limit(1);
  if (!meter) return jsonError("Invalid meter credentials", 401);
  const ok = await verifyPassword(body.token, meter.accessTokenHash);
  if (!ok) return jsonError("Invalid meter credentials", 401);

  let inserted = 0;
  for (const r of body.readings) {
    const power = r.power ?? r.voltage * r.current;
    const ts = r.ts ? new Date(r.ts) : new Date();

    const ai = await scoreReading(meter.id, r.voltage, r.current, power);

    await db.insert(readings).values({
      meterId: meter.id,
      ts,
      voltage: r.voltage,
      current: r.current,
      power,
      energyKwh: r.energy_kwh ?? 0,
      frequency: r.frequency ?? null,
      powerFactor: r.power_factor ?? null,
      anomalyScore: ai.score,
      isAnomaly: ai.isAnomaly ? 1 : 0,
    });

    // Threshold-based alerts.
    const alertsToInsert: Array<typeof alerts.$inferInsert> = [];
    if (r.voltage < meter.lowVThreshold) {
      alertsToInsert.push({
        meterId: meter.id,
        type: "voltage_low",
        severity: "warning",
        value: r.voltage,
        message: `Voltage ${r.voltage.toFixed(1)}V below ${meter.lowVThreshold}V`,
      });
    } else if (r.voltage > meter.highVThreshold) {
      alertsToInsert.push({
        meterId: meter.id,
        type: "voltage_high",
        severity: "warning",
        value: r.voltage,
        message: `Voltage ${r.voltage.toFixed(1)}V above ${meter.highVThreshold}V`,
      });
    }
    if (ai.isAnomaly) {
      alertsToInsert.push({
        meterId: meter.id,
        type: "theft",
        severity: "critical",
        value: power,
        message: `Anomalous load detected (score ${ai.score.toFixed(3)})`,
      });
    }
    if (alertsToInsert.length > 0) {
      await db.insert(alerts).values(alertsToInsert);
    }

    inserted++;
  }

  await db
    .update(meters)
    .set({ online: true, lastSeen: new Date() })
    .where(eq(meters.id, meter.id));

  return NextResponse.json({ accepted: inserted });
}
