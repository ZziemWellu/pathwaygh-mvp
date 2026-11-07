"""
Authentication Module Router
"""

import logging
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.accounts import find_user, normalize_username, username_taken
from core.database import get_db
from core.levels import level_from_grade
from core.phone import mask_phone, normalize_phone
from core.rate_limit import hit_per_account, limiter, user_or_ip
from core.security import create_access_token, get_current_user, hash_password, verify_password
from models.user import User
from modules.auth.consent import can_resend, issue_consent_otp, verify_consent_otp
from modules.auth.password_reset import issue_password_reset_token, reset_password
from modules.practice_sms.providers import sms_available

router = APIRouter(tags=["auth"])
logger = logging.getLogger(__name__)


class RegisterRequest(BaseModel):
    # One of these two is required - see register().
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    country: Literal["GH", "NG", "SL", "LR", "GM"]
    level: Literal["primary", "jhs", "shs"]
    grade: Optional[str] = Field(default=None, max_length=50)
    consent_confirmed: bool
    # At least one is required - see register().
    guardian_email: Optional[EmailStr] = None
    guardian_phone: Optional[str] = None

    @field_validator("email", "username", "grade", "guardian_email", "guardian_phone", mode="before")
    @classmethod
    def _blank_is_none(cls, value):
        return (value.strip() or None) if isinstance(value, str) else value


class LoginRequest(BaseModel):
    # An email or a username. "email" is kept for app versions already out there.
    identifier: Optional[str] = None
    email: Optional[str] = None
    password: str

    @property
    def account(self) -> str:
        return (self.identifier or self.email or "").strip()


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class ConsentOtpRequest(BaseModel):
    code: str


