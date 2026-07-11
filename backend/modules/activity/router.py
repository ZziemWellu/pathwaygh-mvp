"""
Activity Module Router
"""

from fastapi import APIRouter

router = APIRouter(tags=["activity"])

@router.get("/")
async def activity_root():
    return {"module": "activity", "status": "active"}

@router.get("/{user_id}")
async def get_activities(user_id: str):
    return {
        "success": True,
        "user_id": user_id,
        "activities": [
            {"id": "1", "action": "Completed quiz", "timestamp": "2024-01-15T10:30:00"},
            {"id": "2", "action": "Watched lesson", "timestamp": "2024-01-15T09:00:00"}
        ]
    }
