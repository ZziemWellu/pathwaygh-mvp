"""
Payment Module Router - institutional school-licence billing.

Provider-abstracted (see providers/). What a school pays is always
computed server-side by modules/licence/service.py from its actual
enrolled-student count and the documented prices - never accepted from
the client. The redirect target after checkout is likewise built
server-side from FRONTEND_URL, to avoid an open redirect.

A licence is granted only after the provider's own record says the
payment succeeded AND that record's amount and currency match what was
quoted. Two paths can confirm a payment - the admin returning from
checkout (/verify) and Paystack's server-to-server webhook (/webhook/
paystack, which also covers an admin who closes the tab before the
redirect) - and activation is idempotent across both.
"""

import hashlib
import hmac
import logging
import os
import uuid
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from core.database import get_db
from core.rate_limit import limiter
from core.security import require_school_admin
from models.payment_transaction import PaymentTransaction
from models.school import School
from models.user import User
from modules.licence.service import (
    PricingError,
    activate_from_transaction,
    licence_status,
    public_quote,
    quote_period,
    quote_top_up,
)
from modules.payment.providers import ProviderNotIntegrated, get_provider

router = APIRouter(tags=["payment"])
logger = logging.getLogger(__name__)


class InitializePaymentRequest(BaseModel):
    provider: Literal["paystack", "flutterwave", "mtn_momo"] = "paystack"
    plan: Literal["term", "year", "top_up"] = "year"
    extra_seats: Optional[int] = Field(default=None, ge=1, le=5000)


