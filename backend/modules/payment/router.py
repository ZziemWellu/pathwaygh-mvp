"""
Payment Module Router - institutional school-license billing.

Real, provider-abstracted implementation (see providers/) - this was a
fake-success stub until this pass (a fake "success" response would have
been actively misleading about money, so it honestly 503'd instead - see
the September 2026 audit commit). The amount billed is always computed
server-side from the school's actual enrolled-student count and the
documented per-student annual price - never accepted from the client,
so a request can't simply claim whatever amount it likes. The redirect
target after checkout is likewise built server-side from FRONTEND_URL,
not accepted from the client, to avoid an open-redirect through the
payment flow.
"""

import os
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import require_school_admin
from models.payment_transaction import PaymentTransaction
from models.school import School
from models.user import User
from modules.payment.providers import ProviderNotIntegrated, get_provider

router = APIRouter(tags=["payment"])

# GHS 80/student/year, per the Sustainability & Monetization Strategy -
# the only country with a documented, real price today. The other 4
# target countries need a real price decision before they can bill -
# see the HTTPException below rather than a guessed number for them.
ANNUAL_PRICE_PER_STUDENT_MINOR_UNITS = {
    "GH": {"amount": 8000, "currency": "GHS"},  # GHS 80.00 in pesewas
}


class InitializePaymentRequest(BaseModel):
    provider: Literal["paystack", "flutterwave", "mtn_momo"] = "paystack"


def _annual_license_price_for_school(school: School, student_count: int) -> tuple:
    pricing = ANNUAL_PRICE_PER_STUDENT_MINOR_UNITS.get(school.country)
    if not pricing:
        raise HTTPException(
            status_code=400,
            detail=f"No institutional license price is set for country '{school.country}' yet.",
        )
    return pricing["amount"] * max(student_count, 1), pricing["currency"]


@router.get("/")
async def payment_root():
    return {"module": "payment", "status": "active"}


@router.post("/initialize")
async def initialize_payment(
    request: InitializePaymentRequest,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db),
):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    student_count = db.query(User).filter(User.school_id == school.id, User.is_school_admin.is_(False)).count()
    amount_minor_units, currency = _annual_license_price_for_school(school, student_count)

    provider = get_provider(request.provider)
    if currency not in provider["supported_currencies"]:
        raise HTTPException(
            status_code=400, detail=f"{request.provider} does not support {currency} - try a different provider."
        )

    reference = f"pay_{uuid.uuid4().hex[:12]}"
    frontend_url = os.getenv("FRONTEND_URL", "https://pathwaygh-frontend.onrender.com")

    transaction = PaymentTransaction(
        reference=reference,
        provider=request.provider,
        status="pending",
        amount_minor_units=amount_minor_units,
        currency=currency,
        purpose="school_license_annual",
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
            metadata={"school_id": school.id, "purpose": "school_license_annual"},
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
    }


@router.get("/verify/{reference}")
async def verify_payment(
    reference: str,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db),
):
    transaction = db.query(PaymentTransaction).filter(PaymentTransaction.reference == reference).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction.school_id != current_user.school_id:
        raise HTTPException(status_code=403, detail="This transaction does not belong to your school")

    provider = get_provider(transaction.provider)
    try:
        result = provider["verify"](reference=transaction.reference, external_reference=transaction.external_reference)
    except ProviderNotIntegrated as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Payment verification failed: {e}") from e

    transaction.status = result["status"]
    transaction.provider_status = result["provider_status"]
    db.commit()

    return {
        "success": True,
        "reference": transaction.reference,
        "status": transaction.status,
        "amount_minor_units": transaction.amount_minor_units,
        "currency": transaction.currency,
    }
