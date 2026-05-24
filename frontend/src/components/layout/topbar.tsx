"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Bell, ChevronDown, LogOut, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/layout/logo";
import type { Meter, SessionUser } from "@/lib/types";
import { cn } from "@/lib/cn";

interface TopbarProps {
  user: SessionUser;
  meters: Meter[];
  selectedMeterId: number | null;
  onSelectMeter: (id: number) => void;
  liveLabel?: string;
  unreadAlerts?: number;
  connected?: boolean;
}

export function Topbar({
  user,
  meters,
  selectedMeterId,
  onSelectMeter,
  liveLabel,
  unreadAlerts = 0,
  connected = false,
}: TopbarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onClick = () => setMenuOpen(false);
    if (menuOpen) {
      window.addEventListener("click", onClick);
      return () => window.removeEventListener("click", onClick);
    }
  }, [menuOpen]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  const selected = meters.find((m) => m.id === selectedMeterId);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg-deep/70 px-4 py-3 backdrop-blur-2xl lg:px-6">
      {/* tiny scan line up top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-400/60 to-transparent" />

      <div className="flex items-center gap-3">
        <div className="lg:hidden">
          <Logo />
        </div>

        {/* Meter selector */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            className="flex items-center gap-2 rounded-xl border border-border-strong bg-bg-card/50 px-3 py-2 text-sm transition-colors hover:border-electric-400/40 hover:bg-bg-card/70"
          >
            <Zap className="h-4 w-4 text-electric-400" />
            <span className="max-w-[180px] truncate">
              {selected?.name ?? (meters.length ? "Select a meter" : "No meters")}
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>
          {open && meters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-0 top-full z-40 mt-2 w-72 rounded-xl border border-border-strong bg-bg-card/95 p-1 shadow-card backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {meters.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelectMeter(m.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-electric-400/10",
                    m.id === selectedMeterId && "bg-electric-400/10",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{m.name}</span>
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        m.online
                          ? "animate-pulseGlow bg-success shadow-glow-lime"
                          : "bg-ink-dim",
                      )}
                    />
                  </div>
                  <div className="text-[11px] text-ink-dim">
                    {m.location ?? "—"} · {m.meter_uid}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Live status pill */}
        <div className="ml-2 hidden md:flex">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
              connected
                ? "border-electric-400/40 bg-electric-400/10 text-electric-200 shadow-glow-cyan"
                : "border-border text-ink-dim",
            )}
          >
            <Activity className="h-3 w-3" />
            {connected ? liveLabel ?? "Live" : "Offline"}
          </span>
        </div>

        <div className="flex-1" />

        <Link
          href="/alerts"
          className="relative rounded-xl border border-transparent p-2 transition-colors hover:border-border-strong hover:bg-bg-card/50"
        >
          <Bell className="h-5 w-5 text-ink-muted" />
          {unreadAlerts > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow-glow-danger">
              {unreadAlerts > 9 ? "9+" : unreadAlerts}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="flex items-center gap-2 rounded-xl border border-border-strong bg-bg-card/50 px-3 py-1.5 transition-colors hover:border-electric-400/40 hover:bg-bg-card/70"
          >
            <div className="grid h-7 w-7 place-items-center rounded-full bg-holo-gradient bg-[length:200%_200%] text-xs font-bold text-bg-deep">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="hidden text-left leading-tight sm:block">
              <div className="text-xs font-medium">{user.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-dim">{user.role}</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-border-strong bg-bg-card/95 p-1 shadow-card backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-ink-dim">{user.email}</div>
              </div>
              <div className="my-1 border-t border-border" />
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-bg-card/70"
              >
                Settings
              </Link>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}
