"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const GridNetwork = dynamic(
  () => import("@/components/three/grid-network").then((m) => m.GridNetwork),
  { ssr: false, loading: () => <div className="absolute inset-0 animate-pulse bg-bg-card/40" /> },
);

export function GridIntelligence() {
  return (
    <section id="grid" className="relative py-24 sm:py-32">
      <div className="container-tight">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="eyebrow">Smart-Grid Intelligence</span>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            See your grid as a{" "}
            <span className="holo-text">living organism.</span>
          </h2>
          <p className="mt-4 text-balance text-ink-muted">
            Every meter, transformer and substation rendered in one connected mesh — pulsing red the moment something breaks pattern.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="holo-card relative overflow-hidden p-2"
        >
          <div className="relative h-[460px] sm:h-[560px]">
            <GridNetwork />

            {/* HUD overlays */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-4 top-4 space-y-2">
                <Stat label="Meters online" value="24,718" tone="cyan" />
                <Stat label="Active anomalies" value="2" tone="magenta" />
                <Stat label="Relay events / hr" value="186" tone="violet" />
              </div>

              <div className="absolute right-4 top-4 rounded-lg border border-border-strong bg-bg-deep/70 px-3 py-2 backdrop-blur-md">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-dim">
                  AI scan
                </div>
                <div className="reading-mono mt-0.5 text-sm font-semibold text-electric-200">
                  Sweeping · 360° / 6s
                </div>
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-3 rounded-full border border-border-strong bg-bg-deep/70 px-4 py-1.5 text-[11px] backdrop-blur-md">
                  <Legend color="bg-electric-400" label="Healthy node" />
                  <Legend color="bg-danger" label="Anomaly" />
                  <Legend color="bg-neon-violet" label="Edge link" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
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
    <div className="rounded-lg border border-border-strong bg-bg-deep/70 px-3 py-2 backdrop-blur-md">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-dim">
        {label}
      </div>
      <div className={`reading-mono mt-0.5 text-base font-semibold ${toneMap[tone]}`}>{value}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-muted">
      <span className={`inline-block h-2 w-2 rounded-full ${color} shadow-glow-cyan`} />
      {label}
    </span>
  );
}
