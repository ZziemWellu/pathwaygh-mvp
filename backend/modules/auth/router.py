"""
Authentication Module Router
"""

from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import create_access_token, get_current_user, hash_password, verify_password
from models.user import User

router = APIRouter(tags=["auth"])

CURRENT_CONSENT_VERSION = "2026-09-v1"


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    country: Literal["GH", "NG"]
    consent_confirmed: bool
    guardian_email: Optional[EmailStr] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def _user_out(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_admin": user.is_admin,
        "is_school_admin": user.is_school_admin,
        "school_id": user.school_id,
        "country": user.country,
    }


@router.get("/")
async def auth_root():
    return {"module": "auth", "status": "active"}


@router.post("/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    if not request.consent_confirmed:
        raise HTTPException(status_code=400, detail="You must confirm the age/consent statement to register")
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=request.email,
        full_name=request.full_name,
        password_hash=hash_password(request.password),
        country=request.country,
        guardian_email=request.guardian_email,
        consent_given_at=datetime.now(timezone.utc),
        consent_version=CURRENT_CONSENT_VERSION,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return {"success": True, "token": token, "user": _user_out(user)}


@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    return {"success": True, "token": token, "user": _user_out(user)}


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {"success": True, "user": _user_out(current_user)}