class ForgotPasswordRequest(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None

    @property
    def account(self) -> str:
        return (self.identifier or self.email or "").strip()


class ResetPasswordRequest(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None
    token: str
    new_password: str = Field(min_length=8, max_length=128)

    @property
    def account(self) -> str:
        return (self.identifier or self.email or "").strip()


def _user_out(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "must_change_password": bool(user.must_change_password),
        "full_name": user.full_name,
        "is_admin": user.is_admin,
        "is_school_admin": user.is_school_admin,
        "school_id": user.school_id,
        "country": user.country,
        "level": user.level,
        "grade": user.grade,
        "guardian_email": user.guardian_email,
        "guardian_phone_masked": mask_phone(user.guardian_phone) if user.guardian_phone else None,
        "consent_verified": user.consent_given_at is not None,
    }


@router.get("/")
def auth_root():
    return {"module": "auth", "status": "active"}


@router.get("/consent-channels")
def consent_channels(country: Literal["GH", "NG", "SL", "LR", "GM"]):
    """Tells the sign-up form whether a parent can get the code by SMS in
    this country, or must give an email instead."""
    return {"success": True, "sms": sms_available(country), "email": True}


@router.post("/register")
@limiter.limit("60/hour")
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    if not body.consent_confirmed:
        raise HTTPException(status_code=400, detail="You must confirm the age/consent statement to register")
    email = body.email.strip().lower() if body.email else None
    guardian_email = body.guardian_email.strip().lower() if body.guardian_email else None
    if not email and not body.username:
        raise HTTPException(status_code=400, detail="Please give an email or choose a username")
    username = None
    if body.username:
        try:
            username = normalize_username(body.username)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
    if body.grade and level_from_grade(body.grade) != body.level:
        raise HTTPException(status_code=400, detail="Your class doesn't match the level you chose")
    if email and guardian_email == email:
        raise HTTPException(status_code=400, detail="Guardian email must be different from your own email")
    if not guardian_email and not body.guardian_phone:
        raise HTTPException(status_code=400, detail="Please give your parent or guardian's phone number or email")

    guardian_phone = None
    if body.guardian_phone:
        try:
            guardian_phone = normalize_phone(body.guardian_phone, body.country)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
    if not guardian_email and not sms_available(body.country):
        raise HTTPException(
            status_code=400,
            detail="We can't send text messages to your country yet - please give your parent or guardian's email",
        )

    # One email is one account, with one country and one level. The message
    # deliberately doesn't say which country or level the account has - anyone
    # can try any address here, and that's a child's information.
    duplicate_detail = (
        "This email already has an account. An email can only be used once, "
        "for one country and one level. Please sign in, or use a different email."
    )
    if email and find_user(db, email):
        raise HTTPException(status_code=400, detail=duplicate_detail)
    if username and username_taken(db, username):
        raise HTTPException(status_code=400, detail="That username is taken - please try another")

    user = User(
        email=email,
        username=username,
        grade=body.grade,
        full_name=body.full_name,
        password_hash=hash_password(body.password),
        country=body.country,
        level=body.level,
        guardian_email=guardian_email,
        guardian_phone=guardian_phone,
    )
    issue_consent_otp(user)
    db.add(user)
    try:
        db.commit()
    except IntegrityError as e:
        # Two sign-ups racing with the same email; the unique index decides.
        db.rollback()
        raise HTTPException(status_code=400, detail=duplicate_detail) from e
    db.refresh(user)

    token = create_access_token(user.id, user.token_version or 0)
    return {"success": True, "token": token, "user": _user_out(user)}


@router.post("/login")
@limiter.limit("60/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    hit_per_account("10/minute", "login", body.account)
    user = find_user(db, body.account)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id, user.token_version or 0)
    return {"success": True, "token": token, "user": _user_out(user)}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"success": True, "user": _user_out(current_user)}


@router.post("/verify-consent")
@limiter.limit("10/hour", key_func=user_or_ip)
def verify_consent(
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
@limiter.limit("3/hour", key_func=user_or_ip)
def resend_consent(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.guardian_email and not current_user.guardian_phone:
        raise HTTPException(status_code=400, detail="No guardian phone or email on file")
    if current_user.consent_given_at is not None:
        raise HTTPException(status_code=400, detail="Consent is already verified")
    if not can_resend(current_user):
        raise HTTPException(status_code=400, detail="Please wait a moment before requesting another code")

    issue_consent_otp(current_user)
    db.commit()
    return {"success": True}


@router.post("/change-password")
@limiter.limit("10/hour", key_func=user_or_ip)
def change_password(
    request: Request,
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Your current password isn't right")
    if body.new_password == body.current_password:
        raise HTTPException(status_code=400, detail="Please choose a different password from the one you have now")
    current_user.password_hash = hash_password(body.new_password)
    current_user.must_change_password = False
    # Signs out every other session, then hands this one a new token.
    current_user.token_version = (current_user.token_version or 0) + 1
    db.commit()
    db.refresh(current_user)
    return {"success": True, "token": create_access_token(current_user.id, current_user.token_version), "user": _user_out(current_user)}


@router.post("/forgot-password")
@limiter.limit("20/hour")
def forgot_password(request: Request, body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    hit_per_account("5/hour", "forgot-password", body.account)
    user = find_user(db, body.account)
    # Always return the same generic response whether or not the email
    # exists - a different response would let anyone enumerate which
    # emails are registered.
    if user:
        try:
            issue_password_reset_token(user)
        except HTTPException:
            # An SMS cap was hit. Saying so would reveal the account exists.
            logger.warning("Password reset code not sent: SMS limit reached")
        db.commit()
    return {
        "success": True,
        "message": "If that account exists, a reset code has been sent to its email, or to the parent or guardian.",
    }


@router.post("/reset-password")
@limiter.limit("30/hour")
def reset_password_endpoint(request: Request, body: ResetPasswordRequest, db: Session = Depends(get_db)):
    hit_per_account("10/hour", "reset-password", body.account)
    user = find_user(db, body.account)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect or invalid reset code")
    reset_password(user, body.token, body.new_password)
    user.must_change_password = False
    db.commit()
    return {"success": True, "message": "Password has been reset - you can now log in."}
