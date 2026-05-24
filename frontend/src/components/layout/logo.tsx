import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative">
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden>
          <defs>
            <linearGradient id="boltGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="55%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#FF3DCC" />
            </linearGradient>
          </defs>
          <path
            d="M18 3 L8 18 H15 L13 29 L24 13 H17 L19 3 Z"
            fill="url(#boltGrad)"
            stroke="rgba(0,229,255,0.5)"
            strokeWidth="0.6"
          />
        </svg>
        <span className="absolute inset-0 -z-10 rounded-full bg-electric-400/30 blur-md" />
      </div>
      <span className="font-display leading-tight tracking-tight">
        <span className="holo-text font-semibold">AI Powered</span>
        <span className="text-ink/95"> Smart Meter</span>
      </span>
    </div>
  );
}
