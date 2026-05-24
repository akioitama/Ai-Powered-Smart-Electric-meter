"use client";

import { useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";
import { useDashboard } from "@/providers/dashboard-provider";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { shortDateTime } from "@/lib/format";
import type { RelayEvent } from "@/lib/types";

export default function AuditPage() {
  const { token, meters, user } = useDashboard();
  const [events, setEvents] = useState<RelayEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user.role !== "admin") return;
    let alive = true;
    setLoading(true);
    Promise.all(meters.map((m) => api.relayHistory(m.id, token, 50)))
      .then((results) => {
        if (!alive) return;
        const all = results.flat().sort((a, b) => +new Date(b.ts) - +new Date(a.ts));
        setEvents(all);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [meters, token, user.role]);

  const meterMap = useMemo(() => Object.fromEntries(meters.map((m) => [m.id, m.name])), [meters]);

  if (user.role !== "admin") return <p className="text-ink-muted">Admin only.</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-electric-300">Administration</p>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <History className="h-7 w-7 text-electric-400" />
          Audit Log
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Every relay command and auto-action across all meters.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relay events</CardTitle>
          <Badge variant="muted">{events.length}</Badge>
        </CardHeader>
        {loading ? (
          <p className="text-ink-muted text-sm">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-ink-muted text-sm">No events yet.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Time</TH>
                <TH>Meter</TH>
                <TH>Action</TH>
                <TH>Source</TH>
                <TH>Note</TH>
              </TR>
            </THead>
            <TBody>
              {events.map((e) => (
                <TR key={`${e.id}-${e.meter_id}`}>
                  <TD className="text-ink-muted">{shortDateTime(e.ts)}</TD>
                  <TD>{meterMap[e.meter_id] ?? `#${e.meter_id}`}</TD>
                  <TD>
                    <Badge variant={e.action === "on" ? "success" : "danger"}>
                      {e.action.toUpperCase()}
                    </Badge>
                  </TD>
                  <TD>
                    <Badge variant="muted">{e.source.replace("_", " ")}</Badge>
                  </TD>
                  <TD className="text-ink-muted">{e.note ?? "—"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
