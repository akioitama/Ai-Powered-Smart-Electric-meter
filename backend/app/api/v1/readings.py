"""Readings endpoints (per meter)."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.meter import Meter
from app.models.reading import Reading
from app.models.user import User, UserRole
from app.schemas.reading import ReadingOut

router = APIRouter()


async def _meter_or_403(meter_id: int, user: User, db: AsyncSession) -> Meter:
    res = await db.execute(select(Meter).where(Meter.id == meter_id))
    meter = res.scalar_one_or_none()
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")
    if user.role != UserRole.ADMIN and meter.owner_user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your meter")
    return meter


@router.get("/{meter_id}/readings", response_model=list[ReadingOut])
async def list_readings(
    meter_id: int,
    hours: int = Query(24, ge=1, le=24 * 30),
    limit: int = Query(500, ge=1, le=5000),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _meter_or_403(meter_id, user, db)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    res = await db.execute(
        select(Reading)
        .where(Reading.meter_id == meter_id, Reading.ts >= cutoff)
        .order_by(Reading.ts.desc())
        .limit(limit)
    )
    rows = list(res.scalars().all())
    rows.reverse()
    return rows


@router.get("/{meter_id}/readings/latest", response_model=ReadingOut)
async def latest_reading(
    meter_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _meter_or_403(meter_id, user, db)
    res = await db.execute(
        select(Reading).where(Reading.meter_id == meter_id).order_by(Reading.ts.desc()).limit(1)
    )
    row = res.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="No readings yet")
    return row


@router.get("/{meter_id}/readings/summary")
async def readings_summary(
    meter_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _meter_or_403(meter_id, user, db)
    cutoff_24 = datetime.now(timezone.utc) - timedelta(hours=24)
    cutoff_7d = datetime.now(timezone.utc) - timedelta(days=7)
    cutoff_30d = datetime.now(timezone.utc) - timedelta(days=30)

    from sqlalchemy import func

    async def _agg(cutoff):
        res = await db.execute(
            select(
                func.coalesce(func.sum(Reading.energy_kwh), 0.0),
                func.coalesce(func.avg(Reading.power), 0.0),
                func.coalesce(func.max(Reading.power), 0.0),
                func.coalesce(func.avg(Reading.voltage), 0.0),
                func.count(Reading.id),
            ).where(Reading.meter_id == meter_id, Reading.ts >= cutoff)
        )
        e, avg_p, max_p, avg_v, n = res.one()
        return {
            "energy_kwh": float(e),
            "avg_power": float(avg_p),
            "peak_power": float(max_p),
            "avg_voltage": float(avg_v),
            "samples": int(n),
        }

    return {
        "last_24h": await _agg(cutoff_24),
        "last_7d": await _agg(cutoff_7d),
        "last_30d": await _agg(cutoff_30d),
    }
