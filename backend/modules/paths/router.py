from fastapi import APIRouter

router = APIRouter(prefix="/api/paths", tags=["Learning Paths"])

@router.get("/")
async def get_paths_info():
    return {"module": "Learning Paths", "status": "active"}

print("✅ Learning Paths module loaded")
