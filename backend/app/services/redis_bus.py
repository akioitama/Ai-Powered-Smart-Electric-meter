"""Pub/sub bus — Redis when configured, otherwise an in-process asyncio bus.

The MQTT worker → API → WebSocket gateway path goes through this.
For zero-setup local dev (no Redis), `REDIS_URL` is left empty and we fall
back to an in-process bus that works as long as everything runs in one
Python process.
"""

import asyncio
import json
import logging
from collections import defaultdict
from typing import Any, AsyncIterator

from app.core.config import settings

log = logging.getLogger("aimeter.bus")

CHANNEL_READING = "aimeter:readings"
CHANNEL_ALERT = "aimeter:alerts"
CHANNEL_RELAY = "aimeter:relay"
CHANNEL_STATUS = "aimeter:status"


class _InProcessBus:
    def __init__(self) -> None:
        self._subs: dict[str, set[asyncio.Queue]] = defaultdict(set)

    async def publish(self, channel: str, payload: dict[str, Any]) -> None:
        for q in list(self._subs.get(channel, set())):
            try:
                q.put_nowait((channel, payload))
            except asyncio.QueueFull:
                pass

    async def subscribe(self, *channels: str) -> AsyncIterator[tuple[str, dict]]:
        q: asyncio.Queue = asyncio.Queue(maxsize=1024)
        for ch in channels:
            self._subs[ch].add(q)
        try:
            while True:
                ch, payload = await q.get()
                yield ch, payload
        finally:
            for ch in channels:
                self._subs[ch].discard(q)


_inproc = _InProcessBus()


def _use_redis() -> bool:
    return bool(settings.REDIS_URL)


async def publish(channel: str, payload: dict[str, Any]) -> None:
    if _use_redis():
        try:
            import redis.asyncio as aioredis  # noqa: WPS433

            r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            try:
                await r.publish(channel, json.dumps(payload, default=str))
            finally:
                await r.aclose()
            return
        except Exception as e:  # noqa: BLE001
            log.warning("Redis publish failed (%s); falling back to in-process.", e)
    await _inproc.publish(channel, payload)


async def subscribe(*channels: str):
    """Async generator yielding (channel, payload) tuples."""
    if _use_redis():
        try:
            import redis.asyncio as aioredis  # noqa: WPS433

            r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            pubsub = r.pubsub()
            await pubsub.subscribe(*channels)
            try:
                async for msg in pubsub.listen():
                    if msg["type"] != "message":
                        continue
                    try:
                        data = json.loads(msg["data"])
                    except json.JSONDecodeError:
                        continue
                    yield msg["channel"], data
            finally:
                await pubsub.unsubscribe(*channels)
                await pubsub.aclose()
                await r.aclose()
            return
        except Exception as e:  # noqa: BLE001
            log.warning("Redis subscribe failed (%s); falling back to in-process.", e)

    async for item in _inproc.subscribe(*channels):
        yield item
