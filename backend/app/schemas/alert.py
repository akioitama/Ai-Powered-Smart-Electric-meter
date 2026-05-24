from datetime import datetime

from pydantic import BaseModel

from app.models.alert import AlertSeverity, AlertType


class AlertOut(BaseModel):
    id: int
    meter_id: int
    ts: datetime
    type: AlertType
    severity: AlertSeverity
    value: float | None
    message: str
    acknowledged_by: int | None
    acknowledged_at: datetime | None

    class Config:
        from_attributes = True
