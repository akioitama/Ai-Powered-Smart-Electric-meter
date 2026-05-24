"""Alert + relay-event creation helpers."""

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert, AlertSeverity, AlertType
from app.models.meter import Meter
from app.models.relay_event import RelayAction, RelayEvent, RelaySource
from app.services.redis_bus import CHANNEL_ALERT, CHANNEL_RELAY, publish


async def create_alert(
    db: AsyncSession,
    meter: Meter,
    type_: AlertType,
    severity: AlertSeverity,
    message: str,
    value: float | None = None,
) -> Alert:
    alert = Alert(
        meter_id=meter.id,
        type=type_,
        severity=severity,
        value=value,
        message=message,
    )
    db.add(alert)
    await db.flush()
    await db.commit()
    await db.refresh(alert)

    await publish(
        CHANNEL_ALERT,
        {
            "meter_id": meter.id,
            "meter_uid": meter.meter_uid,
            "id": alert.id,
            "ts": alert.ts.isoformat() if alert.ts else datetime.now(timezone.utc).isoformat(),
            "type": alert.type.value,
            "severity": alert.severity.value,
            "value": alert.value,
            "message": alert.message,
        },
    )
    return alert


async def record_relay_event(
    db: AsyncSession,
    meter: Meter,
    action: RelayAction,
    source: RelaySource,
    requested_by_user_id: int | None = None,
    note: str | None = None,
    success: bool = True,
) -> RelayEvent:
    event = RelayEvent(
        meter_id=meter.id,
        action=action,
        source=source,
        requested_by_user_id=requested_by_user_id,
        success=success,
        note=note,
    )
    db.add(event)
    meter.relay_state = action == RelayAction.ON
    await db.commit()
    await db.refresh(event)

    await publish(
        CHANNEL_RELAY,
        {
            "meter_id": meter.id,
            "meter_uid": meter.meter_uid,
            "id": event.id,
            "ts": event.ts.isoformat() if event.ts else datetime.now(timezone.utc).isoformat(),
            "action": event.action.value,
            "source": event.source.value,
            "relay_state": meter.relay_state,
        },
    )
    return event
