from fastapi import APIRouter
from services.activity_service import activity_service

router = APIRouter()

@router.get("/{user_id}")
async def get_activities(user_id: str, limit: int = 10):
    return activity_service.get_activities(user_id, limit)

@router.post("/log")
async def log_activity(data: dict):
    user_id = data.get("user_id")
    activity_type = data.get("type")
    activity_data = data.get("data", {})
    if user_id and activity_type:
        return activity_service.log_activity(user_id, activity_type, activity_data)
    return {"error": "user_id and type required"}

print("✅ Activity module loaded")
