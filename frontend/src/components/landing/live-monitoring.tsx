"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ShieldAlert, Sparkles, Zap } from "lucide-react";

interface Alert {
  id: number;
  ts: number;
  severity: "critical" | "warning" | "info";
  title: string;
  meter: string;
  detail: string;
}

const SAMPLE_ALERTS: Omit<Alert, "id" | "ts">[] = [
  {
    severity: "critical",
    title: "Possible theft at Sector G-9",
    meter: "MTR-2148",
    detail: "Isolation-Forest score -0.072 · current spike +148%",
  },
  {
    severity: "warning",
    title: "Overvoltage event",
    meter: "MTR-1098",
    detail: "Voltage 256.3 V > threshold 250 V — auto cut-off",
  },
  {
    severity: "info",
    title: "Tamper signature cleared",
    meter: "MTR-0419",
    detail: "Casing reseal confirmed by technician",
  },
  {
    severity: "critical",
    title: "Grid imbalance detected",
    meter: "MTR-3370",
    detail: "Phase delta exceeded 4.2° on bus 18",
  },
  {
    severity: "warning",
    title: "Anomalous load curve",
    meter: "MTR-2240",
    detail: "Drift detected vs. 30-day baseline",
  },
];

export function LiveMonitoring() {
  // simulated live consumption series
  const [series, setSeries] = useState<number[]>(() =>
    Array.from({ length: 40 }, (_, i) => 0.6 + Math.sin(i * 0.4) * 0.18 + 0.08),
  );
  const [score, setScore] = useState(0.92);
  const [voltage, setVoltage] = useState(219.4);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      counter.current += 1;
      const t = counter.current * 0.4;
      const next = 0.6 + Math.sin(t) * 0.22 + (Math.random() - 0.5) * 0.18;
      setSeries((prev) => [...prev.slice(1), Math.max(0.05, next)]);
      setScore((s) => Math.min(0.99, Math.max(0.4, s + (Math.random() - 0.5) * 0.08)));
      setVoltage((v) => 220 + Math.sin(t * 0.6) * 4 + (Math.random() - 0.5) * 1.4);

      if (counter.current % 6 === 3) {
        const sample = SAMPLE_ALERTS[Math.floor(Math.random() * SAMPLE_ALERTS.length)];
        setAlerts((prev) =>
          [{ ...sample, id: counter.current, ts: Date.now() }, ...prev].slice(0, 5),
        );
      }
    }, 1100);
    return () => clearInterval(id);
  }, []);

  const path = useMemo(() => buildPath(series, 600, 180), [series]);

  return (
    <section id="analytics" className="relative py-24 sm:py-32">
      <div className="container-tight">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="eyebrow">Live AI Monitoring</span>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            A command center for{" "}
            <span className="holo-text">every watt on the grid.</span>
          </h2>
          <p className="mt-4 text-balance text-ink-muted">
            Realtime telemetry, sub-second relay control, and AI confidence scoring — streaming from every meter,
            all the time.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Live consumption chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="holo-card relative col-span-12 overflow-hidden p-6 lg:col-span-8"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-dim">
                  Realtime consumption · Sector G-9
                </div>
                <div className="reading-mono mt-1 text-4xl font-bold">
                  {(series[series.length - 1] * 1000).toFixed(0)}
                  <span className="ml-1 text-base font-medium text-ink-muted">W</span>
                </div>
              </div>
              <LivePill />
            </div>

            {/* chart */}
            <div className="relative mt-6 h-[220px]">
              <ChartGrid />
              <svg viewBox="0 0 600 180" className="absolute inset-0 h-full w-full">
                <defs>
                  <linearGradient id="lineGrad" x1="0" x2="1">
                    <stop offset="0" stopColor="#00F0FF" />
                    <stop offset="0.5" stopColor="#8B5CF6" />
                    <stop offset="1" stopColor="#FF3DCC" />
                  </linearGradient>
                  <linearGradient id="fillGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#00F0FF" stopOpacity="0.4" />
                    <stop offset="1" stopColor="#00F0FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${path.line} L 600 180 L 0 180 Z`} fill="url(#fillGrad)" />
                <path d={path.line} stroke="url(#lineGrad)" strokeWidth="2.4" fill="none" strokeLinejoin="round" />
                {/* head dot */}
                <circle cx={path.headX} cy={path.headY} r="5" fill="#00F0FF">
                  <animate attributeName="r" values="4;6;4" dur="1.6s" repeatCount="indefinite" />
                </circle>
                <circle cx={path.headX} cy={path.headY} r="11" fill="#00F0FF" opacity="0.18" />
              </svg>

              {/* scan line */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-12 animate-scan bg-scan-line" />
            </div>

            {/* mini stats */}
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
              <MiniStat
                icon={<Zap className="h-3.5 w-3.5" />}
                label="Voltage"
                value={`${voltage.toFixed(1)} V`}
                tone="cyan"
              />
              <MiniStat
                icon={<Sparkles className="h-3.5 w-3.5" />}
                label="AI Confidence"
                value={`${Math.round(score * 100)}%`}
                tone="violet"
              />
              <MiniStat
                icon={<ShieldAlert className="h-3.5 w-3.5" />}
                label="Anomalies / 24h"
                value="3"
                tone="magenta"
              />
            </div>
          </motion.div>

          {/* Alert stream */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="holo-card col-span-12 p-6 lg:col-span-4"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-dim">
                AI Alert Stream
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-electric-400/30 bg-electric-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-electric-200">
                <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-electric-400" />
                LIVE
              </span>
            </div>

            <div className="relative mt-4 h-[420px] overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-bg-card via-bg-card/70 to-transparent" />
              <AnimatePresence initial={false}>
                {alerts.map((a) => (
                  <motion.div
                    key={a.id}
                    layout
                    initial={{ opacity: 0, y: -12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="mb-3"
                  >
                    <AlertCard alert={a} />
                  </motion.div>
                ))}
              </AnimatePresence>

              {alerts.length === 0 && (
                <div className="flex h-full items-center justify-center text-sm text-ink-dim">
                  Listening to the grid...
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function LivePill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-success">
      <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-success" />
      Streaming
    </span>
  );
}

function ChartGrid() {
  return (
    <div className="absolute inset-0">
      <div className="grid-bg-lg absolute inset-0 opacity-50" />
      <div className="absolute inset-y-0 left-0 right-0 flex flex-col justify-between text-[10px] text-ink-faint">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-t border-border/40 pl-2">
            {(2 - i * 0.5).toFixed(1)} kW
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "cyan" | "violet" | "magenta";
}) {
  const toneMap = {
    cyan: "text-electric-200",
    violet: "text-neon-violet",
    magenta: "text-neon-magenta",
  };
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${toneMap[tone]}`}>
        {icon}
        {label}
      </div>
      <div className="reading-mono mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const toneMap = {
    critical: "border-danger/40 bg-danger/10 text-danger",
    warning: "border-warn/40 bg-warn/10 text-warn",
    info: "border-electric-400/30 bg-electric-400/10 text-electric-200",
  } as const;
  const Icon = alert.severity === "info" ? Sparkles : AlertTriangle;
  return (
    <div className={`relative rounded-xl border bg-bg-deep/60 p-3 backdrop-blur-md ${toneMap[alert.severity]}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md border border-current/30 bg-current/10 p-1.5">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em]">
              {alert.severity}
            </span>
            <span className="reading-mono text-[10px] text-ink-dim">{alert.meter}</span>
          </div>
          <div className="mt-1 text-sm font-semibold text-ink">{alert.title}</div>
          <div className="mt-0.5 truncate text-xs text-ink-muted">{alert.detail}</div>
        </div>
      </div>
    </div>
  );
}

function buildPath(series: number[], w: number, h: number) {
  const max = 1.4;
  const min = 0;
  const scaleY = (v: number) => h - ((v - min) / (max - min)) * (h - 10) - 5;
  const stepX = w / (series.length - 1);
  const points = series.map((v, i) => `${i * stepX},${scaleY(v).toFixed(2)}`);
  return {
    line: `M ${points.join(" L ")}`,
    headX: (series.length - 1) * stepX,
    headY: scaleY(series[series.length - 1]),
  };
}
