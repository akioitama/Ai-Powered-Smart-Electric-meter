"use client";

import { motion } from "framer-motion";

interface VoltageGaugeProps {
  voltage: number | null;
  low: number;
  high: number;
}

export function VoltageGauge({ voltage, low, high }: VoltageGaugeProps) {
  const min = 100;
  const max = 300;
  const v = voltage ?? min;
  const clamped = Math.min(Math.max(v, min), max);
  const ratio = (clamped - min) / (max - min);
  const angle = -120 + ratio * 240;

  // Color zones
  const isUnsafe = v < low || v > high;
  const isMarginal = (v >= low - 5 && v < low) || (v > high && v <= high + 5);
  const tone = isUnsafe ? "#FF4D2E" : isMarginal ? "#FFB020" : "#00E5FF";

  return (
    <div className="relative w-full max-w-xs aspect-square mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="gaugeArc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FF4D2E" />
            <stop offset="20%" stopColor="#FFB020" />
            <stop offset="40%" stopColor="#00E5FF" />
            <stop offset="60%" stopColor="#00E5FF" />
            <stop offset="80%" stopColor="#FFB020" />
            <stop offset="100%" stopColor="#FF4D2E" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d="M30,150 A80,80 0 1,1 170,150"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Active arc */}
        <path
          d="M30,150 A80,80 0 1,1 170,150"
          fill="none"
          stroke="url(#gaugeArc)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray="378"
          strokeDashoffset={378 - ratio * 378}
          style={{ filter: "drop-shadow(0 0 8px rgba(0,229,255,0.45))" }}
        />

        {/* Tick marks at low / high thresholds */}
        {[low, high].map((t) => {
          const r = (Math.min(Math.max(t, min), max) - min) / (max - min);
          const a = (-120 + r * 240) * (Math.PI / 180);
          const x1 = 100 + Math.cos(a) * 70;
          const y1 = 100 + Math.sin(a) * 70 + 50;
          const x2 = 100 + Math.cos(a) * 86;
          const y2 = 100 + Math.sin(a) * 86 + 50;
          return (
            <line
              key={t}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#FF4D2E"
              strokeWidth="2"
              opacity="0.7"
            />
          );
        })}

        {/* Needle */}
        <motion.line
          x1="100"
          y1="150"
          x2="100"
          y2="78"
          stroke={tone}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ originX: "100px", originY: "150px", filter: `drop-shadow(0 0 6px ${tone})` }}
          animate={{ rotate: angle }}
          transition={{ type: "spring", stiffness: 80, damping: 14 }}
        />
        <circle cx="100" cy="150" r="6" fill={tone} />
      </svg>

      <div className="absolute inset-x-0 bottom-2 text-center">
        <div className="reading-mono text-4xl font-bold" style={{ color: tone, textShadow: `0 0 16px ${tone}` }}>
          {voltage !== null ? voltage.toFixed(1) : "—"}
          <span className="text-base text-ink-muted ml-1">V</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-dim">
          Safe band {low}–{high} V
        </div>
      </div>
    </div>
  );
}
