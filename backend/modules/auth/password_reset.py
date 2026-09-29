"""
Forgot-password flow. Same shape as modules/auth/consent.py's OTP
pattern: only a hash of the reset token is ever stored, never the
plaintext, and it's cleared once used or replaced by a newer request.
"""

import logging
import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException

from core.email import send_email
from core.security import hash_password, pwd_context
from models.user import User

logger = logging.getLogger(__name__)

RESET_TOKEN_TTL_MINUTES = 60


def _now() -> datetime:
    # Naive UTC - see consent.py's _now() for why: DateTime columns come
    # back naive after a DB round trip, and comparing aware to naive
    # raises TypeError.
    return datetime.utcnow()


def issue_password_reset_token(user: User) -> None:
    """Generates a fresh reset token, stores its hash with a new expiry,
    and emails the plaintext token to the user. Does not commit - the
    caller commits."""
    token = secrets.token_urlsafe(32)

    user.password_reset_token_hash = pwd_context.hash(token)
    user.password_reset_expires_at = _now() + timedelta(minutes=RESET_TOKEN_TTL_MINUTES)

    send_email(
        to=user.email,
        subject="PathwayGH - Reset your password",
        body=(
            f"Someone requested a password reset for this PathwayGH account.\n\n"
            f"Your reset code is: {token}\n\n"
            f"This code expires in {RESET_TOKEN_TTL_MINUTES} minutes. "
            f"If you did not request this, you can ignore this email - your password will not change."
        ),
    )


def reset_password(user: User, token: str, new_password: str) -> None:
    """Raises HTTPException(400) on any failure to verify; on success,
    sets the new password and clears the pending reset state. Does not
    commit - the caller commits."""
    if not user.password_reset_token_hash or not user.password_reset_expires_at:
        raise HTTPException(status_code=400, detail="No pending password reset - request a new one")

    if _now() > user.password_reset_expires_at:
        raise HTTPException(status_code=400, detail="Reset code has expired - request a new one")

    if not pwd_context.verify(token, user.password_reset_token_hash):
        raise HTTPException(status_code=400, detail="Incorrect or invalid reset code")

    user.password_hash = hash_password(new_password)
    user.password_reset_token_hash = None
    user.password_reset_expires_at = None
