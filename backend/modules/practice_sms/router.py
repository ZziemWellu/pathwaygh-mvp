"""
Practice-SMS Module Router - the outbound-only Phase 1 pilot from
roadmap item #6 (see the Sept 2026 feature-phone-fallback scoping doc).

/subscribe, /verify, /resend-code, and /unsubscribe are deliberately
public (no get_current_user auth): the whole point is reaching students
who may never have been able to create a PathwayGH account at all, since
the smartphone PWA can't reach them. /send-batch is cron-callable only,
mirroring modules/parent/router.py's send-digests (shared-secret header,
not user auth).
"""

import logging
import os
import re
from datetime import datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Form, Header, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db
from core.secrets_compare import secrets_match
from core.rate_limit import limiter
from models.practice_sms_subscriber import PracticeSmsSubscriber
from modules.practice_sms.eligibility import build_practice_sms_text, eligible_subscribers_for_practice_sms
from modules.practice_sms.providers import ProviderNotIntegrated, get_provider_for_country
from modules.practice_sms.verification import can_resend, issue_verification_code, verify_code

logger = logging.getLogger(__name__)

router = APIRouter(tags=["practice_sms"])

_CODE_RE = re.compile(r"\b(\d{6})\b")

# Only these 3 have a real, wired-up SMS provider today (Africa's
# Talking) - Sierra Leone and Liberia aren't covered by it and need a
# separate provider confirmed before they can be offered honestly here.
# See modules/practice_sms/providers/__init__.py.
SUPPORTED_COUNTRIES = {"GH", "NG", "GM"}


class SubscribeRequest(BaseModel):
    phone_number: str
    country: Literal["GH", "NG", "SL", "LR", "GM"]
    subject_id: Optional[str] = None


class VerifyRequest(BaseModel):
    phone_number: str
    code: str


class UnsubscribeRequest(BaseModel):
    phone_number: str


@router.get("/")
def practice_sms_root():
    return {"module": "practice_sms", "status": "active"}


@router.post("/subscribe")
@limiter.limit("5/hour")
def subscribe(request: Request, body: SubscribeRequest, db: Session = Depends(get_db)):
    if body.country not in SUPPORTED_COUNTRIES:
        raise HTTPException(
            status_code=503,
            detail=(
                f"SMS practice questions aren't available for {body.country} yet - no SMS provider with "
                "confirmed coverage there is wired up yet."
            ),
        )

    subscriber = db.query(PracticeSmsSubscriber).filter(PracticeSmsSubscriber.phone_number == body.phone_number).first()
    if not subscriber:
        subscriber = PracticeSmsSubscriber(phone_number=body.phone_number, country=body.country, subject_id=body.subject_id)
        db.add(subscriber)
    else:
        subscriber.country = body.country
        subscriber.subject_id = body.subject_id
        subscriber.opted_in = True

    if subscriber.verified:
        db.commit()
        return {"success": True, "already_verified": True}

    if not can_resend(subscriber):
        raise HTTPException(status_code=400, detail="Please wait a moment before requesting another code")

    if not issue_verification_code(subscriber):
        raise HTTPException(status_code=502, detail="Could not send verification code - please try again shortly")

    db.commit()
    return {"success": True, "already_verified": False}


@router.post("/verify")
@limiter.limit("10/hour")
def verify(request: Request, body: VerifyRequest, db: Session = Depends(get_db)):
    subscriber = db.query(PracticeSmsSubscriber).filter(PracticeSmsSubscriber.phone_number == body.phone_number).first()
    if not subscriber:
        raise HTTPException(status_code=404, detail="No pending subscription for this number")

    verify_code(subscriber, body.code)
    db.commit()
    return {"success": True}


@router.post("/resend-code")
@limiter.limit("3/hour")
def resend_code(request: Request, body: UnsubscribeRequest, db: Session = Depends(get_db)):
    subscriber = db.query(PracticeSmsSubscriber).filter(PracticeSmsSubscriber.phone_number == body.phone_number).first()
    if not subscriber:
        raise HTTPException(status_code=404, detail="No pending subscription for this number")
    if subscriber.verified:
        raise HTTPException(status_code=400, detail="This number is already verified")
    if not can_resend(subscriber):
        raise HTTPException(status_code=400, detail="Please wait a moment before requesting another code")

    if not issue_verification_code(subscriber):
        raise HTTPException(status_code=502, detail="Could not send verification code - please try again shortly")

    db.commit()
    return {"success": True}


