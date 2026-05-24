"use client";

import { motion } from "framer-motion";
import { Brain, Cpu, Network, Radar } from "lucide-react";

const STAGES = [
  {
    icon: Network,
    title: "Telemetry Mesh",
    desc: "MQTT + REST ingest at line speed. Every voltage tick, every relay click — captured.",
  },
  {
    icon: Cpu,
    title: "Feature Engineering",
    desc: "Rolling baselines, harmonic profiles, time-of-day signatures, neighborhood deltas.",
  },
  {
    icon: Brain,
    title: "Isolation Forest",
    desc: "Unsupervised anomaly scoring trained on 30-day rolling windows per meter.",
  },
  {
    icon: Radar,
    title: "Auto-Response",
    desc: "Threshold breaches trigger instant relay cut-off + technician dispatch.",
  },
];

export function DetectionEngine() {
  return (
    <section id="engine" className="relative py-24 sm:py-32">
      <div className="container-tight">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            <span className="eyebrow">Detection Engine</span>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Catch theft <span className="holo-text">before it happens.</span>
            </h2>
            <p className="mt-5 text-balance text-ink-muted">
              Our anomaly engine learns the heartbeat of every meter — then flags the impossible.
              Bypass attempts, current shorts, magnetic tampering and load drift — visible in seconds.
            </p>

            <ul className="mt-8 space-y-4">
              {STAGES.map((s, i) => (
                <motion.li
                  key={s.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="flex gap-4"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-electric-400/30 bg-electric-400/10 text-electric-300 shadow-glow-cyan">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-ink">{s.title}</div>
                    <div className="text-sm text-ink-muted">{s.desc}</div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7"
          >
            <NeuralVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/** SVG neural-net visualization with animated pulses along edges. */
function NeuralVisual() {
  const layers = [3, 6, 6, 4];
  const w = 720;
  const h = 480;
  const cols = layers.length;
  const xStep = w / (cols + 1);

  const positions = layers.map((count, ci) =>
    Array.from({ length: count }, (_, ri) => {
      const yStep = h / (count + 1);
      return { x: xStep * (ci + 1), y: yStep * (ri + 1) };
    }),
  );

  // edges
  const edges: Array<{ x1: number; y1: number; x2: number; y2: number; delay: number; weight: number }> = [];
  for (let li = 0; li < positions.length - 1; li++) {
    positions[li].forEach((a, ai) => {
      positions[li + 1].forEach((b, bi) => {
        edges.push({
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          delay: ((ai + bi) * 0.18) % 4,
          weight: 0.3 + ((ai + bi) % 3) * 0.18,
        });
      });
    });
  }

  return (
    <div className="holo-card relative overflow-hidden p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-dim">
            Inference graph · per-meter
          </div>
          <div className="mt-1 font-display text-xl font-semibold">Isolation Forest · 150 trees</div>
        </div>
        <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-success">
          Inference 24ms
        </span>
      </div>

      <div className="relative mt-6">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-[420px] w-full">
          <defs>
            <linearGradient id="edgeGrad" x1="0" x2="1">
              <stop offset="0" stopColor="#00F0FF" stopOpacity="0.4" />
              <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.2" />
            </linearGradient>
            <radialGradient id="nodeGrad">
              <stop offset="0" stopColor="#00F0FF" stopOpacity="1" />
              <stop offset="1" stopColor="#00F0FF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Edges */}
          {edges.map((e, i) => (
            <g key={i}>
              <line
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke="url(#edgeGrad)"
                strokeWidth={e.weight}
                opacity="0.6"
              />
              {/* Pulsing dot along the edge */}
              <circle r="2.5" fill="#00F0FF" opacity="0.9">
                <animateMotion
                  dur="2.4s"
                  begin={`${e.delay}s`}
                  repeatCount="indefinite"
                  path={`M ${e.x1} ${e.y1} L ${e.x2} ${e.y2}`}
                />
                <animate
                  attributeName="opacity"
                  values="0;1;0"
                  dur="2.4s"
                  begin={`${e.delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}

          {/* Nodes */}
          {positions.map((layer, li) =>
            layer.map((p, ni) => (
              <g key={`${li}-${ni}`}>
                <circle cx={p.x} cy={p.y} r="22" fill="url(#nodeGrad)" opacity="0.45" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="9"
                  fill="#0A0F22"
                  stroke="#00F0FF"
                  strokeWidth="1.5"
                />
                <circle cx={p.x} cy={p.y} r="3" fill="#00F0FF">
                  <animate
                    attributeName="r"
                    values="2.4;3.6;2.4"
                    dur="2.4s"
                    begin={`${(li + ni) * 0.15}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )),
          )}

          {/* Layer labels */}
          {["Telemetry", "Encoder", "Iso-Forest", "Output"].map((label, i) => (
            <text
              key={label}
              x={xStep * (i + 1)}
              y={h - 10}
              textAnchor="middle"
              fontSize="11"
              fill="#5C6790"
              fontFamily="JetBrains Mono"
            >
              {label.toUpperCase()}
            </text>
          ))}
        </svg>

        {/* output label */}
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 space-y-2">
          <ScoreChip color="cyan" label="Normal" pct={92} />
          <ScoreChip color="violet" label="Drift" pct={6} />
          <ScoreChip color="magenta" label="Theft" pct={2} />
        </div>
      </div>
    </div>
  );
}

function ScoreChip({
  color,
  label,
  pct,
}: {
  color: "cyan" | "violet" | "magenta";
  label: string;
  pct: number;
}) {
  const tone = {
    cyan: "border-electric-400/40 text-electric-200 bg-electric-400/10",
    violet: "border-neon-violet/40 text-neon-violet bg-neon-violet/10",
    magenta: "border-neon-magenta/40 text-neon-magenta bg-neon-magenta/10",
  } as const;
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border bg-bg-deep/60 px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur ${tone[color]}`}
    >
      <span>{label}</span>
      <span className="reading-mono">{pct}%</span>
    </div>
  );
}
