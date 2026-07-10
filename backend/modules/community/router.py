"""
community Module Router - Placeholder
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_community_info():
    return {
        "module": "community",
        "status": "coming_soon",
        "message": "community module will be implemented in future sprints"
    }

print(f"✅ community module loaded")
