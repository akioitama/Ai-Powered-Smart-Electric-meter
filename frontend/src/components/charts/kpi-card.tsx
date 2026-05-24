"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warn" | "danger" | "lime" | "violet" | "magenta";
  pulse?: boolean;
}

const toneClass: Record<NonNullable<KpiCardProps["tone"]>, { text: string; ring: string; glow: string }> = {
  default: {
    text: "text-electric-200",
    ring: "from-electric-400/40 via-electric-400/0 to-electric-400/0",
    glow: "shadow-glow-cyan",
  },
  success: {
    text: "text-success",
    ring: "from-success/40 via-success/0 to-success/0",
    glow: "shadow-glow-lime",
  },
  warn: {
    text: "text-warn",
    ring: "from-warn/40 via-warn/0 to-warn/0",
    glow: "shadow-glow",
  },
  danger: {
    text: "text-danger",
    ring: "from-danger/40 via-danger/0 to-danger/0",
    glow: "shadow-glow-danger",
  },
  lime: {
    text: "text-lime-400",
    ring: "from-lime-400/40 via-lime-400/0 to-lime-400/0",
    glow: "shadow-glow-lime",
  },
  violet: {
    text: "text-neon-violet",
    ring: "from-neon-violet/40 via-neon-violet/0 to-neon-violet/0",
    glow: "shadow-glow-violet",
  },
  magenta: {
    text: "text-neon-magenta",
    ring: "from-neon-magenta/40 via-neon-magenta/0 to-neon-magenta/0",
    glow: "shadow-glow-magenta",
  },
};

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  pulse,
}: KpiCardProps) {
  const t = toneClass[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-bg-card/40 p-5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover"
    >
      {/* corner glow */}
      <div
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-radial blur-3xl",
          `bg-gradient-to-br ${t.ring}`,
        )}
      />
      {/* top divider beam */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-400/30 to-transparent" />

      <div className="relative flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
          {label}
        </p>
        {Icon && (
          <span
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg border border-border-strong bg-bg-deep/70 backdrop-blur",
              t.text,
              pulse && t.glow,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className={cn("reading-mono mt-3 text-3xl font-bold leading-tight", t.text)}>
        {value}
      </div>
      {hint && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
    </motion.div>
  );
}
