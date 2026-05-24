"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Reading } from "@/lib/types";

export function AnomalyTimeline({ readings }: { readings: Reading[] }) {
  const data = readings
    .filter((r) => r.anomaly_score !== null)
    .map((r) => ({
      ts: new Date(r.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      score: r.anomaly_score,
      anomaly: r.is_anomaly,
    }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(0,229,255,0.08)" vertical={false} />
          <XAxis
            dataKey="ts"
            tick={{ fill: "#5C6790", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
          />
          <YAxis
            tick={{ fill: "#5C6790", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(14, 21, 48, 0.95)",
              border: "1px solid rgba(0,229,255,0.25)",
              borderRadius: 10,
              color: "#E9EEFB",
              fontSize: 12,
            }}
            labelStyle={{ color: "#8893B6" }}
          />
          <ReferenceLine y={-0.05} stroke="#FF4D2E" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#A6FF00"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload, index } = props as {
                cx: number;
                cy: number;
                index: number;
                payload: { anomaly: number };
              };
              if (!payload.anomaly) return <g key={index} />;
              return (
                <g key={index}>
                  <circle cx={cx} cy={cy} r={5} fill="#FF4D2E" opacity={0.85} />
                  <circle cx={cx} cy={cy} r={9} fill="none" stroke="#FF4D2E" strokeOpacity={0.4} />
                </g>
              );
            }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
