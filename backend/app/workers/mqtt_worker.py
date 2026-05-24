"""Long-running MQTT worker.

Subscribes to all meter topics, persists readings, runs threshold + AI checks,
auto-publishes relay-OFF on unsafe voltage, and forwards everything via Redis
so the API process can fan it out over WebSockets.
"""

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.alert import AlertSeverity, AlertType
from app.models.meter import Meter
from app.models.reading import Reading
from app.models.relay_event import RelayAction, RelaySource
from app.services.ai_service import ai_service
from app.services.alert_service import create_alert, record_relay_event
from app.services.mqtt_client import MqttSubscriber, mqtt_service
from app.services.redis_bus import CHANNEL_READING, CHANNEL_STATUS, publish

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("aimeter.worker")


def _parse_ts(ts_raw) -> datetime:
    if isinstance(ts_raw, str):
        try:
            return datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.now(timezone.utc)


async def _get_meter(db, meter_uid: str) -> Meter | None:
    res = await db.execute(select(Meter).where(Meter.meter_uid == meter_uid))
    return res.scalar_one_or_none()


async def handle_reading(meter_uid: str, payload: dict) -> None:
    voltage = float(payload.get("voltage", 0.0))
    current = float(payload.get("current", 0.0))
    power = float(payload.get("power", voltage * current))
    energy = float(payload.get("energy_kwh", 0.0))
    freq = payload.get("freq") or payload.get("frequency")
    pf = payload.get("pf") or payload.get("power_factor")
    ts = _parse_ts(payload.get("ts"))

    async with AsyncSessionLocal() as db:
        meter = await _get_meter(db, meter_uid)
        if not meter:
            log.warning("Reading for unknown meter %s — skipping", meter_uid)
            return

        score, is_anomaly = await ai_service.score(
            meter.id,
            voltage=voltage,
            current=current,
            power=power,
        )

        reading = Reading(
            meter_id=meter.id,
            ts=ts,
            voltage=voltage,
            current=current,
            power=power,
            energy_kwh=energy,
            frequency=float(freq) if freq is not None else None,
            power_factor=float(pf) if pf is not None else None,
            anomaly_score=score,
            is_anomaly=1 if is_anomaly else 0,
        )
        db.add(reading)
        meter.online = True
        meter.last_seen = ts
        await db.commit()
        await db.refresh(reading)

        await publish(
            CHANNEL_READING,
            {
                "meter_id": meter.id,
                "meter_uid": meter.meter_uid,
                "id": reading.id,
                "ts": ts.isoformat(),
                "voltage": voltage,
                "current": current,
                "power": power,
                "energy_kwh": energy,
                "frequency": reading.frequency,
                "power_factor": reading.power_factor,
                "anomaly_score": score,
                "is_anomaly": is_anomaly,
                "relay_state": meter.relay_state,
            },
        )

        if voltage < meter.low_v_threshold:
            await create_alert(
                db,
                meter,
                AlertType.VOLTAGE_LOW,
                AlertSeverity.CRITICAL,
                f"Undervoltage detected: {voltage:.1f} V (< {meter.low_v_threshold:.0f} V)",
                value=voltage,
            )
            if meter.relay_state:
                mqtt_service.send_relay_command(meter.meter_uid, "off", "Auto: undervoltage")
                await record_relay_event(
                    db, meter, RelayAction.OFF, RelaySource.THRESHOLD_AUTO,
                    note="Auto-off: undervoltage",
                )
        elif voltage > meter.high_v_threshold:
            await create_alert(
                db,
                meter,
                AlertType.VOLTAGE_HIGH,
                AlertSeverity.CRITICAL,
                f"Overvoltage detected: {voltage:.1f} V (> {meter.high_v_threshold:.0f} V)",
                value=voltage,
            )
            if meter.relay_state:
                mqtt_service.send_relay_command(meter.meter_uid, "off", "Auto: overvoltage")
                await record_relay_event(
                    db, meter, RelayAction.OFF, RelaySource.THRESHOLD_AUTO,
                    note="Auto-off: overvoltage",
                )

        if is_anomaly:
            await create_alert(
                db,
                meter,
                AlertType.THEFT,
                AlertSeverity.WARNING,
                f"AI anomaly detected (score={score:.3f}). Possible theft / abnormal usage.",
                value=score,
            )


async def handle_alert(meter_uid: str, payload: dict) -> None:
    """Pi-side raised alert (e.g., relay tripped locally)."""
    async with AsyncSessionLocal() as db:
        meter = await _get_meter(db, meter_uid)
        if not meter:
            return
        try:
            type_ = AlertType(payload.get("type", "other"))
        except ValueError:
            type_ = AlertType.OTHER
        try:
            severity = AlertSeverity(payload.get("severity", "warning"))
        except ValueError:
            severity = AlertSeverity.WARNING
        await create_alert(
            db,
            meter,
            type_,
            severity,
            payload.get("message", "Hardware alert"),
            value=payload.get("value"),
        )


async def handle_status(meter_uid: str, payload: dict) -> None:
    async with AsyncSessionLocal() as db:
        meter = await _get_meter(db, meter_uid)
        if not meter:
            return
        meter.online = bool(payload.get("online", True))
        if "firmware" in payload:
            meter.firmware_version = str(payload["firmware"])[:40]
        meter.last_seen = datetime.now(timezone.utc)
        await db.commit()
    await publish(
        CHANNEL_STATUS,
        {
            "meter_uid": meter_uid,
            "online": payload.get("online", True),
            "firmware": payload.get("firmware"),
        },
    )


async def main() -> None:
    log.info("Starting MQTT worker...")
    await ai_service.load()

    loop = asyncio.get_running_loop()
    sub = MqttSubscriber(
        on_reading=handle_reading,
        on_alert=handle_alert,
        on_status=handle_status,
        loop=loop,
    )
    sub.start()

    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, asyncio.CancelledError):
        log.info("Worker shutting down.")
    finally:
        sub.stop()


if __name__ == "__main__":
    asyncio.run(main())
