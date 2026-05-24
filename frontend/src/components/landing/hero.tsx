"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap, Activity } from "lucide-react";

const MeterScene = dynamic(
  () => import("@/components/three/meter-scene").then((m) => m.MeterScene),
  { ssr: false, loading: () => <MeterFallback /> },
);

export function Hero() {
  return (
    <section className="relative pt-36 pb-20 sm:pt-44 sm:pb-32">
      <div className="container-tight">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="space-y-7"
            >
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-electric-400 shadow-glow-cyan" />
                AI Energy Intelligence · Realtime
              </span>

              <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[64px]">
                <span className="block">AI-Powered</span>
                <span className="block holo-text">Energy Intelligence</span>
                <span className="block text-ink/90">for the next-gen grid.</span>
              </h1>

              <p className="max-w-xl text-balance text-base leading-relaxed text-ink-muted sm:text-lg">
                Detect electricity theft, voltage anomalies, and overload risk before they cost you a megawatt.
                A cinematic command center that brings every meter, every watt, every threat into a single pane of glass.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-holo-gradient bg-[length:200%_200%] px-5 py-3 text-sm font-semibold text-bg-deep shadow-glow-cyan animate-[border-flow_6s_ease-in-out_infinite] hover:shadow-glow-strong"
                >
                  <span className="relative z-10">Enter the Command Center</span>
                  <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>
                <a
                  href="#engine"
                  className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-bg-card/40 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-bg-card/70"
                >
                  See the AI in action
                </a>
              </div>

              {/* Trust strip */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-xs text-ink-dim">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-electric-300" /> Tamper-proof telemetry
                </span>
                <span className="inline-flex items-center gap-2">
                  <Zap className="h-4 w-4 text-neon-violet" /> Sub-second relay control
                </span>
                <span className="inline-flex items-center gap-2">
                  <Activity className="h-4 w-4 text-neon-magenta" /> Isolation-Forest anomaly engine
                </span>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
              className="relative aspect-square w-full"
            >
              {/* glowing back-disc */}
              <div className="pointer-events-none absolute inset-6 rounded-full bg-electric-400/15 blur-3xl" />
              <div className="pointer-events-none absolute inset-12 rounded-full bg-neon-violet/15 blur-3xl" />

              {/* canvas */}
              <div className="absolute inset-0">
                <MeterScene />
              </div>

              {/* HUD overlays */}
              <HudReadout
                className="left-2 top-10 sm:left-0"
                label="Voltage"
                value="219.8 V"
                tone="cyan"
              />
              <HudReadout
                className="right-0 top-1/3"
                label="AI Score"
                value="-0.013"
                tone="violet"
              />
              <HudReadout
                className="left-4 bottom-12"
                label="Power"
                value="1.42 kW"
                tone="magenta"
              />

              {/* corner brackets */}
              <CornerBrackets />
            </motion.div>
          </div>
        </div>

        {/* Logo / partners marquee */}
        <PartnerStrip />
      </div>
    </section>
  );
}

function HudReadout({
  className,
  label,
  value,
  tone,
}: {
  className?: string;
  label: string;
  value: string;
  tone: "cyan" | "violet" | "magenta";
}) {
  const toneMap = {
    cyan: "border-electric-400/40 text-electric-200 shadow-glow-cyan",
    violet: "border-neon-violet/40 text-neon-violet shadow-glow-violet",
    magenta: "border-neon-magenta/40 text-neon-magenta shadow-glow-magenta",
  } as const;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      className={`absolute z-10 select-none rounded-xl border bg-bg-deep/70 px-3 py-2 backdrop-blur-md ${toneMap[tone]} ${className ?? ""}`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-dim">
        {label}
      </div>
      <div className="reading-mono mt-0.5 text-base font-semibold">{value}</div>
    </motion.div>
  );
}

function CornerBrackets() {
  const corner = "absolute h-6 w-6 border-electric-400/70";
  return (
    <>
      <span className={`${corner} left-0 top-0 border-l border-t`} />
      <span className={`${corner} right-0 top-0 border-r border-t`} />
      <span className={`${corner} left-0 bottom-0 border-l border-b`} />
      <span className={`${corner} right-0 bottom-0 border-r border-b`} />
    </>
  );
}

function MeterFallback() {
  return (
    <div className="absolute inset-12 animate-pulse rounded-3xl border border-border bg-bg-card/50 backdrop-blur-xl" />
  );
}

function PartnerStrip() {
  const items = [
    "City of Helios · Smart Grid Initiative",
    "Lahore Power Authority",
    "EDF · Innovation Lab",
    "Tesla Energy",
    "Siemens Grid Edge",
    "GE Smart Cities",
  ];
  return (
    <div className="mt-20 sm:mt-28">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-dim">
        Trusted by forward-thinking utilities
      </p>
      <div className="mask-fade-x mt-6 flex overflow-hidden">
        <div className="flex shrink-0 animate-marquee gap-12 whitespace-nowrap">
          {[...items, ...items].map((it, i) => (
            <span key={i} className="text-sm text-ink-dim">
              {it}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
