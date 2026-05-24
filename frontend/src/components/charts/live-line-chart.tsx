"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";

export interface LivePoint {
  ts: number;
  power: number;
  voltage: number;
  current: number;
}

const METRIC_COLOR = {
  voltage: "#A6FF00",
  current: "#FFB020",
  power: "#00F0FF",
} as const;

export function LiveLineChart({
  points,
  metric = "power",
}: {
  points: LivePoint[];
  metric?: "power" | "voltage" | "current";
}) {
  const data = useMemo(
    () =>
      points.map((p) => ({
        time: new Date(p.ts).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        value: p[metric],
      })),
    [points, metric],
  );

  const last = data[data.length - 1];
  const color = METRIC_COLOR[metric];

  return (
    <div className="relative h-72">
      {/* radar sweep tint */}
      <div className="pointer-events-none absolute inset-0 animate-scan bg-scan-line opacity-30" />

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`stroke-${metric}`} x1="0" x2="1">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(120,200,255,0.08)" vertical={false} />
          <XAxis
            dataKey="time"
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
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(10, 15, 34, 0.95)",
              border: "1px solid rgba(0,229,255,0.3)",
              borderRadius: 12,
              color: "#EDF1FF",
              boxShadow: "0 0 32px rgba(0,229,255,0.25)",
              fontSize: 12,
              backdropFilter: "blur(8px)",
            }}
            labelStyle={{ color: "#8893B6" }}
            cursor={{ stroke: "rgba(0,229,255,0.4)", strokeWidth: 1, strokeDasharray: "3 3" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={`url(#stroke-${metric})`}
            strokeWidth={2.4}
            fill={`url(#grad-${metric})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      {last && (
        <div
          className="reading-mono absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-electric-400/40 bg-bg-deep/80 px-3 py-1 text-xs shadow-glow-cyan backdrop-blur"
          style={{ color }}
        >
          <span
            className="h-2 w-2 animate-pulseGlow rounded-full"
            style={{ background: color, boxShadow: `0 0 12px ${color}` }}
          />
          {metric === "voltage"
            ? `${last.value.toFixed(1)} V`
            : metric === "current"
              ? `${last.value.toFixed(2)} A`
              : last.value >= 1000
                ? `${(last.value / 1000).toFixed(2)} kW`
                : `${last.value.toFixed(0)} W`}
        </div>
      )}
    </div>
  );
}
