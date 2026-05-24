"""MQTT publisher (used by REST API) and subscriber (used by worker process).

Topics:
- meters/{meter_uid}/readings   (Pi → server)
- meters/{meter_uid}/alerts     (Pi → server)
- meters/{meter_uid}/status     (Pi → server)
- meters/{meter_uid}/commands   (server → Pi)
- meters/{meter_uid}/config     (server → Pi)

The `paho-mqtt` import is lazy so the API process can run without the package
installed (HTTP-only / SQLite-only quickstart mode).
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Callable

from app.core.config import settings


def _mqtt():
    import paho.mqtt.client as mqtt  # noqa: WPS433
    return mqtt

log = logging.getLogger("aimeter.mqtt")


def topic_readings(uid: str) -> str:
    return f"meters/{uid}/readings"


def topic_alerts(uid: str) -> str:
    return f"meters/{uid}/alerts"


def topic_status(uid: str) -> str:
    return f"meters/{uid}/status"


def topic_commands(uid: str) -> str:
    return f"meters/{uid}/commands"


def topic_config(uid: str) -> str:
    return f"meters/{uid}/config"


class MqttPublisher:
    """Lightweight publisher used inside the FastAPI process for relay/config commands."""

    def __init__(self) -> None:
        self._client: Any = None

    async def start_publisher(self) -> None:
        if self._client is not None:
            return

        try:
            mqtt = _mqtt()
        except ImportError:
            log.warning("paho-mqtt not installed — MQTT publisher disabled.")
            return

        client = mqtt.Client(
            client_id="aimeter-api",
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        )
        if settings.MQTT_USERNAME:
            client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD or "")
        if settings.MQTT_TLS:
            client.tls_set()

        def _on_connect(c, userdata, flags, reason_code, properties=None):
            log.info("MQTT publisher connected: %s", reason_code)

        client.on_connect = _on_connect
        try:
            client.connect_async(settings.MQTT_HOST, settings.MQTT_PORT, keepalive=60)
            client.loop_start()
            self._client = client
            log.info("MQTT publisher loop started → %s:%s", settings.MQTT_HOST, settings.MQTT_PORT)
        except Exception as e:  # noqa: BLE001
            log.warning("MQTT publisher could not connect (%s) — will retry on publish.", e)
            self._client = None

    async def stop_publisher(self) -> None:
        if self._client is not None:
            try:
                self._client.loop_stop()
                self._client.disconnect()
            except Exception:  # noqa: BLE001
                pass
            self._client = None

    def publish(self, topic: str, payload: dict[str, Any], qos: int = 1, retain: bool = False) -> bool:
        if self._client is None:
            log.warning("MQTT publisher not connected; dropping message to %s", topic)
            return False
        info = self._client.publish(topic, json.dumps(payload, default=str), qos=qos, retain=retain)
        return info.rc == _mqtt().MQTT_ERR_SUCCESS

    def send_relay_command(self, meter_uid: str, action: str, note: str | None = None) -> bool:
        return self.publish(
            topic_commands(meter_uid),
            {"action": f"relay_{action}", "note": note or ""},
            qos=1,
        )

    def send_config(self, meter_uid: str, low_v: float, high_v: float) -> bool:
        return self.publish(
            topic_config(meter_uid),
            {"low_v": low_v, "high_v": high_v},
            qos=1,
            retain=True,
        )


mqtt_service = MqttPublisher()


class MqttSubscriber:
    """Long-running subscriber used by the worker process."""

    def __init__(
        self,
        on_reading: Callable[[str, dict], asyncio.Future | None],
        on_alert: Callable[[str, dict], asyncio.Future | None],
        on_status: Callable[[str, dict], asyncio.Future | None],
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        mqtt = _mqtt()
        self.on_reading = on_reading
        self.on_alert = on_alert
        self.on_status = on_status
        self.loop = loop
        self.client = mqtt.Client(
            client_id="aimeter-worker",
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        )
        if settings.MQTT_USERNAME:
            self.client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD or "")
        if settings.MQTT_TLS:
            self.client.tls_set()

        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message

    def _on_connect(self, client, userdata, flags, reason_code, properties=None):
        log.info("MQTT subscriber connected: %s", reason_code)
        client.subscribe([
            ("meters/+/readings", 1),
            ("meters/+/alerts", 1),
            ("meters/+/status", 1),
        ])

    def _on_message(self, client, userdata, msg):
        try:
            parts = msg.topic.split("/")
            if len(parts) < 3 or parts[0] != "meters":
                return
            meter_uid = parts[1]
            kind = parts[2]
            try:
                payload = json.loads(msg.payload.decode("utf-8"))
            except Exception:  # noqa: BLE001
                log.warning("Invalid JSON on %s: %s", msg.topic, msg.payload[:80])
                return

            if kind == "readings":
                self._dispatch(self.on_reading, meter_uid, payload)
            elif kind == "alerts":
                self._dispatch(self.on_alert, meter_uid, payload)
            elif kind == "status":
                self._dispatch(self.on_status, meter_uid, payload)
        except Exception as e:  # noqa: BLE001
            log.exception("on_message error: %s", e)

    def _dispatch(self, handler, meter_uid: str, payload: dict) -> None:
        asyncio.run_coroutine_threadsafe(handler(meter_uid, payload), self.loop)

    def start(self) -> None:
        log.info("MQTT subscriber connecting to %s:%s", settings.MQTT_HOST, settings.MQTT_PORT)
        self.client.connect(settings.MQTT_HOST, settings.MQTT_PORT, keepalive=60)
        self.client.loop_start()

    def stop(self) -> None:
        try:
            self.client.loop_stop()
            self.client.disconnect()
        except Exception:  # noqa: BLE001
            pass
