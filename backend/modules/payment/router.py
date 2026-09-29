"""
Payment Module Router - not yet built. Mobile Money integration (MTN
MoMo/Paystack) is deliberately deferred to post-grant phase 2 (see the
Sustainability & Monetization Strategy doc) - this endpoint must say so
honestly rather than fabricate a fake successful transaction, since a
"success" response here would be actively misleading about money.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["payment"])

@router.get("/")
async def payment_root():
    return {"module": "payment", "status": "not_implemented"}

@router.post("/initialize")
async def initialize_payment():
    raise HTTPException(status_code=503, detail="Payments are not yet available on PathwayGH.")
