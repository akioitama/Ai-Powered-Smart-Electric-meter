# AI Powered Smart Electric Meter

A futuristic, AI-driven web platform for the Smart Electric Meter project — pairs with a Raspberry Pi 4 + ZMPT101B + ACS712 + Relay hardware setup. Designed to deploy **fully on Vercel**: the Next.js app contains both the UI and the API as TypeScript route handlers backed by Vercel Postgres.

## Stack

- **Frontend + Backend (single Next.js app):** Next.js 14 (App Router) · TypeScript · Tailwind · shadcn/ui · React Three Fiber · Recharts · Framer Motion · GSAP · jose (JWT) · bcryptjs
- **Database:** Postgres (Vercel Postgres / Neon / Supabase / self-hosted) via Drizzle ORM
- **Edge ingestion:** Raspberry Pi → HTTPS POST `/api/v1/ingest/readings` → Postgres
- **Anomaly detection:** Lightweight rolling z-score (computed on each ingest)

> **Note:** A FastAPI/Python backend with MQTT + WebSockets exists in [`backend/`](backend/) and was the original design. It is **not deployed on Vercel** — Vercel's serverless model can't host long-lived MQTT/WebSocket connections. The Next.js API in `frontend/src/app/api/v1/**` is the production path. Pi devices use HTTP polling for commands instead of MQTT.

## Repo layout

```
.
├── frontend/      Next.js 14 app — UI + API routes (deploy this on Vercel)
│   └── src/
│       ├── app/api/        Auth + /api/v1/* serverless routes
│       ├── db/             Drizzle schema + client
│       └── lib/            JWT, password, anomaly, auth helpers
├── edge/          Pi uploader script (HTTP-only)
├── backend/       Legacy FastAPI service — kept for reference, not deployed
├── infra/         docker-compose for the legacy local stack
└── docs/          Integration + design notes
```

## Deploying to Vercel

### 1. Create a Postgres database

Use **Vercel Postgres** (Storage tab in the Vercel dashboard) or any managed Postgres (Neon, Supabase, Railway, Render). Copy the full connection string — it must include `?sslmode=require` for Vercel Postgres / Neon.

### 2. Push the schema once

From your local machine (only needed once per database):

```bash
cd frontend
cp .env.local.example .env.local
# edit .env.local and paste the DATABASE_URL + JWT_SECRET
npm install --legacy-peer-deps
npm run db:push     # applies the Drizzle schema to your Postgres
```

### 3. Deploy

- Push the repo to GitHub.
- In Vercel, create a new project from the repo and set **Root Directory = `frontend`**.
- Add the following **Environment Variables** (Production + Preview):

  | Key              | Required | Notes                                                  |
  | ---------------- | -------- | ------------------------------------------------------ |
  | `DATABASE_URL`   | yes      | Postgres connection string with `?sslmode=require`     |
  | `JWT_SECRET`     | yes      | Long random string — `openssl rand -base64 48`         |
  | `ADMIN_EMAIL`    | no       | Default `admin@aimeter.com`                            |
  | `ADMIN_PASSWORD` | no       | Default `admin12345` — **change for production**       |
  | `ADMIN_NAME`     | no       | Default `Administrator`                                |

- Click **Deploy**. The first request lazily seeds the admin user.

### 4. Log in

Visit `https://<your-app>.vercel.app/login` and use the admin credentials configured above.

## Local development

```bash
cd frontend
npm install --legacy-peer-deps
npm run db:push       # one-time, against your dev DATABASE_URL
npm run dev
```

Then open http://localhost:3000.

## Connecting the Raspberry Pi

The Pi sends HTTPS POSTs to the Vercel-hosted ingest endpoint. See [`edge/pi_uploader.py`](edge/pi_uploader.py) for a runnable reference.

```bash
# On the Pi
pip install requests
export AIMETER_BASE_URL=https://your-app.vercel.app
export AIMETER_METER_UID=M-ABC12345
export AIMETER_TOKEN=<access_token returned when meter was created>
python edge/pi_uploader.py
```

The Pi posts batches to `POST /api/v1/ingest/readings` and polls `GET /api/v1/meters/<uid>/pending-commands` every few seconds for queued relay commands. No MQTT broker is required.

## API surface (TypeScript route handlers)

All endpoints live under `/api/v1` and are authenticated via the `aimeter_session` cookie (set by `/api/auth/login`) or a JWT bearer token.

| Method | Path                                       | Notes                                          |
| ------ | ------------------------------------------ | ---------------------------------------------- |
| POST   | `/api/auth/login`                          | Email + password → cookie session              |
| POST   | `/api/auth/signup`                         | Self-serve consumer signup                     |
| POST   | `/api/auth/logout`                         | Clear cookie                                   |
| GET    | `/api/session`                             | Current user                                   |
| GET    | `/api/v1/meters`                           | List meters (admin: all, consumer: own)        |
| POST   | `/api/v1/meters`                           | Create meter (admin)                           |
| GET/PATCH/DELETE | `/api/v1/meters/[id]`            | Single meter                                   |
| POST   | `/api/v1/meters/[id]/rotate-token`         | Rotate Pi access token (admin)                 |
| GET    | `/api/v1/meters/[id]/readings`             | Recent readings list                           |
| GET    | `/api/v1/meters/[id]/readings/latest`      | Most recent reading (used by polling hook)     |
| GET    | `/api/v1/meters/[id]/readings/summary`     | 24h / 7d / 30d aggregates                      |
| GET    | `/api/v1/alerts`                           | Alerts list                                    |
| PATCH  | `/api/v1/alerts/[id]/ack`                  | Acknowledge an alert                           |
| POST   | `/api/v1/meters/[id]/relay`                | Queue relay on/off command                     |
| GET    | `/api/v1/meters/[id]/relay/history`        | Relay event history                            |
| GET    | `/api/v1/meters/[uid]/pending-commands`    | **Pi only** — bearer = meter access token      |
| POST   | `/api/v1/ingest/readings`                  | **Pi only** — body-auth (`{meter_uid, token}`) |
| GET    | `/api/v1/users` etc.                       | Admin user management                          |
| GET    | `/api/v1/reports/[id]/readings.csv`        | CSV export                                     |
| GET    | `/api/v1/reports/[id]/alerts.csv`          | CSV export                                     |

## What changed when moving to Vercel

- 🟢 Single deployment target — frontend + API in one Next.js app.
- 🟢 Postgres only (Drizzle ORM). SQLite removed.
- 🟢 Anomaly detection rewritten as a streaming z-score (no scikit-learn).
- 🟡 WebSocket pub/sub replaced with **2.5s polling** of `/readings/latest`.
- 🟡 MQTT removed — Pi uses HTTP POST + command polling.
- 🔴 The original FastAPI backend in `backend/` is no longer used in production.

## Use cases (mapped to SRS)

| UC   | Feature                              | Page                |
| ---- | ------------------------------------ | ------------------- |
| UC-1 | AI Theft Detection (z-score)         | Smart Monitoring    |
| UC-2 | Voltage Anomaly + Auto Relay         | Dashboard / Control |
| UC-3 | Real-time Energy Monitoring (poll)   | Dashboard           |
| UC-4 | Manual Relay ON/OFF                  | Control             |
| UC-5 | Alerts & Notifications               | Alerts / Bell       |
