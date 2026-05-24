"""WebSocket endpoints (live readings + alerts to the browser)."""

import logging

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import decode_token
from app.models.meter import Meter
from app.models.user import User, UserRole
from app.services.ws_manager import ws_manager

router = APIRouter()
log = logging.getLogger("aimeter.ws")


async def _authorize(token: str, meter_id: int | None) -> bool:
    try:
        payload = decode_token(token)
    except Exception:  # noqa: BLE001
        return False
    user_id = int(payload.get("sub", 0))
    role = payload.get("role")
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.id == user_id))
        user = res.scalar_one_or_none()
        if not user or not user.is_active:
            return False
        if role == UserRole.ADMIN.value:
            return True
        if meter_id is None:
            return True
        m = await db.execute(select(Meter).where(Meter.id == meter_id))
        meter = m.scalar_one_or_none()
        return bool(meter and meter.owner_user_id == user.id)


@router.websocket("/ws/meters/{meter_id}")
async def meter_ws(websocket: WebSocket, meter_id: int, token: str = Query(...)):
    if not await _authorize(token, meter_id):
        await websocket.close(code=4401)
        return
    await ws_manager.connect(websocket, meter_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, meter_id)
    except Exception:  # noqa: BLE001
        await ws_manager.disconnect(websocket, meter_id)


@router.websocket("/ws/global")
async def global_ws(websocket: WebSocket, token: str = Query(...)):
    """Admin-only firehose."""
    if not await _authorize(token, None):
        await websocket.close(code=4401)
        return
    await ws_manager.connect(websocket, None)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, None)
    except Exception:  # noqa: BLE001
        await ws_manager.disconnect(websocket, None)
