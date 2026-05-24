"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History, Power, ShieldAlert, ShieldCheck } from "lucide-react";
import { useDashboard } from "@/providers/dashboard-provider";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { NoMeterState } from "@/components/meter/empty-state";
import { relTime, shortDateTime } from "@/lib/format";
import type { RelayEvent, WSMessage } from "@/lib/types";
import { useMeterSocket } from "@/lib/ws";

export default function ControlPage() {
  const { selectedMeter, selectedMeterId, token, user, meters, setMeters } = useDashboard();
  const [history, setHistory] = useState<RelayEvent[]>([]);
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState<"on" | "off" | null>(null);
  const [note, setNote] = useState("");
  const { last } = useMeterSocket(selectedMeterId, token);

  const reload = useCallback(async () => {
    if (!selectedMeterId) return;
    const h = await api.relayHistory(selectedMeterId, token, 50);
    setHistory(h);
  }, [selectedMeterId, token]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!last) return;
    const msg = last as WSMessage;
    if (msg.type === "relay") {
      reload();
      const data = msg.data as Record<string, unknown>;
      const newState = !!data.relay_state;
      if (selectedMeterId !== null) {
        setMeters(meters.map((m) => (m.id === selectedMeterId ? { ...m, relay_state: newState } : m)));
      }
    }
  }, [last, reload, meters, selectedMeterId, setMeters]);

  if (!selectedMeter || !selectedMeterId) return <NoMeterState isAdmin={user.role === "admin"} />;

  async function send(action: "on" | "off") {
    setPending(true);
    try {
      await api.relayCommand(selectedMeterId!, action, token, note || undefined);
      setMeters(
        meters.map((m) =>
          m.id === selectedMeterId ? { ...m, relay_state: action === "on" } : m,
        ),
      );
      setNote("");
      setConfirm(null);
      await reload();
    } finally {
      setPending(false);
    }
  }

  const on = selectedMeter.relay_state;
  const tone = on ? "lime" : "danger";

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between flex-wrap gap-3"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-electric-300">UC-4 · Load Control</p>
          <h1 className="text-3xl font-bold">Relay Control</h1>
          <p className="text-sm text-ink-muted mt-1">
            Manually disconnect or reconnect the load. Auto-cutoffs from voltage anomalies are also logged here.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-8">
          <div className="flex flex-col items-center text-center gap-6 py-6">
            <div
              className={`relative h-40 w-40 rounded-full grid place-items-center transition-all ${
                on
                  ? "bg-gradient-to-br from-lime-500/30 to-electric-400/20 shadow-[0_0_60px_rgba(166,255,0,0.45)]"
                  : "bg-gradient-to-br from-danger/30 to-warn/10 shadow-[0_0_60px_rgba(255,77,46,0.45)]"
              }`}
            >
              <Power className={`h-20 w-20 ${on ? "text-lime-400" : "text-danger"}`} />
              <span
                className={`absolute -inset-2 rounded-full border ${
                  on ? "border-lime-400/40" : "border-danger/40"
                } animate-pulseGlow`}
              />
            </div>
            <div>
              <div
                className={`reading-mono text-5xl font-bold ${
                  on ? "text-lime-400" : "text-danger"
                } neon-text`}
              >
                {on ? "POWER ON" : "POWER OFF"}
              </div>
              <p className="text-sm text-ink-muted mt-2">
                Last action {history[0] ? relTime(history[0].ts) : "—"}
              </p>
            </div>

            <div className="flex gap-3 w-full max-w-md">
              <Button
                size="lg"
                className="flex-1"
                variant={on ? "secondary" : "success"}
                disabled={pending || on}
                onClick={() => setConfirm("on")}
              >
                <ShieldCheck className="h-4 w-4" />
                Turn ON
              </Button>
              <Button
                size="lg"
                className="flex-1"
                variant={on ? "danger" : "secondary"}
                disabled={pending || !on}
                onClick={() => setConfirm("off")}
              >
                <ShieldAlert className="h-4 w-4" />
                Turn OFF
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick info</CardTitle>
            <Badge variant={tone === "lime" ? "success" : "danger"}>
              {on ? "Connected" : "Disconnected"}
            </Badge>
          </CardHeader>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Meter</dt>
              <dd>{selectedMeter.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">UID</dt>
              <dd className="font-mono text-xs">{selectedMeter.meter_uid}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Online</dt>
              <dd>{selectedMeter.online ? "Yes" : "No"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Voltage band</dt>
              <dd>
                {selectedMeter.low_v_threshold} – {selectedMeter.high_v_threshold} V
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Last seen</dt>
              <dd>{selectedMeter.last_seen ? relTime(selectedMeter.last_seen) : "—"}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <History className="h-4 w-4" /> Relay History
            </span>
          </CardTitle>
          <Badge variant="muted">{history.length}</Badge>
        </CardHeader>
        {history.length === 0 ? (
          <p className="text-sm text-ink-muted">No relay actions yet.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Time</TH>
                <TH>Action</TH>
                <TH>Source</TH>
                <TH>Note</TH>
              </TR>
            </THead>
            <TBody>
              {history.map((e) => (
                <TR key={e.id}>
                  <TD className="text-ink-muted">{shortDateTime(e.ts)}</TD>
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

      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm === "off" ? "Disconnect the load?" : "Reconnect the load?"}
            </DialogTitle>
            <DialogDescription>
              {confirm === "off"
                ? "This will cut power to all devices on this meter. Any auto-protect logic will continue to run."
                : "Re-energize the circuit. Make sure all downstream equipment is safe to power on."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-ink-muted">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Maintenance window"
              className="h-10 w-full rounded-xl border border-border bg-bg-elevated/60 px-3 text-sm focus:outline-none focus:border-electric-400/60"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setConfirm(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant={confirm === "off" ? "danger" : "success"}
              disabled={pending}
              onClick={() => confirm && send(confirm)}
            >
              {pending ? "Sending..." : confirm === "off" ? "Disconnect" : "Reconnect"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
