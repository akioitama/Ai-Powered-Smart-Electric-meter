"""
HTTP-only Raspberry Pi uploader for the Vercel-hosted backend.

Reads readings from your meter (ADC / energy IC / sensor of choice) and
POSTs batches to /api/v1/ingest/readings. Periodically polls
/api/v1/meters/<METER_UID>/pending-commands for relay actions.

Replace `read_from_sensor()` with your hardware-specific sampling.
Set the env vars below before running:

    AIMETER_BASE_URL=https://your-app.vercel.app
    AIMETER_METER_UID=M-ABC12345
    AIMETER_TOKEN=...   # the access_token returned when the meter was created
"""

import json
import os
import random
import time
from datetime import datetime, timezone

import requests

BASE_URL = os.environ["AIMETER_BASE_URL"].rstrip("/")
METER_UID = os.environ["AIMETER_METER_UID"]
TOKEN = os.environ["AIMETER_TOKEN"]

INGEST_URL = f"{BASE_URL}/api/v1/ingest/readings"
COMMANDS_URL = f"{BASE_URL}/api/v1/meters/{METER_UID}/pending-commands"

SAMPLE_INTERVAL_S = 5
COMMAND_POLL_INTERVAL_S = 5

session = requests.Session()


def read_from_sensor() -> dict:
    """Replace this stub with your real hardware sampling."""
    voltage = 230 + random.uniform(-3, 3)
    current = max(0, random.gauss(2.4, 0.6))
    power = voltage * current
    return {
        "ts": datetime.now(timezone.utc).isoformat(),
        "voltage": round(voltage, 2),
        "current": round(current, 3),
        "power": round(power, 2),
        "energy_kwh": 0.0,
        "frequency": 50.0,
        "power_factor": round(random.uniform(0.85, 0.99), 2),
    }


def post_batch(batch: list[dict]) -> None:
    payload = {"meter_uid": METER_UID, "token": TOKEN, "readings": batch}
    r = session.post(INGEST_URL, json=payload, timeout=15)
    r.raise_for_status()
    print(f"[ingest] accepted {r.json().get('accepted')} reading(s)")


def poll_commands() -> None:
    headers = {"Authorization": f"Bearer {TOKEN}"}
    r = session.get(COMMANDS_URL, headers=headers, timeout=10)
    r.raise_for_status()
    cmds = r.json()
    for cmd in cmds:
        action = cmd.get("action")
        print(f"[cmd] received {action} (id={cmd.get('id')})")
        # TODO: drive your relay GPIO here based on `action`.


def main() -> None:
    last_cmd_poll = 0.0
    buffer: list[dict] = []
    while True:
        try:
            buffer.append(read_from_sensor())
            if len(buffer) >= 1:
                post_batch(buffer)
                buffer.clear()

            now = time.time()
            if now - last_cmd_poll >= COMMAND_POLL_INTERVAL_S:
                poll_commands()
                last_cmd_poll = now
        except Exception as e:  # pragma: no cover
            print(f"[error] {e}")
        time.sleep(SAMPLE_INTERVAL_S)


if __name__ == "__main__":
    main()
