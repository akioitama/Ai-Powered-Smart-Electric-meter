"""Reference MQTT publisher for the Raspberry Pi.

Drop this onto your Pi (or import the relevant pieces into your firmware).
It demonstrates the exact JSON schema the AI Meter backend expects and shows
how to handle inbound relay/config commands.

Usage:
    pip install paho-mqtt
    python publisher.py --uid mtr_abc123 --host 192.168.1.10 --simulate

Replace `read_sensors()` with your real ZMPT101B / ACS712 reading code.
"""

from __future__ import annotations

import argparse
import json
import logging
import math
import random
import signal
import sys
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("pi.publisher")


def read_sensors(simulate: bool, t: float) -> dict:
    """Return a single reading. Replace this with real GPIO/ADC code."""
    if simulate:
        voltage = 220 + 4 * math.sin(t / 12.0) + random.uniform(-1.5, 1.5)
        current = max(0.05, 1.0 + 0.5 * math.sin(t / 17.0) + random.uniform(-0.1, 0.1))
        if random.random() < 0.01:
            voltage += random.choice([-40, 40, 60])
        if random.random() < 0.005:
            current *= 4
        power = voltage * current
        energy = power / 3600.0 / 1000.0
        return {
            "voltage": round(voltage, 2),
            "current": round(current, 3),
            "power": round(power, 2),
            "energy_kwh": round(energy, 6),
            "freq": 50.0 + random.uniform(-0.05, 0.05),
            "pf": round(0.95 + random.uniform(-0.04, 0.04), 3),
        }
    # TODO: replace with real sensor reads
    raise NotImplementedError("Wire up your ZMPT101B + ACS712 readings here.")


class PiPublisher:
    def __init__(self, uid: str, host: str, port: int, username: str | None, password: str | None):
        self.uid = uid
        self.client = mqtt.Client(
            client_id=f"pi-{uid}",
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        )
        if username:
            self.client.username_pw_set(username, password or "")
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.host = host
        self.port = port
        self.relay_state = True
        self.low_v = 200.0
        self.high_v = 250.0
        self._stop = False

    def _on_connect(self, client, userdata, flags, reason_code, properties=None):
        log.info("Connected to MQTT broker (%s)", reason_code)
        client.subscribe([
            (f"meters/{self.uid}/commands", 1),
            (f"meters/{self.uid}/config", 1),
        ])
        self.publish_status(online=True, firmware="pi-ref-1.0.0")

    def _on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
        except Exception:  # noqa: BLE001
            log.warning("Bad JSON on %s", msg.topic)
            return
        if msg.topic.endswith("/commands"):
            action = payload.get("action", "")
            if action == "relay_off":
                self.relay_state = False
                log.warning("Relay -> OFF (%s)", payload.get("note"))
                self.publish_alert("relay_action", "warning", "Relay turned OFF (remote)", value=0)
            elif action == "relay_on":
                self.relay_state = True
                log.info("Relay -> ON (%s)", payload.get("note"))
                self.publish_alert("relay_action", "info", "Relay turned ON (remote)", value=1)
            elif action == "reboot":
                log.warning("Reboot requested — implement on real Pi")
        elif msg.topic.endswith("/config"):
            self.low_v = float(payload.get("low_v", self.low_v))
            self.high_v = float(payload.get("high_v", self.high_v))
            log.info("Thresholds updated: %.1f / %.1f", self.low_v, self.high_v)

    def publish_reading(self, reading: dict) -> None:
        reading = {**reading, "ts": datetime.now(timezone.utc).isoformat()}
        self.client.publish(f"meters/{self.uid}/readings", json.dumps(reading), qos=1)

    def publish_alert(
        self, type_: str, severity: str, message: str, value: float | None = None
    ) -> None:
        payload = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "type": type_,
            "severity": severity,
            "value": value,
            "message": message,
        }
        self.client.publish(f"meters/{self.uid}/alerts", json.dumps(payload), qos=1)

    def publish_status(self, online: bool, firmware: str) -> None:
        payload = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "online": online,
            "firmware": firmware,
            "relay_state": self.relay_state,
        }
        self.client.publish(f"meters/{self.uid}/status", json.dumps(payload), qos=1, retain=True)

    def run(self, simulate: bool, interval: float) -> None:
        self.client.connect(self.host, self.port, keepalive=60)
        self.client.loop_start()
        signal.signal(signal.SIGINT, lambda *_: self.stop())
        t = 0.0
        last_status = time.time()
        try:
            while not self._stop:
                reading = read_sensors(simulate, t)
                self.publish_reading(reading)
                if time.time() - last_status > 30:
                    self.publish_status(True, "pi-ref-1.0.0")
                    last_status = time.time()
                time.sleep(interval)
                t += interval
        finally:
            self.publish_status(False, "pi-ref-1.0.0")
            self.client.loop_stop()
            self.client.disconnect()

    def stop(self) -> None:
        self._stop = True


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--uid", required=True, help="meter_uid issued by the admin dashboard")
    p.add_argument("--host", default="localhost")
    p.add_argument("--port", type=int, default=1883)
    p.add_argument("--user", default=None)
    p.add_argument("--password", default=None)
    p.add_argument("--interval", type=float, default=2.0)
    p.add_argument("--simulate", action="store_true")
    args = p.parse_args()

    pub = PiPublisher(args.uid, args.host, args.port, args.user, args.password)
    pub.run(simulate=args.simulate, interval=args.interval)


if __name__ == "__main__":
    sys.exit(main())