@router.post("/unsubscribe")
@limiter.limit("10/hour")
def unsubscribe(request: Request, body: UnsubscribeRequest, db: Session = Depends(get_db)):
    subscriber = db.query(PracticeSmsSubscriber).filter(PracticeSmsSubscriber.phone_number == body.phone_number).first()
    if subscriber:
        subscriber.opted_in = False
        db.commit()
    return {"success": True}


@router.post("/inbound")
def inbound_sms(
    from_: str = Form(..., alias="from"),
    text: str = Form(""),
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Africa's Talking's incoming-SMS webhook target - configure this
    exact URL (with ?token=... appended, see PRACTICE_SMS_INBOUND_SECRET
    below) under SMS > Callback URLs > Incoming Messages in the AT
    dashboard. This is the piece that was previously missing entirely:
    the verification SMS tells a student to "reply with this code," but
    without this endpoint wired up in AT's dashboard, no inbound reply
    was ever actually received or acted on - subscribe/verify only
    worked if something else called POST /verify directly. Handles the
    two things a student might actually send back: a 6-digit code, or
    STOP to unsubscribe (the minimal compliance-required opt-out, not
    full two-way quiz support - see the feature-phone-fallback doc's
    Tier 1 vs Tier 2 distinction).

    Always returns 200: Africa's Talking retries a webhook that doesn't
    return 2xx, and an unmatched or already-verified reply is not an
    error worth surfacing to the telco - it's logged instead.

    Payload shape (form-encoded from/to/text/date/id) is Africa's
    Talking's documented incoming-SMS webhook format, not guessed.
    """
    expected_token = os.getenv("PRACTICE_SMS_INBOUND_SECRET")
    if expected_token and not secrets_match(token, expected_token):
        logger.warning("Rejected an inbound SMS webhook call with a missing/incorrect token")
        return {"success": True}

    phone_number = from_.strip()
    body = text.strip()

    subscriber = db.query(PracticeSmsSubscriber).filter(PracticeSmsSubscriber.phone_number == phone_number).first()
    if not subscriber:
        return {"success": True}

    if body.upper() in {"STOP", "UNSUBSCRIBE"}:
        subscriber.opted_in = False
        db.commit()
        return {"success": True}

    if subscriber.verified:
        return {"success": True}

    match = _CODE_RE.search(body)
    if match:
        try:
            verify_code(subscriber, match.group(1))
        except HTTPException as e:
            # Deliberately still commits below on failure too: an
            # incorrect-code attempt increments verification_attempts in
            # place before raising, and that increment must persist -
            # a rollback here would silently erase the brute-force
            # attempt counter on every failed guess sent by SMS.
            logger.info(f"Inbound SMS verification attempt failed for a subscriber: {e.detail}")
        db.commit()

    return {"success": True}


@router.post("/send-batch")
def send_batch(x_digest_secret: str = Header(...), db: Session = Depends(get_db)):
    expected = os.getenv("DIGEST_TRIGGER_SECRET")
    if not expected:
        raise HTTPException(status_code=503, detail="Practice SMS sending is not configured")
    if not secrets_match(x_digest_secret, expected):
        raise HTTPException(status_code=401, detail="Invalid digest secret")

    sent = skipped = failed = 0
    for subscriber in eligible_subscribers_for_practice_sms(db):
        built = build_practice_sms_text(subscriber)
        if not built:
            skipped += 1
            continue
        text, new_question_id = built

        try:
            provider = get_provider_for_country(subscriber.country)
            ok = provider["send"](to=subscriber.phone_number, message=text)
        except ProviderNotIntegrated:
            ok = False

        if ok:
            subscriber.last_question_id = new_question_id
            subscriber.last_sms_sent_at = datetime.utcnow()
            db.commit()
            sent += 1
        else:
            failed += 1

    return {"success": True, "sent": sent, "skipped": skipped, "failed": failed}
