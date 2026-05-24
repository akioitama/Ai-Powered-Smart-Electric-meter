export type UserRole = "admin" | "consumer" | "technician";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface Meter {
  id: number;
  meter_uid: string;
  name: string;
  location: string | null;
  owner_user_id: number | null;
  low_v_threshold: number;
  high_v_threshold: number;
  relay_state: boolean;
  online: boolean;
  firmware_version: string | null;
  last_seen: string | null;
  created_at: string;
}

export interface MeterCreated extends Meter {
  access_token: string;
}

export interface Reading {
  id: number;
  meter_id: number;
  ts: string;
  voltage: number;
  current: number;
  power: number;
  energy_kwh: number;
  frequency: number | null;
  power_factor: number | null;
  anomaly_score: number | null;
  is_anomaly: number;
}

export interface ReadingsSummary {
  last_24h: SummaryBucket;
  last_7d: SummaryBucket;
  last_30d: SummaryBucket;
}

export interface SummaryBucket {
  energy_kwh: number;
  avg_power: number;
  peak_power: number;
  avg_voltage: number;
  samples: number;
}

export type AlertType =
  | "voltage_high"
  | "voltage_low"
  | "theft"
  | "relay_action"
  | "offline"
  | "other";
export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id: number;
  meter_id: number;
  ts: string;
  type: AlertType;
  severity: AlertSeverity;
  value: number | null;
  message: string;
  acknowledged_by: number | null;
  acknowledged_at: string | null;
}

export interface RelayEvent {
  id: number;
  meter_id: number;
  ts: string;
  action: "on" | "off";
  source: "user" | "admin" | "ai_auto" | "threshold_auto" | "system";
  requested_by_user_id: number | null;
  success: boolean;
  note: string | null;
}

export interface WSMessage {
  type: "reading" | "alert" | "relay" | "status";
  data: Record<string, unknown>;
}
