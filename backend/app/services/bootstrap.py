"""Bootstrap helpers (auto-create tables for SQLite, default admin user)."""

import logging

from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.security import hash_password

# Import all models so Base.metadata is fully populated.
from app.models import (  # noqa: F401
    alert,
    audit_log,
    bill,
    meter,
    reading,
    relay_event,
    user,
)
from app.models.user import User, UserRole

log = logging.getLogger("aimeter.bootstrap")


async def ensure_schema() -> None:
    """Auto-create tables when running on SQLite / fresh dev DB."""
    if not settings.AUTO_CREATE_TABLES:
        return
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("Schema ensured (create_all).")


async def bootstrap_admin() -> None:
    await ensure_schema()
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.role == UserRole.ADMIN))
        existing = res.scalar_one_or_none()
        if existing:
            return
        admin = User(
            email=settings.ADMIN_EMAIL,
            name=settings.ADMIN_NAME,
            password_hash=hash_password(settings.ADMIN_PASSWORD),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        log.info("Bootstrapped default admin user: %s", settings.ADMIN_EMAIL)
