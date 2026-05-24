"""WebSocket connection manager — fans out Redis events to browsers per meter."""

import asyncio
import logging
from collections import defaultdict

from fastapi import WebSocket

from app.services.redis_bus import (
    CHANNEL_ALERT,
    CHANNEL_READING,
    CHANNEL_RELAY,
    CHANNEL_STATUS,
    subscribe,
)

log = logging.getLogger("aimeter.ws")


class WSManager:
    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)
        self._global: set[WebSocket] = set()
        self._lock = asyncio.Lock()
        self._task: asyncio.Task | None = None

    async def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._listen(), name="ws_redis_listener")
            log.info("WSManager Redis listener started.")

    async def stop(self) -> None:
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        log.info("WSManager stopped.")

    async def connect(self, ws: WebSocket, meter_id: int | None = None) -> None:
        await ws.accept()
        async with self._lock:
            if meter_id is None:
                self._global.add(ws)
            else:
                self._connections[meter_id].add(ws)

    async def disconnect(self, ws: WebSocket, meter_id: int | None = None) -> None:
        async with self._lock:
            if meter_id is None:
                self._global.discard(ws)
            else:
                self._connections[meter_id].discard(ws)

    async def _broadcast(self, payload: dict, meter_id: int | None) -> None:
        targets: list[WebSocket] = list(self._global)
        if meter_id is not None:
            targets.extend(self._connections.get(meter_id, set()))
        dead: list[WebSocket] = []
        for ws in targets:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._global.discard(ws)
            for s in self._connections.values():
                s.discard(ws)

    async def _listen(self) -> None:
        channels = [CHANNEL_READING, CHANNEL_ALERT, CHANNEL_RELAY, CHANNEL_STATUS]
        log.info("WSManager subscribing to %s", channels)
        while True:
            try:
                async for channel, data in subscribe(*channels):
                    meter_id = data.get("meter_id")
                    msg_type = {
                        CHANNEL_READING: "reading",
                        CHANNEL_ALERT: "alert",
                        CHANNEL_RELAY: "relay",
                        CHANNEL_STATUS: "status",
                    }.get(channel, "event")
                    await self._broadcast({"type": msg_type, "data": data}, meter_id)
            except asyncio.CancelledError:
                raise
            except Exception as e:  # noqa: BLE001
                log.warning("WS listener error: %s — reconnecting in 2s", e)
                await asyncio.sleep(2)


ws_manager = WSManager()
