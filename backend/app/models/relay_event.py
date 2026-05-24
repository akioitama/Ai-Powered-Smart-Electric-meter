"""Relay event audit (UC-4)."""

from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RelayAction(str, Enum):
    ON = "on"
    OFF = "off"


class RelaySource(str, Enum):
    USER = "user"
    ADMIN = "admin"
    AI_AUTO = "ai_auto"
    THRESHOLD_AUTO = "threshold_auto"
    SYSTEM = "system"


class RelayEvent(Base):
    __tablename__ = "relay_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meter_id: Mapped[int] = mapped_column(
        ForeignKey("meters.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ts: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    action: Mapped[RelayAction] = mapped_column(
        SAEnum(RelayAction, name="relay_action"), nullable=False
    )
    source: Mapped[RelaySource] = mapped_column(
        SAEnum(RelaySource, name="relay_source"), default=RelaySource.SYSTEM, nullable=False
    )
    requested_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    success: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)

    meter = relationship("Meter", back_populates="relay_events")
