"""
Activity Module Router - not yet built. Returns an honest 501 rather
than fabricated sample data; nothing in the frontend calls this today.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["activity"])

@router.get("/")
async def activity_root():
    return {"module": "activity", "status": "not_implemented"}

@router.get("/{user_id}")
async def get_activities(user_id: str):
    raise HTTPException(status_code=501, detail="Activity feed is not yet available.")
