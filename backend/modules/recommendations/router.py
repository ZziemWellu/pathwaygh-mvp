"""
Recommendations Module Router
"""

from fastapi import APIRouter

router = APIRouter(tags=["recommendations"])

@router.get("/")
async def recommendations_root():
    return {"module": "recommendations", "status": "active"}

@router.get("/{user_id}")
async def get_recommendations(user_id: str):
    return {
        "success": True,
        "user_id": user_id,
        "recommendations": [
            {"type": "career", "title": "Medical Doctor", "confidence": 92},
            {"type": "course", "title": "JHS English", "confidence": 85}
        ]
    }
