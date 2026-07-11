from fastapi import APIRouter

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

@router.get("/")
async def get_recommendations_info():
    return {"module": "Recommendations", "status": "active"}

print("✅ Recommendations module loaded")
