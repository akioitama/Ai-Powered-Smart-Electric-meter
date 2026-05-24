# AI Meter — Hardware Integration Contract

Everything the Raspberry Pi firmware needs to interoperate with the web platform.

## 1. Provisioning a meter

1. Admin logs into the dashboard and creates a meter (or `POST /api/v1/meters/` with admin token).
2. The response returns:
   - `meter_uid` (e.g. `mtr_a1b2c3d4e5f6`) — used in every MQTT topic
   - `access_token` (only shown **once**) — used by the HTTP fallback endpoint
3. Store both on the Pi (env vars or a config file).

Rotate at any time: `POST /api/v1/meters/{id}/rotate-token`.

## 2. MQTT broker

- Dev: `tcp://<server>:1883`, anonymous allowed
- Prod: TLS on `:8883`, per-meter username/password via Mosquitto password file + ACL
- Websockets: `:9001` (browser MQTT clients, optional)

## 3. Topics (Pi → server)

### `meters/{meter_uid}/readings` — main telemetry, 1–5 Hz

```json
{
  "ts": "2026-05-24T10:11:12.345Z",
  "voltage": 221.4,
  "current": 2.31,
  "power": 511.4,
  "energy_kwh": 12.4567,
  "freq": 50.02,
  "pf": 0.97
}
```

`ts` is optional; server stamps if absent. `power` defaults to `voltage * current` if absent.

### `meters/{meter_uid}/alerts` — Pi-raised events

```json
{
  "ts": "2026-05-24T10:11:13Z",
  "type": "voltage_high|voltage_low|theft|relay_action|offline|other",
  "severity": "info|warning|critical",
  "value": 275.2,
  "message": "Local relay tripped on overvoltage"
}
```

### `meters/{meter_uid}/status` — heartbeat (every 30s)

```json
{
  "ts": "2026-05-24T10:11:00Z",
  "online": true,
  "firmware": "pi-ref-1.0.0",
  "relay_state": true
}
```

Use `retain: true` on the last status so newly-connected subscribers see liveness.

## 4. Topics (server → Pi)

### `meters/{meter_uid}/commands`

```json
{ "action": "relay_on" | "relay_off" | "reboot" | "set_thresholds", "note": "Auto: overvoltage" }
```

The Pi must:
- Actuate the relay GPIO immediately on `relay_on` / `relay_off`
- Acknowledge by publishing a fresh `status` message

### `meters/{meter_uid}/config` (retained)

```json
{ "low_v": 200, "high_v": 250 }
```

Pi should treat these as canonical safety thresholds (e.g., for local fallback when Wi-Fi drops).

## 5. HTTP fallback (offline buffer flush)

When the Pi loses Wi-Fi, buffer readings locally, then `POST /api/v1/ingest/readings`:

```json
{
  "meter_uid": "mtr_a1b2c3d4e5f6",
  "token": "<access_token issued at provisioning>",
  "readings": [
    { "ts": "...", "voltage": 220.1, "current": 1.4, "energy_kwh": 0.0006 },
    { "ts": "...", "voltage": 221.0, "current": 1.5, "energy_kwh": 0.0006 }
  ]
}
```

Server runs the same AI + threshold pipeline as MQTT.

## 6. Server-side automatic actions

Server auto-publishes a `relay_off` command when a reading satisfies (matches SRS Table 8):

- `voltage < low_v_threshold` (default 200 V) — undervoltage
- `voltage > high_v_threshold` (default 250 V) — overvoltage
- Isolation Forest score below `-0.05` → theft alert (no auto-relay; admin reviews)

Latency budget: detection → command < 1 s on the same broker (NFR §5.1).

## 7. REST surface (browser)

Auth: `POST /api/v1/auth/{signup,login}`, `GET /auth/me`

Meters: `GET/POST /api/v1/meters`, `PATCH/DELETE /api/v1/meters/{id}`,
`POST /api/v1/meters/{id}/rotate-token`

Readings: `GET /api/v1/meters/{id}/readings?hours=24&limit=500`,
`GET /api/v1/meters/{id}/readings/latest`,
`GET /api/v1/meters/{id}/readings/summary`

Alerts: `GET /api/v1/alerts?meter_id=&unack_only=`,
`PATCH /api/v1/alerts/{id}/ack`

Control (UC-4): `POST /api/v1/meters/{id}/relay { action: "on" | "off" }`,
`GET /api/v1/meters/{id}/relay/history`

Reports: `GET /api/v1/reports/{id}/readings.csv?days=7`,
`GET /api/v1/reports/{id}/alerts.csv?days=30`

WebSocket (browser): `WS /api/v1/ws/meters/{id}?token=<jwt>` — pushes `reading`, `alert`, `relay`, `status` events.

## 8. Security checklist for production

- TLS on MQTT (`mqtts://`) and HTTPS for REST
- Per-meter MQTT username/password + ACL restricting to its own topic prefix
- Rotate `JWT_SECRET` from the default before deployment
- Set strong `ADMIN_PASSWORD` via env (not the example)
- Enable rate limiting on `/api/v1/ingest/readings`
