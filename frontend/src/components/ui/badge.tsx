import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
  {
    variants: {
      variant: {
        default: "bg-electric-400/10 text-electric-300 border-electric-400/30",
        success: "bg-lime-500/10 text-lime-400 border-lime-500/30",
        warn: "bg-warn/10 text-warn border-warn/30",
        danger: "bg-danger/15 text-danger border-danger/30",
        muted: "bg-white/5 text-ink-muted border-border",
        live: "bg-electric-400/15 text-electric-300 border-electric-400/40 shadow-glow",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
