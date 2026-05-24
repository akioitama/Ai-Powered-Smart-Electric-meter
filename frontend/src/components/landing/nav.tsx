"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/layout/logo";

const NAV_ITEMS = [
  { href: "#features", label: "Features" },
  { href: "#engine", label: "Detection Engine" },
  { href: "#grid", label: "Smart Grid" },
  { href: "#analytics", label: "Analytics" },
  { href: "#partners", label: "Partners" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div className="container-tight">
        <div
          className={`flex items-center justify-between rounded-2xl border px-4 transition-all duration-300 ${
            scrolled
              ? "border-border-strong bg-bg-deep/70 py-2 backdrop-blur-xl shadow-card"
              : "border-transparent py-2"
          }`}
        >
          <Link href="/" className="flex items-center gap-3">
            <Logo className="text-base" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-bg-card/40 hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:text-ink sm:inline"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="group relative inline-flex items-center gap-1.5 rounded-lg border border-electric-400/40 bg-electric-400/10 px-4 py-2 text-sm font-semibold text-electric-200 transition-all hover:border-electric-400/70 hover:bg-electric-400/20 hover:text-electric-100 hover:shadow-glow-cyan"
            >
              Launch Console
              <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10m0 0L7.5 2.5M12 7l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
