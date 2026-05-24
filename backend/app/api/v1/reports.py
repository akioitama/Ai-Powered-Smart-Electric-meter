"""CSV exports."""

import csv
import io
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.alert import Alert
from app.models.meter import Meter
from app.models.reading import Reading
from app.models.user import User, UserRole

router = APIRouter()


def _check_owner(meter: Meter, user: User) -> None:
    if user.role != UserRole.ADMIN and meter.owner_user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get("/{meter_id}/readings.csv")
async def readings_csv(
    meter_id: int,
    days: int = Query(7, ge=1, le=365),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Meter).where(Meter.id == meter_id))
    meter = res.scalar_one_or_none()
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")
    _check_owner(meter, user)

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    res = await db.execute(
        select(Reading).where(Reading.meter_id == meter_id, Reading.ts >= cutoff).order_by(Reading.ts)
    )
    rows = list(res.scalars().all())

    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        [
            "timestamp",
            "voltage_v",
            "current_a",
            "power_w",
            "energy_kwh",
            "frequency_hz",
            "power_factor",
            "anomaly_score",
            "is_anomaly",
        ]
    )
    for r in rows:
        w.writerow(
            [
                r.ts.isoformat(),
                r.voltage,
                r.current,
                r.power,
                r.energy_kwh,
                r.frequency or "",
                r.power_factor or "",
                r.anomaly_score if r.anomaly_score is not None else "",
                r.is_anomaly,
            ]
        )
    buf.seek(0)
    fname = f"meter_{meter.meter_uid}_readings_{days}d.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )


@router.get("/{meter_id}/alerts.csv")
async def alerts_csv(
    meter_id: int,
    days: int = Query(30, ge=1, le=365),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Meter).where(Meter.id == meter_id))
    meter = res.scalar_one_or_none()
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")
    _check_owner(meter, user)

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    res = await db.execute(
        select(Alert).where(Alert.meter_id == meter_id, Alert.ts >= cutoff).order_by(Alert.ts)
    )
    rows = list(res.scalars().all())

    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["timestamp", "type", "severity", "value", "message", "acknowledged_at"])
    for a in rows:
        w.writerow(
            [
                a.ts.isoformat(),
                a.type.value,
                a.severity.value,
                a.value if a.value is not None else "",
                a.message,
                a.acknowledged_at.isoformat() if a.acknowledged_at else "",
            ]
        )
    buf.seek(0)
    fname = f"meter_{meter.meter_uid}_alerts_{days}d.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )
