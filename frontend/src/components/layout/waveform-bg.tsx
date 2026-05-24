"use client";

import { motion } from "framer-motion";

/**
 * Layered animated AC sine-wave background — sits behind page content.
 * Pure SVG + Framer Motion, GPU-friendly.
 */
export function WaveformBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-[0.35] mask-fade-y" />
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-[42vh] opacity-50"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="acGrad1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="acGrad2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#A6FF00" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#A6FF00" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0,160 C240,100 480,220 720,160 C960,100 1200,220 1440,160 L1440,320 L0,320 Z"
          fill="url(#acGrad1)"
          initial={{ x: 0 }}
          animate={{ x: [-60, 60, -60] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M0,200 C240,140 480,260 720,200 C960,140 1200,260 1440,200 L1440,320 L0,320 Z"
          fill="url(#acGrad2)"
          initial={{ x: 0 }}
          animate={{ x: [40, -40, 40] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] rounded-full bg-electric-400/15 blur-3xl" />
    </div>
  );
}

export function CircuitGrid() {
  return (
    <div className="absolute inset-0 -z-10 grid-bg opacity-40" aria-hidden />
  );
}
