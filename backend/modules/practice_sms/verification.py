"""
SMS-code verification for practice-SMS subscriptions. Reuses the exact
hashed-OTP/expiry/attempt-limit pattern already established for guardian-
email consent (modules/auth/consent.py) - the underlying problem is the
same: prove possession of a contact channel before treating it as
verified, not just accept whatever a public, unauthenticated endpoint
was handed. Without this, /subscribe would let anyone sign up an
arbitrary stranger's number for recurring SMS.
"""

import logging
import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException

from core.security import pwd_context
from models.practice_sms_subscriber import PracticeSmsSubscriber
from modules.practice_sms.providers import ProviderNotIntegrated, get_provider_for_country

logger = logging.getLogger(__name__)

CODE_TTL_MINUTES = 15
MAX_VERIFICATION_ATTEMPTS = 5
RESEND_COOLDOWN_SECONDS = 60


def _now() -> datetime:
    return datetime.utcnow()


def issue_verification_code(subscriber: PracticeSmsSubscriber) -> bool:
    """Generates a fresh 6-digit code, stores its hash, and sends it via
    the subscriber's country's SMS provider. Returns whether the send
    itself succeeded (does not raise) - unlike consent.py's email send,
    which is fire-and-forget, an SMS send here has a real per-message
    cost and a fallible external API, so the caller needs to know if it
    didn't go out. Does not commit - the caller commits."""
    code = f"{secrets.randbelow(1_000_000):06d}"
    subscriber.verification_code_hash = pwd_context.hash(code)
    subscriber.verification_code_expires_at = _now() + timedelta(minutes=CODE_TTL_MINUTES)
    subscriber.verification_attempts = 0
    subscriber.verification_code_sent_at = _now()

    message = f"Your PathwayGH practice code is {code}. Reply with this code to confirm free daily practice questions."
    try:
        provider = get_provider_for_country(subscriber.country)
        return provider["send"](to=subscriber.phone_number, message=message)
    except ProviderNotIntegrated:
        return False


def can_resend(subscriber: PracticeSmsSubscriber) -> bool:
    if not subscriber.verification_code_sent_at:
        return True
    elapsed = (_now() - subscriber.verification_code_sent_at).total_seconds()
    return elapsed >= RESEND_COOLDOWN_SECONDS


def verify_code(subscriber: PracticeSmsSubscriber, code: str) -> None:
    """Raises HTTPException(400) on any failure to verify; on success,
    marks the subscriber verified and clears the pending code state.
    Does not commit - the caller commits."""
    if not subscriber.verification_code_hash or not subscriber.verification_code_expires_at:
        raise HTTPException(status_code=400, detail="No pending verification code - subscribe again to request one")

    if _now() > subscriber.verification_code_expires_at:
        raise HTTPException(status_code=400, detail="Verification code has expired - subscribe again to request a new one")

    if subscriber.verification_attempts >= MAX_VERIFICATION_ATTEMPTS:
        raise HTTPException(status_code=400, detail="Too many incorrect attempts - subscribe again to request a new code")

    if not pwd_context.verify(code, subscriber.verification_code_hash):
        subscriber.verification_attempts += 1
        raise HTTPException(status_code=400, detail="Incorrect code")

    subscriber.verified = True
    subscriber.verification_code_hash = None
    subscriber.verification_code_expires_at = None
    subscriber.verification_attempts = 0
    subscriber.verification_code_sent_at = None
