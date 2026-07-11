from fastapi import APIRouter
router = APIRouter(prefix="/api/profile", tags=["Profile"])

@router.get("/")
async def get_profile():
    return {"profile": {"name": "Test User", "role": "student", "progress": 66}}

@router.put("/")
async def update_profile(data: dict):
    return {"success": True, "message": "Profile updated"}
