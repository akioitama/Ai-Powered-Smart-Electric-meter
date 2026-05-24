"use client";

import { useMemo } from "react";
import type { Reading } from "@/lib/types";
import { cn } from "@/lib/cn";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AnomalyHeatmap({ readings }: { readings: Reading[] }) {
  const grid = useMemo(() => {
    const map: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    const counts: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const r of readings) {
      const d = new Date(r.ts);
      const day = (d.getDay() + 6) % 7; // Mon=0
      const h = d.getHours();
      counts[day][h] += 1;
      if (r.is_anomaly) map[day][h] += 1;
    }
    const ratio: number[][] = map.map((row, di) =>
      row.map((v, hi) => (counts[di][hi] === 0 ? 0 : v / counts[di][hi])),
    );
    return ratio;
  }, [readings]);

  const max = Math.max(0.01, ...grid.flat());

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid" style={{ gridTemplateColumns: "60px repeat(24, 1fr)" }}>
          <div />
          {HOURS.map((h) => (
            <div key={h} className="text-[10px] text-ink-dim text-center py-1">
              {h % 6 === 0 ? `${h}:00` : ""}
            </div>
          ))}
          {DAYS.map((day, di) => (
            <Row key={day} day={day} cells={grid[di]} max={max} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-ink-muted">
          <span>Less</span>
          {[0.05, 0.2, 0.4, 0.6, 0.85].map((stop) => (
            <span
              key={stop}
              className="h-4 w-6 rounded"
              style={{ background: cellColor(stop) }}
            />
          ))}
          <span>More anomalies</span>
        </div>
      </div>
    </div>
  );
}

function Row({ day, cells, max }: { day: string; cells: number[]; max: number }) {
  return (
    <>
      <div className="text-xs text-ink-muted py-1 pr-2 text-right self-center">{day}</div>
      {cells.map((v, i) => {
        const rel = v / max;
        return (
          <div
            key={i}
            title={`${day} ${i}:00 — ${(v * 100).toFixed(0)}% anomalous`}
            className={cn(
              "h-6 m-[1px] rounded transition-transform hover:scale-110 hover:z-10",
            )}
            style={{ background: rel === 0 ? "rgba(255,255,255,0.04)" : cellColor(rel) }}
          />
        );
      })}
    </>
  );
}

function cellColor(rel: number) {
  // Cyan (low) → orange → red (high)
  const r = Math.round(0 + rel * 255);
  const g = Math.round(229 - rel * 200);
  const b = Math.round(255 - rel * 220);
  return `rgba(${r}, ${g}, ${b}, ${0.25 + 0.55 * rel})`;
}
