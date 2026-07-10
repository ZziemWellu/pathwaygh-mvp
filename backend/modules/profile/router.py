"""
profile Module Router - Placeholder
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_profile_info():
    return {
        "module": "profile",
        "status": "coming_soon",
        "message": "profile module will be implemented in future sprints"
    }

print(f"✅ profile module loaded")
