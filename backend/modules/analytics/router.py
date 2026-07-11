from fastapi import APIRouter

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/")
async def get_analytics_info():
    return {"module": "Analytics", "status": "active"}

print("✅ Analytics module loaded")
