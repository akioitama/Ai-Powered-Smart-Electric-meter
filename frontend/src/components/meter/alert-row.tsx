"use client";

import { AlertTriangle, BellOff, CheckCircle2, Power, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { relTime } from "@/lib/format";
import type { Alert } from "@/lib/types";

const TYPE_ICON = {
  voltage_high: Zap,
  voltage_low: Zap,
  theft: AlertTriangle,
  relay_action: Power,
  offline: BellOff,
  other: AlertTriangle,
};

const SEV_VARIANT = {
  info: "default",
  warning: "warn",
  critical: "danger",
} as const;

export function AlertRow({
  alert,
  onAck,
  meterName,
}: {
  alert: Alert;
  onAck?: (id: number) => void;
  meterName?: string;
}) {
  const Icon = TYPE_ICON[alert.type] ?? AlertTriangle;
  const acked = !!alert.acknowledged_at;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-elevated/40 p-3 hover:border-electric-400/30 transition-colors">
      <div
        className={`mt-0.5 grid place-items-center h-9 w-9 shrink-0 rounded-lg border ${
          alert.severity === "critical"
            ? "border-danger/40 bg-danger/10 text-danger"
            : alert.severity === "warning"
              ? "border-warn/40 bg-warn/10 text-warn"
              : "border-electric-400/30 bg-electric-400/10 text-electric-300"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={SEV_VARIANT[alert.severity]}>{alert.type.replace("_", " ")}</Badge>
          {meterName && <span className="text-[11px] text-ink-dim">{meterName}</span>}
          <span className="text-[11px] text-ink-dim">· {relTime(alert.ts)}</span>
        </div>
        <p className="text-sm text-ink mt-1 leading-snug truncate">{alert.message}</p>
      </div>
      {onAck && !acked && (
        <Button size="sm" variant="ghost" onClick={() => onAck(alert.id)}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Ack
        </Button>
      )}
      {acked && (
        <Badge variant="muted">
          <CheckCircle2 className="h-3 w-3" /> ack'd
        </Badge>
      )}
    </div>
  );
}
