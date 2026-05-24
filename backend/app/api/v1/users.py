"""User management endpoints (admin)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.models.user import User, UserRole
from app.schemas.auth import UserOut

router = APIRouter()


@router.get("/", response_model=list[UserOut], dependencies=[Depends(require_admin)])
async def list_users(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).order_by(User.id.desc()))
    return list(res.scalars().all())


@router.patch("/{user_id}/role", response_model=UserOut, dependencies=[Depends(require_admin)])
async def update_role(user_id: int, role: UserRole, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/{user_id}/active", response_model=UserOut, dependencies=[Depends(require_admin)])
async def update_active(user_id: int, is_active: bool, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = is_active
    await db.commit()
    await db.refresh(user)
    return user
