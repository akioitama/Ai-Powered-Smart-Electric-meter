"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Battery,
  Gauge,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useDashboard } from "@/providers/dashboard-provider";
import { useMeterSocket } from "@/lib/ws";
import { api } from "@/lib/api";
import { KpiCard } from "@/components/charts/kpi-card";
import { LiveLineChart, type LivePoint } from "@/components/charts/live-line-chart";
import { VoltageGauge } from "@/components/charts/voltage-gauge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertRow } from "@/components/meter/alert-row";
import { NoMeterState } from "@/components/meter/empty-state";
import { formatA, formatKWh, formatV, formatW } from "@/lib/format";
import type { Alert as AlertModel, Reading, ReadingsSummary, WSMessage } from "@/lib/types";

const MAX_POINTS = 120;

export default function DashboardPage() {
  const { selectedMeter, selectedMeterId, token, user, setUnreadAlerts, unreadAlerts } =
    useDashboard();
  const meterId = selectedMeterId;

  const [history, setHistory] = useState<LivePoint[]>([]);
  const [latest, setLatest] = useState<Reading | null>(null);
  const [summary, setSummary] = useState<ReadingsSummary | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<AlertModel[]>([]);
  const { connected, last } = useMeterSocket(meterId, token);

  // Hydrate from REST
  useEffect(() => {
    if (!meterId) return;
    let alive = true;
    (async () => {
      try {
        const [readings, sum, alerts] = await Promise.all([
          api.listReadings(meterId, token, 6, 200),
          api.summary(meterId, token),
          api.listAlerts(token, { meterId, limit: 5 }),
        ]);
        if (!alive) return;
        const points = readings.map<LivePoint>((r) => ({
          ts: new Date(r.ts).getTime(),
          power: r.power,
          voltage: r.voltage,
          current: r.current,
        }));
        setHistory(points);
        setLatest(readings[readings.length - 1] ?? null);
        setSummary(sum);
        setRecentAlerts(alerts);
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [meterId, token]);

  // Live updates
  useEffect(() => {
    if (!last) return;
    const msg = last as WSMessage;
    if (msg.type === "reading") {
      const data = msg.data as Record<string, number | string | null>;
      const ts = typeof data.ts === "string" ? new Date(data.ts).getTime() : Date.now();
      const point: LivePoint = {
        ts,
        power: Number(data.power ?? 0),
        voltage: Number(data.voltage ?? 0),
        current: Number(data.current ?? 0),
      };
      setHistory((prev) => [...prev.slice(-MAX_POINTS + 1), point]);
      setLatest({
        id: Number(data.id ?? 0),
        meter_id: Number(data.meter_id ?? meterId ?? 0),
        ts: typeof data.ts === "string" ? data.ts : new Date().toISOString(),
        voltage: point.voltage,
        current: point.current,
        power: point.power,
        energy_kwh: Number(data.energy_kwh ?? 0),
        frequency: data.frequency != null ? Number(data.frequency) : null,
        power_factor: data.power_factor != null ? Number(data.power_factor) : null,
        anomaly_score: data.anomaly_score != null ? Number(data.anomaly_score) : null,
        is_anomaly: Number(data.is_anomaly ?? 0),
      });
    } else if (msg.type === "alert") {
      const a = msg.data as unknown as AlertModel;
      setRecentAlerts((prev) => [a, ...prev].slice(0, 5));
    }
  }, [last, meterId]);

  const ackAlert = useCallback(
    async (id: number) => {
      try {
        await api.ackAlert(id, token);
        setRecentAlerts((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, acknowledged_at: new Date().toISOString(), acknowledged_by: user.id } : a,
          ),
        );
        setUnreadAlerts(Math.max(0, unreadAlerts - 1));
      } catch {
        // ignore
      }
    },
    [token, user.id, setUnreadAlerts, unreadAlerts],
  );

  const isAnomaly = latest?.is_anomaly === 1;
  const meter = selectedMeter;
  const safeBand = meter ? `${meter.low_v_threshold}–${meter.high_v_threshold} V` : "—";

  const headline = useMemo(() => {
    if (!meter) return null;
    if (!meter.online) return { label: "Offline", tone: "danger" as const };
    if (isAnomaly) return { label: "AI Anomaly", tone: "warn" as const };
    if (!meter.relay_state) return { label: "Relay Open", tone: "warn" as const };
    return { label: "Healthy", tone: "success" as const };
  }, [meter, isAnomaly]);

  if (!meter || !meterId) return <NoMeterState isAdmin={user.role === "admin"} />;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-electric-300">Live overview</p>
          <h1 className="text-3xl font-bold">
            {meter.name}
            <span className="text-ink-muted text-base font-normal ml-2">{meter.location ?? ""}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={connected ? "live" : "muted"}>
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-electric-400 animate-pulseGlow" : "bg-ink-dim"}`} />
            {connected ? "Realtime" : "Reconnecting"}
          </Badge>
          {headline && (
            <Badge
              variant={
                headline.tone === "success" ? "success" : headline.tone === "warn" ? "warn" : "danger"
              }
            >
              {headline.label}
            </Badge>
          )}
          <Badge variant="muted">{meter.meter_uid}</Badge>
        </div>
      </motion.div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Live Power"
          value={formatW(latest?.power)}
          icon={Activity}
          pulse={connected}
          tone="default"
          hint={connected ? "Streaming" : "Awaiting data"}
        />
        <KpiCard
          label="Voltage"
          value={formatV(latest?.voltage)}
          icon={Gauge}
          tone={
            latest && (latest.voltage < meter.low_v_threshold || latest.voltage > meter.high_v_threshold)
              ? "danger"
              : "lime"
          }
          hint={`Safe band ${safeBand}`}
        />
        <KpiCard
          label="Current"
          value={formatA(latest?.current)}
          icon={Zap}
          tone="warn"
          hint={latest?.power_factor ? `PF ${latest.power_factor.toFixed(2)}` : undefined}
        />
        <KpiCard
          label="Energy (24h)"
          value={formatKWh(summary?.last_24h.energy_kwh)}
          icon={Battery}
          tone="default"
          hint={summary ? `${summary.last_24h.samples} samples` : undefined}
        />
      </div>

      {/* Main row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 p-5">
          <CardHeader>
            <div>
              <CardTitle>Live Telemetry</CardTitle>
              <p className="text-xs text-ink-muted mt-1">Last ~6 hours</p>
            </div>
            <Tabs defaultValue="power">
              <TabsList>
                <TabsTrigger value="power">Power</TabsTrigger>
                <TabsTrigger value="voltage">Voltage</TabsTrigger>
                <TabsTrigger value="current">Current</TabsTrigger>
              </TabsList>
              <TabsContent value="power">
                <LiveLineChart points={history} metric="power" />
              </TabsContent>
              <TabsContent value="voltage">
                <LiveLineChart points={history} metric="voltage" />
              </TabsContent>
              <TabsContent value="current">
                <LiveLineChart points={history} metric="current" />
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        <Card className="p-5">
          <CardHeader>
            <CardTitle>Voltage Gauge</CardTitle>
            <Badge variant={meter.relay_state ? "success" : "danger"}>
              <ShieldCheck className="h-3 w-3" />
              Relay {meter.relay_state ? "ON" : "OFF"}
            </Badge>
          </CardHeader>
          <VoltageGauge
            voltage={latest?.voltage ?? null}
            low={meter.low_v_threshold}
            high={meter.high_v_threshold}
          />
        </Card>
      </div>

      {/* Summary + alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Energy Summary</CardTitle>
          </CardHeader>
          <div className="space-y-3 text-sm">
            <SummaryRow label="Last 24 hours" data={summary?.last_24h} />
            <SummaryRow label="Last 7 days" data={summary?.last_7d} />
            <SummaryRow label="Last 30 days" data={summary?.last_30d} />
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <Badge variant={recentAlerts.length ? "warn" : "muted"}>
              <AlertTriangle className="h-3 w-3" />
              {recentAlerts.length}
            </Badge>
          </CardHeader>
          {recentAlerts.length === 0 ? (
            <p className="text-sm text-ink-muted">No alerts yet — your meter is humming along nicely.</p>
          ) : (
            <div className="space-y-2">
              {recentAlerts.map((a) => (
                <AlertRow key={a.id} alert={a} onAck={ackAlert} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  data,
}: {
  label: string;
  data: { energy_kwh: number; avg_power: number; peak_power: number; avg_voltage: number; samples: number } | undefined;
}) {
  if (!data) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated/40 p-3">
        <span className="text-ink-muted">{label}</span>
        <span className="text-ink-dim">—</span>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-bg-elevated/40 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</span>
        <span className="reading-mono text-electric-300">{formatKWh(data.energy_kwh)}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>avg {formatW(data.avg_power)}</span>
        <span>peak {formatW(data.peak_power)}</span>
        <span>{formatV(data.avg_voltage)}</span>
      </div>
    </div>
  );
}
