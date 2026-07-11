"""
Live Classes Module Router
"""

from fastapi import APIRouter

router = APIRouter(tags=["live"])

@router.get("/")
async def live_root():
    return {"module": "live", "status": "active"}

@router.get("/rooms")
async def get_rooms():
    return {
        "success": True,
        "rooms": [
            {"id": "1", "name": "Mathematics Class", "status": "active"},
            {"id": "2", "name": "Science Tutorial", "status": "scheduled"}
        ]
    }
