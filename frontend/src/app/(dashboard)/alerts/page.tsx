"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Filter } from "lucide-react";
import { useDashboard } from "@/providers/dashboard-provider";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertRow } from "@/components/meter/alert-row";
import type { Alert } from "@/lib/types";

type Filter = "all" | "unack" | "critical" | "theft";

export default function AlertsPage() {
  const { token, meters, user, setUnreadAlerts, unreadAlerts } = useDashboard();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<Filter>("unack");

  const meterMap = useMemo(() => Object.fromEntries(meters.map((m) => [m.id, m.name])), [meters]);

  const reload = useCallback(async () => {
    const data = await api.listAlerts(token, { limit: 200 });
    setAlerts(data);
  }, [token]);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = alerts.filter((a) => {
    if (filter === "unack") return !a.acknowledged_at;
    if (filter === "critical") return a.severity === "critical";
    if (filter === "theft") return a.type === "theft";
    return true;
  });

  async function ack(id: number) {
    await api.ackAlert(id, token);
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, acknowledged_at: new Date().toISOString(), acknowledged_by: user.id } : a,
      ),
    );
    setUnreadAlerts(Math.max(0, unreadAlerts - 1));
  }

  async function ackAll() {
    const unacked = alerts.filter((a) => !a.acknowledged_at);
    await Promise.all(unacked.map((a) => api.ackAlert(a.id, token)));
    await reload();
    setUnreadAlerts(0);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-electric-300">UC-5</p>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-7 w-7 text-electric-400" />
            Alerts &amp; Notifications
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList>
              <TabsTrigger value="unack">Unread</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="critical">Critical</TabsTrigger>
              <TabsTrigger value="theft">Theft</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="secondary" size="sm" onClick={ackAll}>
            <CheckCheck className="h-4 w-4" /> Acknowledge all
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{filtered.length} alerts</CardTitle>
          <Badge variant="muted">
            <Filter className="h-3 w-3" />
            {filter}
          </Badge>
        </CardHeader>
        {filtered.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-12">
            Nothing to see here — your meters are healthy.
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((a) => (
              <AlertRow
                key={a.id}
                alert={a}
                onAck={ack}
                meterName={meterMap[a.meter_id]}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
