"""
Community Module Router - not yet built. Returns an honest 501 rather
than fabricated sample data; the frontend's Community page already
shows its own "coming soon" state and doesn't call this endpoint.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["community"])

@router.get("/")
async def community_root():
    return {"module": "community", "status": "not_implemented"}

@router.get("/forums")
async def get_forums():
    raise HTTPException(status_code=501, detail="Community forums are not yet available.")
