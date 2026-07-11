"""
Payment Module Router
"""

from fastapi import APIRouter

router = APIRouter(tags=["payment"])

@router.get("/")
async def payment_root():
    return {"module": "payment", "status": "active"}

@router.post("/initialize")
async def initialize_payment():
    return {
        "success": True,
        "message": "Payment initialized",
        "reference": f"pay_{uuid.uuid4().hex[:8]}"
    }
