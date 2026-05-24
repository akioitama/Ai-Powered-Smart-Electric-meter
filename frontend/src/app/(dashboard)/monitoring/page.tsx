"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Brain, ChartBar, Sparkles, TrendingUp } from "lucide-react";
import { useDashboard } from "@/providers/dashboard-provider";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/charts/kpi-card";
import { AnomalyHeatmap } from "@/components/charts/anomaly-heatmap";
import { AnomalyTimeline } from "@/components/charts/anomaly-timeline";
import { NoMeterState } from "@/components/meter/empty-state";
import { formatV, formatW, formatKWh } from "@/lib/format";
import type { Reading } from "@/lib/types";

export default function MonitoringPage() {
  const { selectedMeterId, token, user } = useDashboard();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedMeterId) return;
    let alive = true;
    setLoading(true);
    api
      .listReadings(selectedMeterId, token, hours, 5000)
      .then((r) => {
        if (alive) setReadings(r);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [selectedMeterId, token, hours]);

  const stats = useMemo(() => {
    const total = readings.length;
    const anomalies = readings.filter((r) => r.is_anomaly).length;
    const peak = readings.reduce((a, b) => (b.power > a ? b.power : a), 0);
    const avg = total ? readings.reduce((s, r) => s + r.power, 0) / total : 0;
    const energy = readings.reduce((s, r) => s + r.energy_kwh, 0);
    const peakHour = (() => {
      const buckets = new Array(24).fill(0);
      for (const r of readings) buckets[new Date(r.ts).getHours()] += r.power;
      const idx = buckets.indexOf(Math.max(...buckets));
      return `${idx.toString().padStart(2, "0")}:00`;
    })();
    return { total, anomalies, peak, avg, energy, peakHour, ratio: total ? anomalies / total : 0 };
  }, [readings]);

  if (!selectedMeterId) return <NoMeterState isAdmin={user.role === "admin"} />;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between flex-wrap gap-3"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-electric-300">UC-1 · Smart Monitoring</p>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-electric-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.7)]" />
            AI Theft Detection
          </h1>
        </div>
        <Tabs value={String(hours)} onValueChange={(v) => setHours(Number(v))}>
          <TabsList>
            <TabsTrigger value="6">6h</TabsTrigger>
            <TabsTrigger value="24">24h</TabsTrigger>
            <TabsTrigger value="168">7d</TabsTrigger>
            <TabsTrigger value="720">30d</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Anomalies Detected"
          value={String(stats.anomalies)}
          icon={AlertTriangle}
          tone={stats.anomalies > 0 ? "danger" : "success"}
          hint={`${(stats.ratio * 100).toFixed(2)}% of ${stats.total} samples`}
        />
        <KpiCard
          label="Peak Power"
          value={formatW(stats.peak)}
          icon={TrendingUp}
          tone="warn"
          hint={`@ ${stats.peakHour}`}
        />
        <KpiCard label="Avg Power" value={formatW(stats.avg)} icon={ChartBar} />
        <KpiCard label="Total Energy" value={formatKWh(stats.energy)} icon={Sparkles} tone="lime" />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>AI Anomaly Score Timeline</CardTitle>
            <p className="text-xs text-ink-muted mt-1">
              Isolation Forest score per reading. Below the dashed line = flagged anomaly.
            </p>
          </div>
          <Badge variant={stats.anomalies ? "danger" : "success"}>
            {stats.anomalies ? `${stats.anomalies} flagged` : "All clear"}
          </Badge>
        </CardHeader>
        {loading ? (
          <div className="h-72 grid place-items-center text-ink-muted">Loading…</div>
        ) : readings.length ? (
          <AnomalyTimeline readings={readings} />
        ) : (
          <div className="h-72 grid place-items-center text-ink-muted">
            No readings yet for this window.
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Anomaly Heatmap (hour × weekday)</CardTitle>
            <p className="text-xs text-ink-muted mt-1">
              Hotspots reveal when suspicious usage tends to occur.
            </p>
          </div>
        </CardHeader>
        <AnomalyHeatmap readings={readings} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How does the AI decide?</CardTitle>
        </CardHeader>
        <ul className="space-y-2 text-sm text-ink-muted">
          <li className="flex gap-3">
            <span className="text-electric-300 font-mono">1.</span>
            <span>
              An <span className="text-ink">Isolation Forest</span> model is trained on historical
              <span className="text-ink"> [voltage, current, power, hour, weekday]</span> features.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-electric-300 font-mono">2.</span>
            <span>
              Each new reading is scored. Lower scores indicate more "isolated" behaviour — likely theft or
              a new appliance pattern.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-electric-300 font-mono">3.</span>
            <span>
              Scores below <code className="text-warn">-0.05</code> raise a theft alert; admins can ack or
              re-train the model with newer data.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-electric-300 font-mono">4.</span>
            <span>
              Voltage thresholds (under/over) are checked separately — they instantly trigger relay
              cut-off (UC-2) for safety.
            </span>
          </li>
        </ul>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent flagged readings</CardTitle>
        </CardHeader>
        {readings.filter((r) => r.is_anomaly).length === 0 ? (
          <p className="text-sm text-ink-muted">No flagged readings in this window.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {readings
              .filter((r) => r.is_anomaly)
              .slice(-20)
              .reverse()
              .map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-warn/30 bg-warn/5 p-3"
                >
                  <div className="text-sm">
                    <div className="font-medium">{new Date(r.ts).toLocaleString()}</div>
                    <div className="text-xs text-ink-muted">
                      {formatV(r.voltage)} · {formatW(r.power)} · score{" "}
                      <span className="text-warn font-mono">{r.anomaly_score?.toFixed(3)}</span>
                    </div>
                  </div>
                  <Badge variant="warn">Flagged</Badge>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
