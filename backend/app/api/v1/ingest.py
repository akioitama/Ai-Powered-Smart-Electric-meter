"""HTTP fallback ingestion (used when MQTT is unavailable / offline buffer flush)."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_password
from app.models.meter import Meter
from app.schemas.reading import IngestBatch
from app.workers.mqtt_worker import handle_reading

router = APIRouter()
log = logging.getLogger("aimeter.ingest")


@router.post("/readings")
async def ingest_readings(
    payload: IngestBatch,
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Meter).where(Meter.meter_uid == payload.meter_uid))
    meter = res.scalar_one_or_none()
    if not meter or not verify_password(payload.token, meter.access_token_hash):
        raise HTTPException(status_code=401, detail="Invalid meter credentials")

    for r in payload.readings:
        await handle_reading(
            payload.meter_uid,
            {
                "ts": r.ts.isoformat() if r.ts else None,
                "voltage": r.voltage,
                "current": r.current,
                "power": r.power if r.power is not None else r.voltage * r.current,
                "energy_kwh": r.energy_kwh,
                "frequency": r.frequency,
                "power_factor": r.power_factor,
            },
        )
    return {"accepted": len(payload.readings)}