def _own_school(db: Session, user: User) -> School:
    school = db.query(School).filter(School.id == user.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return school


def _quote(db: Session, school: School, plan: str, extra_seats: Optional[int]) -> dict:
    try:
        if plan == "top_up":
            return quote_top_up(db, school, extra_seats or 0)
        return quote_period(db, school, plan)
    except PricingError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/")
def payment_root():
    return {"module": "payment", "status": "active"}


@router.get("/quote")
def get_quote(current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    """What a term and a year would cost the school right now, plus its
    current plan - what the licence card shows before anyone pays."""
    school = _own_school(db, current_user)
    status = licence_status(db, school)
    options = []
    if status["can_buy"]:
        options = [public_quote(quote_period(db, school, kind)) for kind in ("term", "year")]
    return {"success": True, "licence": status, "options": options}


@router.post("/initialize")
def initialize_payment(
    request: InitializePaymentRequest,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db),
):
    school = _own_school(db, current_user)
    quote = _quote(db, school, request.plan, request.extra_seats)
    amount_minor_units, currency = quote["amount_minor_units"], quote["currency"]

    provider = get_provider(request.provider)
    if currency not in provider["supported_currencies"]:
        raise HTTPException(
            status_code=400, detail=f"{request.provider} does not support {currency} - try a different provider."
        )

    reference = f"pay_{uuid.uuid4().hex[:12]}"
    frontend_url = os.getenv("FRONTEND_URL", "https://pathwaygh-frontend.onrender.com")
    purpose = f"school_licence_{request.plan}"

    transaction = PaymentTransaction(
        reference=reference,
        provider=request.provider,
        status="pending",
        amount_minor_units=amount_minor_units,
        currency=currency,
        purpose=purpose,
        licence_kind=request.plan,
        licence_seats=quote["seats"],
        price_per_seat_minor=quote["price_per_student_minor"],
        school_id=school.id,
        initiated_by_id=current_user.id,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    try:
        result = provider["initialize"](
            reference=reference,
            amount_minor_units=amount_minor_units,
            currency=currency,
            email=current_user.email,
            callback_url=f"{frontend_url}/school-admin?payment_reference={reference}",
            metadata={"school_id": school.id, "purpose": purpose},
        )
    except ProviderNotIntegrated as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        transaction.status = "failed"
        transaction.provider_status = str(e)
        db.commit()
        raise HTTPException(status_code=502, detail=f"Payment initialization failed: {e}") from e

    transaction.external_reference = result["external_reference"]
    transaction.provider_status = result["provider_status"]
    db.commit()

    return {
        "success": True,
        "reference": transaction.reference,
        "checkout_url": result["checkout_url"],
        "amount_minor_units": amount_minor_units,
        "currency": currency,
        "quote": public_quote(quote),
    }


def _confirm(db: Session, transaction: PaymentTransaction) -> None:
    """Ask the provider for the payment's real outcome and, on success with
    a matching amount, grant the licence. Safe to call repeatedly."""
    if transaction.status == "success":
        activate_from_transaction(db, transaction)
        return

    provider = get_provider(transaction.provider)
    result = provider["verify"](reference=transaction.reference, external_reference=transaction.external_reference)

    status = result["status"]
    if status == "success" and (
        result.get("amount_minor_units") != transaction.amount_minor_units
        or (result.get("currency") or "").upper() != transaction.currency
    ):
        # Never grant a licence for less than was quoted (e.g. a tampered
        # checkout amount). Left for a human to look at, not auto-refunded.
        logger.error(
            "Payment %s amount mismatch: expected %s %s, provider reported %s %s",
            transaction.reference,
            transaction.amount_minor_units,
            transaction.currency,
            result.get("amount_minor_units"),
            result.get("currency"),
        )
        status = "amount_mismatch"

    transaction.status = status
    transaction.provider_status = result["provider_status"]
    db.commit()

    if status == "success":
        activate_from_transaction(db, transaction)


@router.get("/verify/{reference}")
def verify_payment(
    reference: str,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db),
):
    transaction = db.query(PaymentTransaction).filter(PaymentTransaction.reference == reference).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction.school_id != current_user.school_id:
        raise HTTPException(status_code=403, detail="This transaction does not belong to your school")

    try:
        _confirm(db, transaction)
    except ProviderNotIntegrated as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Payment verification failed: {e}") from e

    school = _own_school(db, current_user)
    return {
        "success": True,
        "reference": transaction.reference,
        "status": transaction.status,
        "amount_minor_units": transaction.amount_minor_units,
        "currency": transaction.currency,
        "licence": licence_status(db, school),
    }


@router.post("/webhook/paystack")
@limiter.exempt
async def paystack_webhook(request: Request, db: Session = Depends(get_db)):
    """Paystack's server-to-server notification. Authenticated by the
    HMAC-SHA512 of the raw body under our secret key - not by a login.
    The event body itself is only used to find the transaction; its
    outcome comes from re-verifying with Paystack's API, so a forged or
    replayed event can't grant anything."""
    secret = os.getenv("PAYSTACK_SECRET_KEY")
    if not secret:
        raise HTTPException(status_code=503, detail="Payments are not configured")

    raw = await request.body()
    expected = hmac.new(secret.encode(), raw, hashlib.sha512).hexdigest()
    if not hmac.compare_digest(expected, request.headers.get("x-paystack-signature", "")):
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        event = await request.json()
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid JSON") from e

    if event.get("event") != "charge.success":
        return {"success": True, "ignored": event.get("event")}

    reference = (event.get("data") or {}).get("reference")
    transaction = db.query(PaymentTransaction).filter(PaymentTransaction.reference == reference).first()
    if not transaction:
        # Not one of ours (or already purged) - acknowledge so Paystack
        # stops retrying.
        return {"success": True, "ignored": "unknown reference"}

    try:
        # Off the event loop: _confirm makes a blocking HTTP call to Paystack.
        await run_in_threadpool(_confirm, db, transaction)
    except Exception as e:
        # A non-2xx makes Paystack retry later, which is what we want if
        # its verify API was briefly unreachable.
        logger.warning("Webhook confirm failed for %s: %s", reference, e)
        raise HTTPException(status_code=502, detail="Could not confirm payment yet") from e

    return {"success": True, "status": transaction.status}
