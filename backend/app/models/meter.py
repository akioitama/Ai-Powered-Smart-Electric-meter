"""SmartMeter model."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Meter(Base):
    __tablename__ = "meters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meter_uid: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)

    owner_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    access_token_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    low_v_threshold: Mapped[float] = mapped_column(Float, default=200.0, nullable=False)
    high_v_threshold: Mapped[float] = mapped_column(Float, default=250.0, nullable=False)

    relay_state: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    online: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    firmware_version: Mapped[str | None] = mapped_column(String(40), nullable=True)
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    owner = relationship("User", back_populates="meters")
    readings = relationship("Reading", back_populates="meter", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="meter", cascade="all, delete-orphan")
    relay_events = relationship(
        "RelayEvent", back_populates="meter", cascade="all, delete-orphan"
    )
    bills = relationship("Bill", back_populates="meter", cascade="all, delete-orphan")
