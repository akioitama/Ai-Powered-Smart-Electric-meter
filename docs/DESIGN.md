# AI Meter — Design Notes

## Layers

- **Presentation:** Next.js 14 (App Router) — modern electricity-themed UI
- **Application:** FastAPI service + MQTT worker process
- **Data:** PostgreSQL (canonical) + Redis (pub/sub) + Mosquitto (broker)

## Why two backend processes?

- The HTTP API process needs to be free of blocking long-running tasks. It hosts REST + the WebSocket fan-out (subscribed to Redis only, never blocking on MQTT).
- The MQTT worker (`app.workers.mqtt_worker`) owns the Pi connection, persists every reading, runs threshold + Isolation Forest, and **pushes through Redis** so any number of API replicas can fan out updates to browsers.

## Data flow (live reading)

```
Pi → MQTT → worker
    → Postgres (insert reading)
    → AI score + threshold check
    → maybe: publish relay-off command + Postgres alert + relay_event
    → Redis pub/sub  →  WS gateway in API  → all browsers viewing this meter
```

## Why Isolation Forest?

Unsupervised, no labelled-theft dataset required (SRS §1.5). Trained on
`[voltage, current, power, hour_of_day, day_of_week]`. Re-train via
`python -m app.ml.train` (uses real DB rows after a few days, synthetic before).

## Security model

- All endpoints behind JWT, except `/auth/login`, `/auth/signup`, `/health`, `/ingest/readings` (token-gated by per-meter access_token).
- `require_admin` / `require_admin_or_technician` dependency factories enforce RBAC.
- WebSocket `?token=` is a JWT issued to the browser; the gateway re-checks ownership.
- Audit log for sensitive actions (relay command, role change).

## NFR mapping (SRS §5)

| NFR                         | Mechanism                                                  |
|-----------------------------|------------------------------------------------------------|
| Dashboard refresh ≤ 5 s     | WebSocket push (typically <500 ms)                         |
| Relay action ≤ 1 s          | MQTT round-trip on same broker; QoS 1                      |
| ≥ 95% anomaly accuracy      | Isolation Forest, retrainable; tune `contamination` & threshold |
| CSV export                  | `/reports/{id}/{readings,alerts}.csv`                      |
| TLS / HTTPS                 | Nginx reverse proxy + Mosquitto TLS in prod                |
| RBAC (admin/consumer/tech)  | Enums + dependency guards                                  |
| Audit log                   | `audit_logs` + `relay_events` tables                       |
