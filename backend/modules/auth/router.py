"""
Authentication Module Router
"""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from core.database import get_db
from core.rate_limit import limiter
from core.security import create_access_token, get_current_user, hash_password, verify_password
from models.user import User
from modules.auth.consent import can_resend, issue_consent_otp, verify_consent_otp

router = APIRouter(tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    country: Literal["GH", "NG"]
    consent_confirmed: bool
    guardian_email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ConsentOtpRequest(BaseModel):
    code: str


def _user_out(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_admin": user.is_admin,
        "is_school_admin": user.is_school_admin,
        "school_id": user.school_id,
        "country": user.country,
        "guardian_email": user.guardian_email,
        "consent_verified": user.consent_given_at is not None,
    }


@router.get("/")
async def auth_root():
    return {"module": "auth", "status": "active"}


@router.post("/register")
@limiter.limit("20/hour")
async def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    if not body.consent_confirmed:
        raise HTTPException(status_code=400, detail="You must confirm the age/consent statement to register")
    if body.guardian_email == body.email:
        raise HTTPException(status_code=400, detail="Guardian email must be different from your own email")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        full_name=body.full_name,
        password_hash=hash_password(body.password),
        country=body.country,
        guardian_email=body.guardian_email,
    )
    issue_consent_otp(user)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return {"success": True, "token": token, "user": _user_out(user)}


@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    return {"success": True, "token": token, "user": _user_out(user)}


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {"success": True, "user": _user_out(current_user)}


@router.post("/verify-consent")
@limiter.limit("10/hour")
async def verify_consent(
    request: Request,
    body: ConsentOtpRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_consent_otp(current_user, body.code)
    db.commit()
    db.refresh(current_user)
    return {"success": True, "user": _user_out(current_user)}


@router.post("/resend-consent")
@limiter.limit("3/hour")
async def resend_consent(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.guardian_email:
        raise HTTPException(status_code=400, detail="No guardian email on file")
    if current_user.consent_given_at is not None:
        raise HTTPException(status_code=400, detail="Consent is already verified")
    if not can_resend(current_user):
        raise HTTPException(status_code=400, detail="Please wait a moment before requesting another code")

    issue_consent_otp(current_user)
    db.commit()
    return {"success": True}
