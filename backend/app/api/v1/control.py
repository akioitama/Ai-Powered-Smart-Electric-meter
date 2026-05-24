"""Relay control endpoints (UC-4)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.meter import Meter
from app.models.relay_event import RelayAction, RelayEvent, RelaySource
from app.models.user import User, UserRole
from app.schemas.control import RelayCommand, RelayEventOut
from app.services.alert_service import record_relay_event
from app.services.mqtt_client import mqtt_service

router = APIRouter()


@router.post("/{meter_id}/relay", response_model=RelayEventOut)
async def relay_command(
    meter_id: int,
    payload: RelayCommand,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Meter).where(Meter.id == meter_id))
    meter = res.scalar_one_or_none()
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")
    if user.role != UserRole.ADMIN and meter.owner_user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    success = mqtt_service.send_relay_command(meter.meter_uid, payload.action, payload.note)
    source = RelaySource.ADMIN if user.role == UserRole.ADMIN else RelaySource.USER
    event = await record_relay_event(
        db,
        meter,
        RelayAction(payload.action),
        source,
        requested_by_user_id=user.id,
        note=payload.note,
        success=success,
    )
    return event


@router.get("/{meter_id}/relay/history", response_model=list[RelayEventOut])
async def relay_history(
    meter_id: int,
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Meter).where(Meter.id == meter_id))
    meter = res.scalar_one_or_none()
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")
    if user.role != UserRole.ADMIN and meter.owner_user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    res = await db.execute(
        select(RelayEvent)
        .where(RelayEvent.meter_id == meter_id)
        .order_by(RelayEvent.ts.desc())
        .limit(limit)
    )
    return list(res.scalars().all())
