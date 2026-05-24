# Pi Integration

This folder contains the reference MQTT publisher for the Raspberry Pi side. The hardware is yours; this is just the contract + a working example.

## Quick start (smoke test, no hardware)

```bash
pip install paho-mqtt
# (assuming the docker-compose stack is running)
python publisher.py --uid mtr_demo123 --host localhost --port 1883 --simulate
```

The Pi must first be **provisioned via the admin dashboard** (or `POST /api/v1/meters/`). That returns a `meter_uid` and a one-time `access_token`. The token is needed only for the HTTP fallback endpoint; MQTT topics use ACL on the broker (production) — for dev, anonymous is enabled.

## What to replace for real hardware

In `publisher.py`, replace `read_sensors(simulate=False, t)` with real reads from your ZMPT101B (voltage) + ACS712/SCT-013 (current). Suggested 1–5 Hz sample rate.

## See also

- `docs/INTEGRATION.md` — full topic + payload contract
