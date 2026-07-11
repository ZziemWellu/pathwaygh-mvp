from fastapi import APIRouter

router = APIRouter(prefix="/api/school", tags=["School"])

@router.get("/")
async def get_school_info():
    return {"module": "School Administration", "status": "active"}

print("✅ School module loaded")
