# Quickstart — End-to-end smoke test

This walks you through the full loop: stack up → admin login → provision a meter → start the simulator → see live data.

## Prerequisites

- Docker Desktop (Windows / macOS / Linux) **OR**
- Python 3.12+ and Node 20+ for local dev

## Option A — One command (Docker)

```powershell
cd "h:\Projects\Ai Meter\infra"
docker compose up --build
```

When the logs settle:

- Frontend → http://localhost:3000
- API docs → http://localhost:8000/docs
- MQTT broker → tcp://localhost:1883

## Option B — Local dev (no Docker)

Backend:

```powershell
cd "h:\Projects\Ai Meter\backend"
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edit .env to point to your local Postgres / Redis / Mosquitto
alembic upgrade head
uvicorn app.main:app --reload --port 8000
# In a separate shell:
python -m app.workers.mqtt_worker
```

Frontend:

```powershell
cd "h:\Projects\Ai Meter\frontend"
npm install
copy .env.local.example .env.local
npm run dev
```

## End-to-end smoke test

1. Open http://localhost:3000 → you'll be redirected to /login.
2. Sign in with the bootstrap admin: **admin@aimeter.local** / **admin1234**.
3. Open **Admin → Meter Provisioning** → **New meter**. Give it any name (e.g. *Lab Demo*) → **Provision**.
4. Copy the `meter_uid` from the success dialog (the access token is only needed for HTTP fallback).
5. In a new shell, start the reference Pi simulator:

   ```powershell
   cd "h:\Projects\Ai Meter\pi"
   pip install paho-mqtt
   python publisher.py --uid <meter_uid> --host localhost --port 1883 --simulate
   ```

6. Switch back to the dashboard. Pick the new meter from the topbar selector → you'll see live readings appear in the chart, the voltage gauge, and the KPI tiles within seconds.
7. Hit **Relay Control → Turn OFF**: the simulator's terminal should print `Relay -> OFF` and the dashboard updates instantly.
8. Watch the simulator inject occasional voltage spikes — they should appear as critical alerts under **Alerts** and trigger an automatic relay-off.

## Re-train the AI model later

Once you've collected a few hours of real readings, retrain on real data:

```powershell
cd "h:\Projects\Ai Meter\backend"
.venv\Scripts\Activate.ps1
python -m app.ml.train --days 7
```

## Wiring the real Raspberry Pi

Replace the body of `pi/publisher.py::read_sensors` with your real ZMPT101B + ACS712 reading code (the file has a TODO marker). Everything else — topics, payload schema, command handler — already matches `docs/INTEGRATION.md`.
