"""
OTP-verified guardian consent. A guardian's email or phone is only
considered a real, usable channel for parental consent once a one-time
code sent to it has been confirmed - not merely typed into a form. Many
parents have a phone but no email, so the code goes by SMS, by email, or
both when both are on file.

Shared between the registration flow and the profile-update flow (a
guardian_email change always requires re-verification), same shared-
service pattern as modules/practice/mastery.py and
modules/tutor/grounding.py.
"""

import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from core.email import send_email
from core.rate_limit import hit_per_account
from core.security import pwd_context
from models.user import User
from modules.practice_sms.providers import ProviderNotIntegrated, get_provider_for_country, sms_available

logger = logging.getLogger(__name__)

CURRENT_CONSENT_VERSION = "2026-11-v2"
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


def send_guardian_sms(user: User, message: str) -> bool:
    """A paid message to a number that came from a public form. Capped per
    number, generously enough for a parent with several children, and for the
    whole platform: per-number and per-IP caps alone wouldn't stop someone
    working through many numbers and running up the SMS bill."""
    hit_per_account(
        "5/day",
        "guardian-sms",
        user.guardian_phone,
        detail="Too many codes have been sent to this phone number today - please try again tomorrow",
    )
    hit_per_account(
        f"{os.getenv('SMS_DAILY_CAP', '500')}/day",
        "guardian-sms-platform",
        "all",
        detail="We can't send text messages right now - please try again tomorrow",
    )
    try:
        return get_provider_for_country(user.country)["send"](to=user.guardian_phone, message=message)
    except ProviderNotIntegrated:
        return False


def _send_consent_sms(user: User, code: str) -> bool:
    first_name = (user.full_name.split() or ["Your child"])[0][:20]
    message = (
        f"Learning Hotspot: {first_name} listed you as parent/guardian. "
        f"To give consent, share this code with them: {code}. Expires in {OTP_TTL_MINUTES} min. "
        f"Not expected? Ignore this."
    )
    return send_guardian_sms(user, message)


def issue_consent_otp(user: User) -> list:
    """Generates a fresh 6-digit code, stores its hash (never the
    plaintext) with a new expiry, resets the attempt counter, and sends it
    to every guardian contact on file. Returns the channels it reached and
    raises 502 if it reached none, so nobody is left waiting for a code
    that never went out. Does not commit - the caller commits alongside
    whatever else it changed (registration, or a profile update), same
    convention as record_topic_attempt in mastery.py."""
    code = f"{secrets.randbelow(1_000_000):06d}"

    user.consent_otp_hash = pwd_context.hash(code)
    user.consent_otp_expires_at = _now() + timedelta(minutes=OTP_TTL_MINUTES)
    user.consent_otp_attempts = 0
    user.consent_otp_sent_at = _now()

    sent = []
    if user.guardian_phone and sms_available(user.country) and _send_consent_sms(user, code):
        sent.append("sms")
    if user.guardian_email and send_email(
        to=user.guardian_email,
        subject="Learning Hotspot - Confirm parental consent",
        body=(
            f"{user.full_name} has registered on Learning Hotspot and listed you as their guardian.\n\n"
            f"Your verification code is: {code}\n\n"
            f"This code expires in {OTP_TTL_MINUTES} minutes. If you did not expect this, you can ignore this email."
        ),
    ):
        sent.append("email")

    if not sent:
        raise HTTPException(
            status_code=502,
            detail="We couldn't send the code to your parent or guardian. Please check the phone number or email and try again.",
        )
    return sent


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
