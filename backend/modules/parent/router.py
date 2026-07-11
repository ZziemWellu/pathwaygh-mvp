"""
Parent Portal Module Router
"""

from fastapi import APIRouter

router = APIRouter(tags=["parent"])

@router.get("/")
async def parent_root():
    return {"module": "parent", "status": "active"}

@router.get("/children/{parent_id}")
async def get_children(parent_id: str):
    return {
        "success": True,
        "children": [
            {"id": "child_001", "name": "Child A", "grade": "Form 3", "progress": 85},
            {"id": "child_002", "name": "Child B", "grade": "Form 1", "progress": 72}
        ]
    }
