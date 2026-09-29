"""
Learning Paths Module Router - not yet built. Returns an honest 501
rather than fabricated sample data; nothing in the frontend calls this
today. Real study plans already exist under /api/plan.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["paths"])

@router.get("/")
async def paths_root():
    return {"module": "paths", "status": "not_implemented"}

@router.get("/generate/{user_id}")
async def generate_path(user_id: str):
    raise HTTPException(status_code=501, detail="Learning path generation is not yet available - see /api/plan.")
