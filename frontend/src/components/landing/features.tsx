"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Shield,
  Zap,
  Globe2,
  AlertTriangle,
  Brain,
  Lock,
  LineChart,
} from "lucide-react";

const FEATURES = [
  {
    icon: AlertTriangle,
    title: "Theft Detection",
    desc: "Catch bypass, shorting and tampering in seconds with unsupervised anomaly scoring.",
    accent: "from-electric-400/30 to-electric-400/0",
  },
  {
    icon: Zap,
    title: "Voltage Guardrails",
    desc: "Auto cut-off on under/over-voltage events to protect appliances and infrastructure.",
    accent: "from-neon-violet/30 to-neon-violet/0",
  },
  {
    icon: Brain,
    title: "Self-Tuning AI",
    desc: "Per-meter Isolation Forest models continuously learn each consumer's signature.",
    accent: "from-neon-magenta/30 to-neon-magenta/0",
  },
  {
    icon: LineChart,
    title: "Energy Analytics",
    desc: "Drill into voltage, current, power factor and harmonics — second-by-second.",
    accent: "from-electric-400/30 to-electric-400/0",
  },
  {
    icon: Shield,
    title: "Tamper-Proof Telemetry",
    desc: "Mutual-TLS, signed payloads and rolling tokens between meter and cloud.",
    accent: "from-neon-violet/30 to-neon-violet/0",
  },
  {
    icon: Activity,
    title: "Sub-Second Relay",
    desc: "Remote ON/OFF and config push under 800ms — even at city scale.",
    accent: "from-neon-magenta/30 to-neon-magenta/0",
  },
  {
    icon: Globe2,
    title: "Smart-City Ready",
    desc: "Plug into existing SCADA, SAP IS-U and bespoke utility back-offices via REST/MQTT.",
    accent: "from-electric-400/30 to-electric-400/0",
  },
  {
    icon: Lock,
    title: "Compliance Vault",
    desc: "Immutable audit log of every relay event, alert ack and config change.",
    accent: "from-neon-violet/30 to-neon-violet/0",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="container-tight">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="eyebrow">Capabilities</span>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Eight pillars of <span className="holo-text">grid intelligence.</span>
          </h2>
          <p className="mt-4 text-balance text-ink-muted">
            From the silicon on the meter to the dashboard in the control room — every layer is engineered for the next decade of energy.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <FeatureCard {...f} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  accent,
}: (typeof FEATURES)[number]) {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-bg-card/40 p-5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-border-strong hover:shadow-card-hover">
      {/* hover gradient wash */}
      <div
        className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${accent}`}
      />
      {/* corner sparkle */}
      <span className="pointer-events-none absolute right-3 top-3 h-2 w-2 rounded-full bg-electric-400/60 opacity-0 shadow-glow-cyan transition-opacity group-hover:opacity-100" />

      <div className="relative">
        <div className="grid h-11 w-11 place-items-center rounded-xl border border-border-strong bg-bg-deep/70 text-electric-300 transition-all group-hover:border-electric-400/60 group-hover:text-electric-200 group-hover:shadow-glow-cyan">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{desc}</p>
      </div>
    </div>
  );
}
