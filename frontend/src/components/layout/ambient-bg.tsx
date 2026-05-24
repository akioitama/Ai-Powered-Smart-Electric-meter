"use client";

import { motion } from "framer-motion";

/**
 * Global ambient backdrop — a layered scene of:
 *  - perspective grid floor
 *  - drifting neon orbs
 *  - vertical light beams
 *  - subtle vignette
 *
 * Pure CSS / SVG / Framer Motion — no WebGL.
 */
export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Deep base */}
      <div className="absolute inset-0 bg-bg-deep" />

      {/* Soft radial highlights */}
      <div className="absolute inset-0 bg-radial-glow opacity-90" />
      <div className="absolute inset-0 bg-radial-violet opacity-90" />

      {/* Perspective grid floor */}
      <div className="absolute inset-x-0 bottom-0 h-[80vh] grid-floor opacity-70" />

      {/* Top conic glow */}
      <div className="absolute -top-72 left-1/2 -translate-x-1/2 h-[640px] w-[640px] rounded-full conic-glow opacity-60" />

      {/* Drifting orbs */}
      <motion.div
        aria-hidden
        className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-electric-400/20 blur-3xl"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 -right-32 h-[24rem] w-[24rem] rounded-full bg-neon-violet/20 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute top-1/3 right-1/4 h-[18rem] w-[18rem] rounded-full bg-neon-magenta/15 blur-3xl"
        animate={{ x: [0, 30, -10, 0], y: [0, -20, 10, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Vertical beams */}
      <div className="absolute inset-y-0 left-[18%] w-px beam opacity-60" />
      <div className="absolute inset-y-0 left-[42%] w-px beam opacity-30" />
      <div className="absolute inset-y-0 right-[22%] w-px beam opacity-50" />

      {/* Drifting particles */}
      <Particles count={26} />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, transparent 50%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}

function Particles({ count }: { count: number }) {
  const seeds = Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: (i * 137) % 100,
    y: (i * 79) % 100,
    size: 1 + ((i * 13) % 3),
    delay: (i * 0.43) % 6,
    duration: 8 + ((i * 1.3) % 8),
    color: i % 3 === 0 ? "rgba(0,240,255,0.6)" : i % 3 === 1 ? "rgba(139,92,246,0.55)" : "rgba(255,61,204,0.45)",
  }));
  return (
    <div className="absolute inset-0">
      {seeds.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 12px ${s.color}`,
          }}
          animate={{ y: [0, -40, 0], opacity: [0.2, 0.9, 0.2] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
