"""
Community Module Router
"""

from fastapi import APIRouter

router = APIRouter(tags=["community"])

@router.get("/")
async def community_root():
    return {"module": "community", "status": "active"}

@router.get("/forums")
async def get_forums():
    return {
        "success": True,
        "forums": [
            {"id": "1", "name": "General Discussion", "posts": 45},
            {"id": "2", "name": "Mathematics Help", "posts": 32}
        ]
    }
