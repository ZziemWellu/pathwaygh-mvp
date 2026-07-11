"""
AI Tutor Router - Persistent Learning Context
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
from services.ai.tutor.tutor_service import tutor_service

router = APIRouter()


class TutorRequest(BaseModel):
    user_id: str
    query: str
    context: Optional[Dict] = None


class TutorResponse(BaseModel):
    response: str
    context: Dict
    session_id: str
    source: str


@router.post("/tutor/ask", response_model=TutorResponse)
async def ask_tutor(request: TutorRequest):
    """Ask the AI Tutor a question"""
    try:
        result = tutor_service.generate_response(request.user_id, request.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tutor/summary/{user_id}")
async def get_tutor_summary(user_id: str):
    """Get learning summary for a user"""
    try:
        return tutor_service.get_learning_summary(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tutor/session/{user_id}")
async def get_tutor_session(user_id: str):
    """Get full tutoring session"""
    try:
        return tutor_service.get_session(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


print("✅ AI Tutor router loaded")
