from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def home():
    return {"message": "Module working", "status": "active"}

@router.get("/test")
async def test():
    return {"module": "working", "status": "ok"}
