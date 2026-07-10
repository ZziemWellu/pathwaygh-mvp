from fastapi import APIRouter
from services.enhanced_dashboard_service import enhanced_dashboard_service

router = APIRouter()

@router.get("/{user_id}")
async def get_dashboard(user_id: str):
    return enhanced_dashboard_service.get_dashboard(user_id)

@router.get("/{user_id}/progress")
async def get_progress(user_id: str):
    data = enhanced_dashboard_service.get_dashboard(user_id)
    return {"progress": data.get("progress", {})}

@router.get("/{user_id}/recommendations")
async def get_recommendations(user_id: str):
    data = enhanced_dashboard_service.get_dashboard(user_id)
    return {"recommendations": data.get("recommendations", [])}

print("✅ Dashboard module loaded")
