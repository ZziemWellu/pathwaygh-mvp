"""
Dashboard Module Router
"""

from fastapi import APIRouter

router = APIRouter(tags=["dashboard"])

@router.get("/")
async def dashboard_root():
    return {"module": "dashboard", "status": "active"}

@router.get("/{user_id}")
async def get_dashboard(user_id: str):
    return {
        "success": True,
        "user_id": user_id,
        "dashboard": {
            "greeting": "Good Morning!",
            "progress": {"overall": 66, "completed": 4, "total": 6}
        }
    }
