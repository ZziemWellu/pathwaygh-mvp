"""
Analytics Module Router - not yet built. Returns an honest 501 rather
than fabricated sample data; nothing in the frontend calls this today.
Real per-user analytics already exist under /api/dashboard and
/api/impact, backed by modules/dashboard/aggregation.py.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["analytics"])

@router.get("/")
async def analytics_root():
    return {"module": "analytics", "status": "not_implemented"}

@router.get("/user/{user_id}")
async def get_user_analytics(user_id: str):
    raise HTTPException(status_code=501, detail="Standalone analytics is not yet available - see /api/dashboard.")
