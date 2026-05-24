"""Meter provisioning + management."""

import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    get_current_user,
    hash_password,
    require_admin,
)
from app.models.meter import Meter
from app.models.user import User, UserRole
from app.schemas.meter import (
    MeterCreate,
    MeterCreateResponse,
    MeterOut,
    MeterUpdate,
)
from app.services.mqtt_client import mqtt_service

router = APIRouter()


def _generate_uid() -> str:
    return f"mtr_{secrets.token_hex(6)}"


def _generate_token() -> str:
    return secrets.token_urlsafe(32)


@router.get("/", response_model=list[MeterOut])
async def list_meters(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Meter).order_by(Meter.id.desc())
    if user.role != UserRole.ADMIN:
        stmt = stmt.where(Meter.owner_user_id == user.id)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.post(
    "/",
    response_model=MeterCreateResponse,
    status_code=201,
    dependencies=[Depends(require_admin)],
)
async def create_meter(payload: MeterCreate, db: AsyncSession = Depends(get_db)):
    token = _generate_token()
    meter = Meter(
        meter_uid=_generate_uid(),
        name=payload.name,
        location=payload.location,
        owner_user_id=payload.owner_user_id,
        access_token_hash=hash_password(token),
        low_v_threshold=payload.low_v_threshold,
        high_v_threshold=payload.high_v_threshold,
    )
    db.add(meter)
    await db.commit()
    await db.refresh(meter)
    return MeterCreateResponse(
        id=meter.id,
        meter_uid=meter.meter_uid,
        name=meter.name,
        location=meter.location,
        owner_user_id=meter.owner_user_id,
        low_v_threshold=meter.low_v_threshold,
        high_v_threshold=meter.high_v_threshold,
        relay_state=meter.relay_state,
        online=meter.online,
        firmware_version=meter.firmware_version,
        last_seen=meter.last_seen,
        created_at=meter.created_at,
        access_token=token,
    )


async def _get_meter_for_user(meter_id: int, user: User, db: AsyncSession) -> Meter:
    res = await db.execute(select(Meter).where(Meter.id == meter_id))
    meter = res.scalar_one_or_none()
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")
    if user.role != UserRole.ADMIN and meter.owner_user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your meter")
    return meter


@router.get("/{meter_id}", response_model=MeterOut)
async def get_meter(
    meter_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_meter_for_user(meter_id, user, db)


@router.patch("/{meter_id}", response_model=MeterOut)
async def update_meter(
    meter_id: int,
    payload: MeterUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    meter = await _get_meter_for_user(meter_id, user, db)

    if payload.name is not None:
        meter.name = payload.name
    if payload.location is not None:
        meter.location = payload.location
    if payload.owner_user_id is not None:
        if user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Only admins reassign owners")
        meter.owner_user_id = payload.owner_user_id
    if payload.low_v_threshold is not None:
        meter.low_v_threshold = payload.low_v_threshold
    if payload.high_v_threshold is not None:
        meter.high_v_threshold = payload.high_v_threshold

    await db.commit()
    await db.refresh(meter)

    if payload.low_v_threshold is not None or payload.high_v_threshold is not None:
        mqtt_service.send_config(meter.meter_uid, meter.low_v_threshold, meter.high_v_threshold)
    return meter


@router.delete("/{meter_id}", status_code=204, dependencies=[Depends(require_admin)])
async def delete_meter(meter_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Meter).where(Meter.id == meter_id))
    meter = res.scalar_one_or_none()
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")
    await db.delete(meter)
    await db.commit()


@router.post(
    "/{meter_id}/rotate-token",
    response_model=MeterCreateResponse,
    dependencies=[Depends(require_admin)],
)
async def rotate_token(meter_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Meter).where(Meter.id == meter_id))
    meter = res.scalar_one_or_none()
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")
    new_token = _generate_token()
    meter.access_token_hash = hash_password(new_token)
    await db.commit()
    await db.refresh(meter)
    return MeterCreateResponse(
        id=meter.id,
        meter_uid=meter.meter_uid,
        name=meter.name,
        location=meter.location,
        owner_user_id=meter.owner_user_id,
        low_v_threshold=meter.low_v_threshold,
        high_v_threshold=meter.high_v_threshold,
        relay_state=meter.relay_state,
        online=meter.online,
        firmware_version=meter.firmware_version,
        last_seen=meter.last_seen,
        created_at=meter.created_at,
        access_token=new_token,
    )
