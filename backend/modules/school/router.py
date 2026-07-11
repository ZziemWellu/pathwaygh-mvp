"""
School Administration Module Router
"""

from fastapi import APIRouter

router = APIRouter(tags=["school"])

@router.get("/")
async def school_root():
    return {"module": "school", "status": "active"}

@router.get("/dashboard/{school_id}")
async def get_school_dashboard(school_id: str):
    return {
        "success": True,
        "school_id": school_id,
        "stats": {
            "total_students": 250,
            "total_teachers": 15,
            "total_classes": 12
        }
    }
