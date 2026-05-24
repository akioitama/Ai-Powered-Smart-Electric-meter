"use client";

import { useEffect, useState } from "react";
import { Copy, Plus, RefreshCw, Trash2, Zap } from "lucide-react";
import { useDashboard } from "@/providers/dashboard-provider";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MeterCreated } from "@/lib/types";
import { relTime } from "@/lib/format";

export default function AdminMetersPage() {
  const { meters, setMeters, token, user } = useDashboard();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<MeterCreated | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [low, setLow] = useState(200);
  const [high, setHigh] = useState(250);

  useEffect(() => {
    if (user.role !== "admin") return;
    api.listMeters(token).then(setMeters).catch(() => {});
  }, [user.role, token, setMeters]);

  if (user.role !== "admin") return <p className="text-ink-muted">Admin only.</p>;

  async function provision(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const meter = await api.createMeter(token, {
        name,
        location: location || undefined,
        low_v_threshold: low,
        high_v_threshold: high,
      });
      setCreated(meter);
      setMeters([...meters, meter]);
      setName("");
      setLocation("");
      setOpen(false);
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this meter and all its data?")) return;
    await api.deleteMeter(id, token);
    setMeters(meters.filter((m) => m.id !== id));
  }

  async function rotate(id: number) {
    const result = await api.rotateToken(id, token);
    setCreated(result);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-electric-300">Administration</p>
          <h1 className="text-3xl font-bold">Meter Provisioning</h1>
          <p className="text-sm text-ink-muted mt-1">
            Issue a new <code className="text-electric-300">meter_uid</code> + token for a Raspberry Pi to publish on.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New meter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All meters</CardTitle>
          <Badge variant="muted">{meters.length}</Badge>
        </CardHeader>
        {meters.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-8">
            No meters yet. Click "New meter" to provision one.
          </p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>UID</TH>
                <TH>Status</TH>
                <TH>Relay</TH>
                <TH>Last seen</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {meters.map((m) => (
                <TR key={m.id}>
                  <TD>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-ink-dim">{m.location ?? "—"}</div>
                  </TD>
                  <TD className="font-mono text-xs">{m.meter_uid}</TD>
                  <TD>
                    <Badge variant={m.online ? "success" : "muted"}>{m.online ? "Online" : "Offline"}</Badge>
                  </TD>
                  <TD>
                    <Badge variant={m.relay_state ? "success" : "danger"}>
                      {m.relay_state ? "ON" : "OFF"}
                    </Badge>
                  </TD>
                  <TD className="text-ink-muted text-xs">
                    {m.last_seen ? relTime(m.last_seen) : "never"}
                  </TD>
                  <TD>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => rotate(m.id)}>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Rotate token
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provision a new meter</DialogTitle>
            <DialogDescription>
              You'll receive a unique meter UID and access token to flash onto the Raspberry Pi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={provision} className="space-y-4">
            <div>
              <Label>Display name</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Lab 3 — Main Panel"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Location (optional)</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Building A · Floor 2"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Low V threshold</Label>
                <Input
                  type="number"
                  value={low}
                  onChange={(e) => setLow(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>High V threshold</Label>
                <Input
                  type="number"
                  value={high}
                  onChange={(e) => setHigh(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                <Zap className="h-4 w-4" />
                {creating ? "Provisioning..." : "Provision"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={created !== null} onOpenChange={(o) => !o && setCreated(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Meter provisioned</DialogTitle>
            <DialogDescription>
              Save the <span className="text-warn">access token</span> now — it will not be shown again.
            </DialogDescription>
          </DialogHeader>
          {created && (
            <div className="space-y-3">
              <CredField label="Meter UID" value={created.meter_uid} />
              <CredField label="Access token" value={created.access_token} highlight />
              <p className="text-xs text-ink-muted leading-relaxed">
                On the Pi, run: <br />
                <code className="text-electric-300 break-all">
                  python publisher.py --uid {created.meter_uid} --host &lt;server-ip&gt;
                </code>
                <br />
                The token is only required for the HTTP fallback ingest endpoint.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CredField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <div
        className={`mt-1 flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-sm break-all ${
          highlight ? "border-warn/40 bg-warn/5 text-warn" : "border-border bg-bg-elevated/60"
        }`}
      >
        <span className="flex-1">{value}</span>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(value)}
          className="text-ink-muted hover:text-ink"
          title="Copy"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
