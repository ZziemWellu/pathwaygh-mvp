"""
Personalized Learning Paths Router
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
from services.learning.paths.path_generator import path_generator

router = APIRouter()


class PathRequest(BaseModel):
    user_id: str
    subject: str
    goal: str = "mastery"


@router.post("/path/generate")
async def generate_path(request: PathRequest):
    """Generate a personalized learning path"""
    try:
        path = path_generator.generate_path(
            request.user_id,
            request.subject,
            request.goal
        )
        return {"status": "success", "path": path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/path/{user_id}/{subject}")
async def get_path(user_id: str, subject: str):
    """Get existing learning path"""
    try:
        path = path_generator.get_path(user_id, subject)
        if not path:
            return {"status": "not_found", "message": "No path found"}
        return {"status": "success", "path": path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/path/progress")
async def update_path_progress(data: Dict):
    """Update learning path progress"""
    try:
        path_generator.update_progress(
            data.get("user_id"),
            data.get("subject"),
            data.get("step_index")
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

print("✅ Learning Paths router loaded")
