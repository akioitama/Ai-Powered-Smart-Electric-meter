"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, MapPin } from "lucide-react";
import { useDashboard } from "@/providers/dashboard-provider";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Alert } from "@/lib/types";
import { relTime } from "@/lib/format";

export default function TheftHotspotsPage() {
  const { token, user, meters } = useDashboard();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (user.role !== "admin") return;
    api.listAlerts(token, { limit: 500 }).then(setAlerts).catch(() => {});
  }, [user.role, token]);

  const hotspots = useMemo(() => {
    const counts = new Map<number, number>();
    for (const a of alerts) {
      if (a.type === "theft") counts.set(a.meter_id, (counts.get(a.meter_id) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([meter_id, count]) => ({
        meter_id,
        count,
        meter: meters.find((m) => m.id === meter_id),
      }))
      .sort((a, b) => b.count - a.count);
  }, [alerts, meters]);

  if (user.role !== "admin") return <p className="text-ink-muted">Admin only.</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-electric-300">Administration</p>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-7 w-7 text-warn" />
          Theft Hotspots
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Meters with the highest count of AI-flagged theft alerts.
        </p>
      </div>

      {hotspots.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted text-center py-8">No theft alerts yet — good news.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {hotspots.map(({ meter_id, count, meter }) => (
            <Card key={meter_id}>
              <CardHeader>
                <div>
                  <CardTitle>{meter?.name ?? `Meter #${meter_id}`}</CardTitle>
                  <div className="flex items-center gap-1 text-xs text-ink-dim mt-1">
                    <MapPin className="h-3 w-3" />
                    {meter?.location ?? "—"}
                  </div>
                </div>
                <Badge variant="danger">
                  <AlertTriangle className="h-3 w-3" />
                  {count}
                </Badge>
              </CardHeader>
              <div className="text-sm">
                <div className="flex justify-between text-ink-muted">
                  <span>Last theft alert</span>
                  <span>
                    {relTime(
                      alerts
                        .filter((a) => a.meter_id === meter_id && a.type === "theft")
                        .sort((a, b) => +new Date(b.ts) - +new Date(a.ts))[0]?.ts,
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-ink-muted mt-1">
                  <span>Status</span>
                  <span>{meter?.online ? "Online" : "Offline"}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
