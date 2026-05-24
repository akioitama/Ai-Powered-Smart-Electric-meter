"use client";

import { useState } from "react";
import { Save, ShieldCheck, Sliders, User } from "lucide-react";
import { useDashboard } from "@/providers/dashboard-provider";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { NoMeterState } from "@/components/meter/empty-state";

export default function SettingsPage() {
  const { user, selectedMeter, selectedMeterId, token, meters, setMeters } = useDashboard();
  const [low, setLow] = useState<number>(selectedMeter?.low_v_threshold ?? 200);
  const [high, setHigh] = useState<number>(selectedMeter?.high_v_threshold ?? 250);
  const [name, setName] = useState<string>(selectedMeter?.name ?? "");
  const [location, setLocation] = useState<string>(selectedMeter?.location ?? "");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [theftAlerts, setTheftAlerts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!selectedMeter || !selectedMeterId) return <NoMeterState isAdmin={user.role === "admin"} />;

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const updated = await api.updateMeter(selectedMeterId!, token, {
        name,
        location,
        low_v_threshold: low,
        high_v_threshold: high,
      });
      setMeters(meters.map((m) => (m.id === updated.id ? updated : m)));
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-electric-300">Settings</p>
        <h1 className="text-3xl font-bold">Preferences</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4" /> Profile
              </span>
            </CardTitle>
            <Badge variant="muted">{user.role}</Badge>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input defaultValue={user.name} disabled className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input defaultValue={user.email} disabled className="mt-1" />
            </div>
            <p className="text-xs text-ink-dim">
              Profile updates are coming soon. Contact your admin to change credentials for now.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <Sliders className="h-4 w-4" /> Notifications
              </span>
            </CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <NotifRow
              label="Email alerts"
              desc="Send a copy of critical alerts to your email."
              value={emailAlerts}
              onChange={setEmailAlerts}
            />
            <NotifRow
              label="Theft alerts"
              desc="Notify on AI-detected anomalies even if low severity."
              value={theftAlerts}
              onChange={setTheftAlerts}
            />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Meter — {selectedMeter.name}
            </span>
          </CardTitle>
          <Badge variant="muted">{selectedMeter.meter_uid}</Badge>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Display name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main Panel — Lab 3"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Voltage low threshold (V)</Label>
            <Input
              type="number"
              value={low}
              onChange={(e) => setLow(Number(e.target.value))}
              className="mt-1"
            />
            <p className="text-xs text-ink-dim mt-1">Below this → automatic relay OFF.</p>
          </div>
          <div>
            <Label>Voltage high threshold (V)</Label>
            <Input
              type="number"
              value={high}
              onChange={(e) => setHigh(Number(e.target.value))}
              className="mt-1"
            />
            <p className="text-xs text-ink-dim mt-1">Above this → automatic relay OFF.</p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {msg && <span className="text-sm text-ink-muted">{msg}</span>}
        </div>
      </Card>
    </div>
  );
}

function NotifRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-border bg-bg-elevated/40 p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <p className="text-xs text-ink-muted mt-0.5">{desc}</p>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
