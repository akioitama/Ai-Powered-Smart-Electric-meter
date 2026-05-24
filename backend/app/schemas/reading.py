from datetime import datetime

from pydantic import BaseModel, Field


class ReadingIn(BaseModel):
    ts: datetime | None = None
    voltage: float
    current: float
    power: float | None = None
    energy_kwh: float = 0.0
    frequency: float | None = None
    power_factor: float | None = None


class ReadingOut(BaseModel):
    id: int
    meter_id: int
    ts: datetime
    voltage: float
    current: float
    power: float
    energy_kwh: float
    frequency: float | None
    power_factor: float | None
    anomaly_score: float | None
    is_anomaly: int

    class Config:
        from_attributes = True


class IngestBatch(BaseModel):
    meter_uid: str
    token: str
    readings: list[ReadingIn] = Field(default_factory=list)
