"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

const STATS = [
  { value: 99.97, suffix: "%", label: "Telemetry uptime", precision: 2 },
  { value: 24, suffix: "ms", label: "Avg AI inference", precision: 0 },
  { value: 800, suffix: "ms", label: "Relay round-trip", precision: 0 },
  { value: 18.4, suffix: "%", label: "Theft losses recovered", precision: 1 },
];

export function Stats() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="container-tight">
        <div className="holo-card relative overflow-hidden p-8 sm:p-12">
          <div className="grid-bg-lg pointer-events-none absolute inset-0 opacity-30" />
          <div className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-electric-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-neon-violet/15 blur-3xl" />

          <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              >
                <Counter value={s.value} suffix={s.suffix} precision={s.precision} />
                <div className="mt-2 text-sm text-ink-muted">{s.label}</div>
                <div className="divider-line mt-4 w-12" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Counter({
  value,
  suffix,
  precision,
}: {
  value: number;
  suffix: string;
  precision: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => v.toFixed(precision));

  useEffect(() => {
    if (inView) {
      const controls = animate(mv, value, { duration: 1.6, ease: "easeOut" });
      return () => controls.stop();
    }
  }, [inView, mv, value]);

  return (
    <div className="flex items-baseline gap-1 num-display text-4xl font-bold text-ink sm:text-5xl">
      <motion.span ref={ref}>{display}</motion.span>
      <span className="holo-text text-2xl font-bold sm:text-3xl">{suffix}</span>
    </div>
  );
}
