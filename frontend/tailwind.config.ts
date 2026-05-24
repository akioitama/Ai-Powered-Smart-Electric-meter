import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        bg: {
          DEFAULT: "#04060E",
          deep: "#02030A",
          card: "#0A0F22",
          elevated: "#0F1730",
          panel: "rgba(10, 15, 34, 0.55)",
        },
        ink: {
          DEFAULT: "#EDF1FF",
          muted: "#8893B6",
          dim: "#5C6790",
          faint: "#3C4566",
        },
        border: {
          DEFAULT: "rgba(120, 200, 255, 0.10)",
          strong: "rgba(120, 200, 255, 0.22)",
          neon: "rgba(0, 229, 255, 0.45)",
        },
        electric: {
          50: "#E6FBFF",
          100: "#B8F3FF",
          200: "#7CE9FF",
          300: "#33DEFF",
          400: "#00E5FF",
          500: "#00B8D4",
          600: "#0098B0",
          700: "#00748A",
          800: "#005266",
          900: "#003544",
        },
        neon: {
          cyan: "#00F0FF",
          blue: "#3D8BFF",
          violet: "#8B5CF6",
          purple: "#B14CFF",
          magenta: "#FF3DCC",
        },
        lime: {
          400: "#C7FF49",
          500: "#A6FF00",
          600: "#82CC00",
        },
        warn: "#FFB020",
        danger: "#FF4D6A",
        success: "#22D38C",
      },
      boxShadow: {
        glow: "0 0 24px rgba(0, 229, 255, 0.25)",
        "glow-strong": "0 0 48px rgba(0, 229, 255, 0.55)",
        "glow-cyan": "0 0 32px rgba(0, 240, 255, 0.45)",
        "glow-violet": "0 0 32px rgba(139, 92, 246, 0.45)",
        "glow-magenta": "0 0 32px rgba(255, 61, 204, 0.4)",
        "glow-lime": "0 0 24px rgba(166, 255, 0, 0.25)",
        "glow-danger": "0 0 24px rgba(255, 77, 106, 0.4)",
        card: "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        "card-hover":
          "0 16px 48px rgba(0, 200, 255, 0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "circuit-grid":
          "linear-gradient(rgba(120,200,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(120,200,255,0.06) 1px, transparent 1px)",
        "circuit-grid-fine":
          "linear-gradient(rgba(120,200,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(120,200,255,0.04) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(60% 60% at 50% 0%, rgba(0,229,255,0.18) 0%, transparent 60%)",
        "radial-violet":
          "radial-gradient(60% 60% at 50% 100%, rgba(139,92,246,0.20) 0%, transparent 65%)",
        "holo-gradient":
          "linear-gradient(135deg, #00F0FF 0%, #3D8BFF 35%, #8B5CF6 65%, #FF3DCC 100%)",
        "holo-soft":
          "linear-gradient(135deg, rgba(0,240,255,0.18), rgba(139,92,246,0.18) 60%, rgba(255,61,204,0.18))",
        "scan-line":
          "linear-gradient(180deg, transparent 0%, rgba(0,240,255,0.4) 50%, transparent 100%)",
      },
      backgroundSize: {
        grid: "32px 32px",
        "grid-lg": "64px 64px",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0,229,255,0.6)" },
          "50%": { boxShadow: "0 0 0 12px rgba(0,229,255,0)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        wave: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        sparkle: {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "50%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(1.2)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.6)", opacity: "0.8" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "border-flow": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "particle-drift": {
          "0%": { transform: "translate(0, 0)" },
          "100%": { transform: "translate(40px, -60px)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2.4s ease-out infinite",
        flicker: "flicker 3s ease-in-out infinite",
        wave: "wave 18s linear infinite",
        sparkle: "sparkle 1.6s ease-in-out infinite",
        scan: "scan 4s linear infinite",
        radar: "radar 6s linear infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.6s cubic-bezier(0.215, 0.610, 0.355, 1.000) infinite",
        shimmer: "shimmer 8s linear infinite",
        "border-flow": "border-flow 6s ease-in-out infinite",
        "fade-up": "fade-up 0.7s ease-out both",
        marquee: "marquee 40s linear infinite",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [animate],
};

export default config;
