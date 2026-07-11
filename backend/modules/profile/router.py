"""
Profile Module Router
"""

from fastapi import APIRouter

router = APIRouter(tags=["profile"])

@router.get("/")
async def profile_root():
    return {"module": "profile", "status": "active"}

@router.get("/{user_id}")
async def get_profile(user_id: str):
    return {
        "success": True,
        "profile": {
            "id": user_id,
            "name": "User Name",
            "email": "user@example.com",
            "role": "student"
        }
    }
