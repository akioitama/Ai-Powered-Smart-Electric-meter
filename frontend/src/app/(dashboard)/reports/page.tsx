"use client";

import { useEffect, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { useDashboard } from "@/providers/dashboard-provider";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/charts/kpi-card";
import { NoMeterState } from "@/components/meter/empty-state";
import { formatKWh, formatV, formatW } from "@/lib/format";
import type { ReadingsSummary } from "@/lib/types";

export default function ReportsPage() {
  const { selectedMeter, selectedMeterId, token, user } = useDashboard();
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState<ReadingsSummary | null>(null);

  useEffect(() => {
    if (!selectedMeterId) return;
    api.summary(selectedMeterId, token).then(setSummary).catch(() => {});
  }, [selectedMeterId, token]);

  if (!selectedMeter || !selectedMeterId) return <NoMeterState isAdmin={user.role === "admin"} />;

  async function downloadCsv(kind: "readings" | "alerts") {
    const url = kind === "readings" ? api.readingsCsvUrl(selectedMeterId!, days) : api.alertsCsvUrl(selectedMeterId!, days);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const blob = await res.blob();
    const dl = document.createElement("a");
    dl.href = URL.createObjectURL(blob);
    dl.download = `${selectedMeter!.meter_uid}_${kind}_${days}d.csv`;
    dl.click();
    URL.revokeObjectURL(dl.href);
  }

  const bucket = days <= 1 ? summary?.last_24h : days <= 7 ? summary?.last_7d : summary?.last_30d;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-electric-300">Reports</p>
          <h1 className="text-3xl font-bold">Energy &amp; Alert Reports</h1>
          <p className="text-sm text-ink-muted mt-1">
            Export raw readings and alerts as CSV for billing reconciliation, audits, or further analysis.
          </p>
        </div>
        <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <TabsList>
            <TabsTrigger value="1">1d</TabsTrigger>
            <TabsTrigger value="7">7d</TabsTrigger>
            <TabsTrigger value="30">30d</TabsTrigger>
            <TabsTrigger value="90">90d</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Energy" value={formatKWh(bucket?.energy_kwh)} hint={`${days}-day window`} />
        <KpiCard label="Avg Power" value={formatW(bucket?.avg_power)} tone="warn" />
        <KpiCard label="Peak Power" value={formatW(bucket?.peak_power)} tone="danger" />
        <KpiCard label="Avg Voltage" value={formatV(bucket?.avg_voltage)} tone="lime" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Readings export
              </span>
            </CardTitle>
            <Badge variant="muted">CSV</Badge>
          </CardHeader>
          <p className="text-sm text-ink-muted mb-4">
            Per-sample voltage, current, power, energy, frequency, power factor and AI score for the last
            {" "}{days} day{days > 1 ? "s" : ""}.
          </p>
          <Button onClick={() => downloadCsv("readings")}>
            <Download className="h-4 w-4" />
            Download readings.csv
          </Button>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Alerts export
              </span>
            </CardTitle>
            <Badge variant="muted">CSV</Badge>
          </CardHeader>
          <p className="text-sm text-ink-muted mb-4">
            All alerts (theft, voltage, relay, offline) plus their acknowledgements for audit-grade
            traceability.
          </p>
          <Button onClick={() => downloadCsv("alerts")}>
            <Download className="h-4 w-4" />
            Download alerts.csv
          </Button>
        </Card>
      </div>
    </div>
  );
}
