from fastapi import APIRouter

router = APIRouter(prefix="/api/tutor", tags=["AI Tutor"])

@router.get("/")
async def get_tutor_info():
    return {"module": "AI Tutor", "status": "active"}

print("✅ AI Tutor module loaded")
