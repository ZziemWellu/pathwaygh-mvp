"""
explore Module Router - Placeholder
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_explore_info():
    return {
        "module": "explore",
        "status": "coming_soon",
        "message": "explore module will be implemented in future sprints"
    }

print(f"✅ explore module loaded")
