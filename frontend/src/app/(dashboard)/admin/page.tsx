"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CircuitBoard,
  ShieldAlert,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useDashboard } from "@/providers/dashboard-provider";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/charts/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Alert } from "@/lib/types";
import { relTime } from "@/lib/format";

export default function AdminOverview() {
  const { user, meters, token } = useDashboard();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [users, setUsers] = useState<Array<{ id: number; name: string; role: string; is_active: boolean }>>([]);

  useEffect(() => {
    if (user.role !== "admin") return;
    Promise.all([
      api.listAlerts(token, { limit: 200 }).catch(() => []),
      api.listUsers(token).catch(() => []),
    ]).then(([a, u]) => {
      setAlerts(a);
      setUsers(u);
    });
  }, [user.role, token]);

  const stats = useMemo(() => {
    const online = meters.filter((m) => m.online).length;
    const tripped = meters.filter((m) => !m.relay_state).length;
    const unack = alerts.filter((a) => !a.acknowledged_at).length;
    const theft = alerts.filter((a) => a.type === "theft").length;
    return { online, tripped, unack, theft };
  }, [meters, alerts]);

  if (user.role !== "admin") {
    return (
      <div className="glass p-12 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-warn" />
        <h2 className="mt-3 text-xl font-semibold">Admin only</h2>
        <p className="text-ink-muted text-sm">Ask your administrator for access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-electric-300">Administration</p>
        <h1 className="text-3xl font-bold">System Overview</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Meters Online"
          value={`${stats.online} / ${meters.length}`}
          icon={Wifi}
          tone="lime"
          pulse
        />
        <KpiCard
          label="Relays Tripped"
          value={String(stats.tripped)}
          icon={WifiOff}
          tone={stats.tripped ? "danger" : "success"}
        />
        <KpiCard
          label="Theft Alerts"
          value={String(stats.theft)}
          icon={AlertTriangle}
          tone={stats.theft ? "danger" : "success"}
        />
        <KpiCard
          label="Active Users"
          value={String(users.filter((u) => u.is_active).length)}
          icon={Users}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meter Health</CardTitle>
          <Badge variant="muted">{meters.length} total</Badge>
        </CardHeader>
        {meters.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-ink-muted">No meters yet — provision your first one to get started.</p>
            <Button asChild>
              <Link href="/admin/meters">
                <CircuitBoard className="h-4 w-4" />
                Provision a meter
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {meters.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-border bg-bg-elevated/40 p-4 hover:border-electric-400/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{m.name}</div>
                  <Badge variant={m.online ? "success" : "muted"}>
                    {m.online ? "Online" : "Offline"}
                  </Badge>
                </div>
                <div className="text-xs text-ink-muted space-y-1">
                  <div>{m.location ?? "—"}</div>
                  <div className="font-mono">{m.meter_uid}</div>
                  <div className="flex items-center gap-2 pt-1">
                    <Activity className="h-3 w-3 text-electric-400" />
                    Last seen {m.last_seen ? relTime(m.last_seen) : "never"}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <Badge variant={m.relay_state ? "success" : "danger"}>
                    Relay {m.relay_state ? "ON" : "OFF"}
                  </Badge>
                  <span className="text-[11px] text-ink-dim">
                    {m.low_v_threshold} – {m.high_v_threshold} V
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest Alerts (system-wide)</CardTitle>
          <Badge variant={stats.unack ? "danger" : "muted"}>{stats.unack} unread</Badge>
        </CardHeader>
        {alerts.length === 0 ? (
          <p className="text-sm text-ink-muted">No alerts yet.</p>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated/40 p-3">
                <div className="text-sm">
                  <Badge
                    variant={
                      a.severity === "critical"
                        ? "danger"
                        : a.severity === "warning"
                          ? "warn"
                          : "default"
                    }
                  >
                    {a.type.replace("_", " ")}
                  </Badge>
                  <span className="ml-2 text-ink">{a.message}</span>
                </div>
                <span className="text-[11px] text-ink-dim">{relTime(a.ts)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
