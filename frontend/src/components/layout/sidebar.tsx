"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CircuitBoard,
  FileText,
  LayoutDashboard,
  PowerOff,
  Settings,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const consumerNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/monitoring", label: "Smart Monitoring", icon: Activity },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/control", label: "Relay Control", icon: PowerOff },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Admin Overview", icon: ShieldCheck },
  { href: "/admin/meters", label: "Meters", icon: CircuitBoard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/theft", label: "Theft Hotspots", icon: AlertTriangle },
  { href: "/admin/audit", label: "Audit Log", icon: BarChart3 },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  return (
    <aside className="relative hidden w-64 shrink-0 flex-col border-r border-border bg-bg-deep/60 backdrop-blur-2xl lg:flex">
      {/* sidebar accent */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-electric-400/40 to-transparent" />

      <div className="border-b border-border px-5 py-5">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-success">
          <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-success" />
          Online
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <Section title="Consumer">
          {consumerNav.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </Section>

        {role === "admin" && (
          <Section title="Administration">
            {adminNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={pathname === item.href || pathname.startsWith(item.href + "/")}
              />
            ))}
          </Section>
        )}
      </nav>

      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-[11px] text-ink-dim">
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-electric-400" />
          v0.1.0
        </span>
        <span>© 2026 Smart Electric Meter</span>
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-dim">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
        active
          ? "border border-electric-400/30 bg-electric-400/10 text-electric-200 shadow-glow-cyan"
          : "border border-transparent text-ink-muted hover:bg-bg-card/50 hover:text-ink",
      )}
    >
      {active && (
        <span className="absolute -left-3 top-1/2 h-6 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-electric-400 to-transparent" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 transition-transform group-hover:scale-110",
          active && "text-electric-300 drop-shadow-[0_0_8px_rgba(0,229,255,0.7)]",
        )}
      />
      <span className="flex-1">{item.label}</span>
      {active && <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-electric-400" />}
    </Link>
  );
}
