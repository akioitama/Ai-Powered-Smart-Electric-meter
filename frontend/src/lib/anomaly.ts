/**
 * Lightweight statistical anomaly detection — replaces the original
 * Python Isolation Forest with a streaming z-score + simple rule
 * combo that is good enough for theft/abnormal-load detection.
 *
 * For each meter we maintain a rolling window of the last N readings
 * and compute a z-score on (current, power) versus the historical mean.
 * A reading is anomalous when:
 *   - |z_current| > Z_THRESHOLD or |z_power| > Z_THRESHOLD, AND
 *   - the absolute current is non-trivial (> 0.05 A), AND
 *   - we have at least MIN_HISTORY samples to compare against.
 *
 * The score returned is the negative max abs z-score, mirroring the
 * Isolation-Forest convention (lower = more anomalous).
 */

import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { readings } from "@/db/schema";

const WINDOW_SIZE = 60;
const MIN_HISTORY = 10;
const Z_THRESHOLD = 3.0;

interface Stats {
  mean: number;
  std: number;
}

function stats(xs: number[]): Stats {
  const n = xs.length;
  if (n === 0) return { mean: 0, std: 1 };
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const variance =
    xs.reduce((acc, v) => acc + (v - mean) ** 2, 0) / Math.max(1, n - 1);
  const std = Math.sqrt(Math.max(variance, 1e-6));
  return { mean, std: std === 0 ? 1 : std };
}

export interface AnomalyResult {
  score: number; // negative number: lower = more anomalous
  isAnomaly: boolean;
}

export async function scoreReading(
  meterId: number,
  voltage: number,
  current: number,
  power: number,
): Promise<AnomalyResult> {
  // Fetch the recent rolling window for this meter (excluding "now").
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24); // last 24h
  const recent = await db
    .select({
      current: readings.current,
      power: readings.power,
      voltage: readings.voltage,
    })
    .from(readings)
    .where(and(eq(readings.meterId, meterId), gte(readings.ts, since)))
    .orderBy(desc(readings.ts))
    .limit(WINDOW_SIZE);

  if (recent.length < MIN_HISTORY) {
    return { score: 0, isAnomaly: false };
  }

  const cs = stats(recent.map((r) => r.current));
  const ps = stats(recent.map((r) => r.power));
  const vs = stats(recent.map((r) => r.voltage));

  const zCurrent = (current - cs.mean) / cs.std;
  const zPower = (power - ps.mean) / ps.std;
  const zVoltage = (voltage - vs.mean) / vs.std;

  const maxAbs = Math.max(Math.abs(zCurrent), Math.abs(zPower), Math.abs(zVoltage));
  const score = -maxAbs / 30; // map roughly into -1..0 range like IsolationForest

  const isAnomaly =
    maxAbs > Z_THRESHOLD &&
    current > 0.05 &&
    // require the deviation to come from current OR power (not just noisy voltage)
    (Math.abs(zCurrent) > Z_THRESHOLD || Math.abs(zPower) > Z_THRESHOLD);

  return { score, isAnomaly };
}
