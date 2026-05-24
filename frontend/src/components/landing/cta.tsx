"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="container-tight">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="holo-frame relative overflow-hidden p-10 text-center sm:p-16"
        >
          {/* radial backdrop */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric-400/10 blur-3xl" />
            <div className="grid-bg-lg absolute inset-0 opacity-30" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-400/70 to-transparent" />
          </div>

          <span className="eyebrow">Deploy in days, not quarters</span>
          <h2 className="relative mt-6 font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            Wire up the grid.
            <br />
            <span className="holo-text">Outsmart every threat.</span>
          </h2>
          <p className="relative mx-auto mt-5 max-w-2xl text-balance text-ink-muted">
            Onboard your first meter in under five minutes. Zero-config MQTT, plug-and-play HTTP fallback,
            and a dashboard your operators will actually love opening.
          </p>

          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-holo-gradient bg-[length:200%_200%] px-5 py-3 text-sm font-semibold text-bg-deep shadow-glow-cyan animate-[border-flow_6s_ease-in-out_infinite] hover:shadow-glow-strong"
            >
              Create your command center
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-bg-card/40 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-bg-card/70"
            >
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
