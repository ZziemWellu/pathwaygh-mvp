"""
plan Module Router - Placeholder
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_plan_info():
    return {
        "module": "plan",
        "status": "coming_soon",
        "message": "plan module will be implemented in future sprints"
    }

print(f"✅ plan module loaded")
