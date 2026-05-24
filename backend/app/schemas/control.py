from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.models.relay_event import RelayAction, RelaySource


class RelayCommand(BaseModel):
    action: Literal["on", "off"]
    note: str | None = None


class RelayEventOut(BaseModel):
    id: int
    meter_id: int
    ts: datetime
    action: RelayAction
    source: RelaySource
    requested_by_user_id: int | None
    success: bool
    note: str | None

    class Config:
        from_attributes = True
