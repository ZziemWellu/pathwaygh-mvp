"""
OTP-verified guardian consent. A student's guardian_email is only
considered a real, usable channel for parental consent once a one-time
code sent to it has been confirmed - not merely typed into a form.

Shared between the registration flow and the profile-update flow (a
guardian_email change always requires re-verification), same shared-
service pattern as modules/practice/mastery.py and
modules/tutor/grounding.py.
"""

import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from core.email import send_email
from core.security import pwd_context
from models.user import User

logger = logging.getLogger(__name__)

CURRENT_CONSENT_VERSION = "2026-09-v1"
OTP_TTL_MINUTES = 15
MAX_OTP_ATTEMPTS = 5
RESEND_COOLDOWN_SECONDS = 60


def _now() -> datetime:
    # Naive UTC, not timezone-aware: the DateTime columns these values are
    # compared against (consent_otp_expires_at, consent_otp_sent_at) come
    # back from the DB as naive datetimes after a round trip (confirmed
    # against SQLite - a tz-aware value stored and re-queried loses its
    # tzinfo), and comparing an aware value to a naive one raises
    # TypeError. consent_given_at deliberately stays tz-aware to match
    # its existing convention elsewhere - it's write-only here, never
    # compared against.
    return datetime.utcnow()


def issue_consent_otp(user: User) -> None:
    """Generates a fresh 6-digit code, stores its hash (never the
    plaintext) with a new expiry, resets the attempt counter, and emails
    it to the guardian. Does not commit - the caller commits alongside
    whatever else it changed (registration, or a profile update), same
    convention as record_topic_attempt in mastery.py."""
    code = f"{secrets.randbelow(1_000_000):06d}"

    user.consent_otp_hash = pwd_context.hash(code)
    user.consent_otp_expires_at = _now() + timedelta(minutes=OTP_TTL_MINUTES)
    user.consent_otp_attempts = 0
    user.consent_otp_sent_at = _now()

    send_email(
        to=user.guardian_email,
        subject="PathwayGH - Confirm parental consent",
        body=(
            f"{user.full_name} has registered on PathwayGH and listed you as their guardian.\n\n"
            f"Your verification code is: {code}\n\n"
            f"This code expires in {OTP_TTL_MINUTES} minutes. If you did not expect this, you can ignore this email."
        ),
    )


def can_resend(user: User) -> bool:
    if not user.consent_otp_sent_at:
        return True
    elapsed = (_now() - user.consent_otp_sent_at).total_seconds()
    return elapsed >= RESEND_COOLDOWN_SECONDS


def verify_consent_otp(user: User, code: str) -> None:
    """Raises HTTPException(400) on any failure to verify; on success,
    stamps consent_given_at/consent_version and clears the pending OTP
    state. Does not commit - the caller commits."""
    if not user.consent_otp_hash or not user.consent_otp_expires_at:
        raise HTTPException(status_code=400, detail="No pending verification code - request a new one")

    if _now() > user.consent_otp_expires_at:
        raise HTTPException(status_code=400, detail="Verification code has expired - request a new one")

    if user.consent_otp_attempts >= MAX_OTP_ATTEMPTS:
        raise HTTPException(status_code=400, detail="Too many incorrect attempts - request a new code")

    if not pwd_context.verify(code, user.consent_otp_hash):
        user.consent_otp_attempts += 1
        raise HTTPException(status_code=400, detail="Incorrect code")

    user.consent_given_at = datetime.now(timezone.utc)
    user.consent_version = CURRENT_CONSENT_VERSION
    user.consent_otp_hash = None
    user.consent_otp_expires_at = None
    user.consent_otp_attempts = 0
    user.consent_otp_sent_at = None
