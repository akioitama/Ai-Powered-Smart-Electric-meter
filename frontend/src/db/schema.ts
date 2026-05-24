import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ---------- enums ----------
export const userRoleEnum = pgEnum("user_role", ["admin", "consumer", "technician"]);
export const alertTypeEnum = pgEnum("alert_type", [
  "voltage_high",
  "voltage_low",
  "theft",
  "relay_action",
  "offline",
  "other",
]);
export const alertSeverityEnum = pgEnum("alert_severity", ["info", "warning", "critical"]);
export const relayActionEnum = pgEnum("relay_action", ["on", "off"]);
export const relaySourceEnum = pgEnum("relay_source", [
  "user",
  "admin",
  "ai_auto",
  "threshold_auto",
  "system",
]);
export const billStatusEnum = pgEnum("bill_status", ["pending", "paid", "overdue"]);

// ---------- users ----------
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("consumer"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("users_email_idx").on(t.email),
  }),
);

// ---------- meters ----------
export const meters = pgTable(
  "meters",
  {
    id: serial("id").primaryKey(),
    meterUid: text("meter_uid").notNull().unique(),
    name: text("name").notNull(),
    location: text("location"),
    ownerUserId: integer("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    accessTokenHash: text("access_token_hash").notNull(),
    lowVThreshold: doublePrecision("low_v_threshold").notNull().default(200),
    highVThreshold: doublePrecision("high_v_threshold").notNull().default(250),
    relayState: boolean("relay_state").notNull().default(true),
    online: boolean("online").notNull().default(false),
    firmwareVersion: text("firmware_version"),
    lastSeen: timestamp("last_seen", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uidIdx: index("meters_uid_idx").on(t.meterUid),
    ownerIdx: index("meters_owner_idx").on(t.ownerUserId),
  }),
);

// ---------- readings ----------
export const readings = pgTable(
  "readings",
  {
    id: serial("id").primaryKey(),
    meterId: integer("meter_id")
      .notNull()
      .references(() => meters.id, { onDelete: "cascade" }),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
    voltage: doublePrecision("voltage").notNull(),
    current: doublePrecision("current").notNull(),
    power: doublePrecision("power").notNull(),
    energyKwh: doublePrecision("energy_kwh").notNull().default(0),
    frequency: doublePrecision("frequency"),
    powerFactor: doublePrecision("power_factor"),
    anomalyScore: doublePrecision("anomaly_score"),
    isAnomaly: integer("is_anomaly").notNull().default(0),
  },
  (t) => ({
    meterTsIdx: index("readings_meter_ts_idx").on(t.meterId, t.ts),
  }),
);

// ---------- alerts ----------
export const alerts = pgTable(
  "alerts",
  {
    id: serial("id").primaryKey(),
    meterId: integer("meter_id")
      .notNull()
      .references(() => meters.id, { onDelete: "cascade" }),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
    type: alertTypeEnum("type").notNull(),
    severity: alertSeverityEnum("severity").notNull(),
    value: doublePrecision("value"),
    message: text("message").notNull(),
    acknowledgedBy: integer("acknowledged_by").references(() => users.id, {
      onDelete: "set null",
    }),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  },
  (t) => ({
    meterTsIdx: index("alerts_meter_ts_idx").on(t.meterId, t.ts),
    unackIdx: index("alerts_unack_idx").on(t.acknowledgedAt),
  }),
);

// ---------- relay events ----------
export const relayEvents = pgTable(
  "relay_events",
  {
    id: serial("id").primaryKey(),
    meterId: integer("meter_id")
      .notNull()
      .references(() => meters.id, { onDelete: "cascade" }),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
    action: relayActionEnum("action").notNull(),
    source: relaySourceEnum("source").notNull(),
    requestedByUserId: integer("requested_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    success: boolean("success").notNull().default(true),
    note: text("note"),
  },
  (t) => ({
    meterTsIdx: index("relay_events_meter_ts_idx").on(t.meterId, t.ts),
  }),
);

// ---------- meter commands queue (Pi polls these) ----------
export const meterCommands = pgTable(
  "meter_commands",
  {
    id: serial("id").primaryKey(),
    meterId: integer("meter_id")
      .notNull()
      .references(() => meters.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    action: text("action").notNull(), // e.g. relay_on, relay_off, set_config
    payload: text("payload"), // JSON string
  },
  (t) => ({
    meterPendingIdx: index("meter_commands_pending_idx").on(t.meterId, t.deliveredAt),
  }),
);

// ---------- audit log ----------
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  actorUserId: integer("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  detail: text("detail"),
});

// ---------- bills (basic) ----------
export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  meterId: integer("meter_id")
    .notNull()
    .references(() => meters.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  energyKwh: doublePrecision("energy_kwh").notNull(),
  amount: doublePrecision("amount").notNull(),
  status: billStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DbUser = typeof users.$inferSelect;
export type NewDbUser = typeof users.$inferInsert;
export type DbMeter = typeof meters.$inferSelect;
export type NewDbMeter = typeof meters.$inferInsert;
export type DbReading = typeof readings.$inferSelect;
export type NewDbReading = typeof readings.$inferInsert;
export type DbAlert = typeof alerts.$inferSelect;
export type NewDbAlert = typeof alerts.$inferInsert;
export type DbRelayEvent = typeof relayEvents.$inferSelect;
export type DbMeterCommand = typeof meterCommands.$inferSelect;
