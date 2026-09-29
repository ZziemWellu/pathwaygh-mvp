"""
Live Classes Module Router - not yet built. Returns an honest 501
rather than fabricated sample data; nothing in the frontend calls this
today.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["live"])

@router.get("/")
async def live_root():
    return {"module": "live", "status": "not_implemented"}

@router.get("/rooms")
async def get_rooms():
    raise HTTPException(status_code=501, detail="Live classes are not yet available.")
