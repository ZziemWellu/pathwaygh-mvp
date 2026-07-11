"""
Teacher Portal Module Router
"""

from fastapi import APIRouter

router = APIRouter(tags=["teacher"])

@router.get("/")
async def teacher_root():
    return {"module": "teacher", "status": "active"}

@router.get("/classes/{teacher_id}")
async def get_classes(teacher_id: str):
    return {
        "success": True,
        "classes": [
            {"id": "class_001", "name": "Form 3A", "students": 30},
            {"id": "class_002", "name": "Form 3B", "students": 28}
        ]
    }
