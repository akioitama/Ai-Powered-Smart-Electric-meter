import { Logo } from "@/components/layout/logo";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      {/* Left visual panel */}
      <div className="relative hidden flex-1 overflow-hidden border-r border-border lg:flex">
        {/* layered glow */}
        <div className="grid-floor absolute inset-0 opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-br from-electric-400/15 via-neon-violet/10 to-neon-magenta/10" />
        <div className="absolute -left-32 -top-32 h-[40rem] w-[40rem] rounded-full bg-electric-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[30rem] w-[30rem] rounded-full bg-neon-violet/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 conic-glow opacity-40" />

        {/* sweeping scan line */}
        <div className="absolute inset-x-0 top-1/3 h-32 animate-scan bg-scan-line opacity-40" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12">
          <Link href="/">
            <Logo className="text-xl" />
          </Link>

          <div className="max-w-md space-y-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-electric-200">
              AI Powered Smart Electric Meter
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">
              Detect theft. <br />
              Tame voltage. <br />
              <span className="holo-text">See every watt.</span>
            </h1>
            <p className="text-balance text-ink-muted">
              Real-time analytics, AI-driven anomaly detection and instant relay control —
              all in a single cinematic command center.
            </p>
            <ul className="space-y-2.5 text-sm text-ink-muted">
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-electric-400 shadow-glow-cyan" />
                Isolation-Forest theft detection
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-neon-violet shadow-glow-violet" />
                Auto relay cut-off on voltage anomaly
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-neon-magenta shadow-glow-magenta" />
                Live monitoring &amp; CSV reports
              </li>
            </ul>
          </div>

          <div className="text-xs text-ink-dim">
            University of Central Punjab · F25CS091
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex flex-1 items-center justify-center p-6">
        <div className="absolute right-6 top-6 lg:hidden">
          <Link href="/">
            <Logo className="text-base" />
          </Link>
        </div>
        <div className="relative w-full max-w-md">
          <div className="glass relative p-7 sm:p-9">{children}</div>
        </div>
      </div>
    </div>
  );
}
