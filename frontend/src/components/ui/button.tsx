"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-400/60 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-electric-400 to-electric-300 text-bg shadow-glow hover:shadow-glow-strong hover:brightness-110 active:scale-[0.98]",
        secondary:
          "bg-bg-elevated text-ink border border-border hover:border-strong hover:bg-bg-elevated/80",
        ghost: "text-ink hover:bg-white/5",
        danger:
          "bg-danger text-white shadow-glow-danger hover:brightness-110 active:scale-[0.98]",
        success:
          "bg-lime-500 text-bg shadow-glow-lime hover:brightness-110 active:scale-[0.98]",
        outline:
          "border border-electric-400/40 text-electric-300 hover:bg-electric-400/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
