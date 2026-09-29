"""
Recommendations Module Router - not yet built. Returns an honest 501
rather than fabricated sample data; nothing in the frontend calls this
today.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["recommendations"])

@router.get("/")
async def recommendations_root():
    return {"module": "recommendations", "status": "not_implemented"}

@router.get("/{user_id}")
async def get_recommendations(user_id: str):
    raise HTTPException(status_code=501, detail="Recommendations are not yet available.")
