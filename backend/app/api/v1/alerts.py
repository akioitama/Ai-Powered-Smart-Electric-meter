"""Alerts endpoints."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.alert import Alert
from app.models.meter import Meter
from app.models.user import User, UserRole
from app.schemas.alert import AlertOut

router = APIRouter()


@router.get("/", response_model=list[AlertOut])
async def list_alerts(
    meter_id: int | None = Query(None),
    unack_only: bool = Query(False),
    limit: int = Query(100, ge=1, le=1000),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Alert).order_by(Alert.ts.desc()).limit(limit)
    if meter_id is not None:
        stmt = stmt.where(Alert.meter_id == meter_id)
    if user.role != UserRole.ADMIN:
        owned = select(Meter.id).where(Meter.owner_user_id == user.id)
        stmt = stmt.where(Alert.meter_id.in_(owned))
    if unack_only:
        stmt = stmt.where(Alert.acknowledged_at.is_(None))
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.patch("/{alert_id}/ack", response_model=AlertOut)
async def acknowledge_alert(
    alert_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = res.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if user.role != UserRole.ADMIN:
        m = await db.execute(select(Meter).where(Meter.id == alert.meter_id))
        meter = m.scalar_one_or_none()
        if not meter or meter.owner_user_id != user.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    alert.acknowledged_by = user.id
    alert.acknowledged_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(alert)
    return alert
