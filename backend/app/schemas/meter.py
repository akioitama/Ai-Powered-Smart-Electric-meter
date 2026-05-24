from datetime import datetime

from pydantic import BaseModel, Field


class MeterCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    location: str | None = None
    owner_user_id: int | None = None
    low_v_threshold: float = 200.0
    high_v_threshold: float = 250.0


class MeterUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    owner_user_id: int | None = None
    low_v_threshold: float | None = None
    high_v_threshold: float | None = None


class MeterOut(BaseModel):
    id: int
    meter_uid: str
    name: str
    location: str | None
    owner_user_id: int | None
    low_v_threshold: float
    high_v_threshold: float
    relay_state: bool
    online: bool
    firmware_version: str | None
    last_seen: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class MeterCreateResponse(MeterOut):
    """Returned once on creation — includes the plaintext access token."""

    access_token: str
