"""
AI Questions Module Router - on-demand, verified bonus Mathematics
practice questions (see generator.py for why this is scoped to math
only and never touches BKT mastery).
"""

from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from core.rate_limit import limiter
from core.security import get_current_user
from models.user import User
from modules.ai_questions.generator import generate_math_question
from modules.tutor.router import get_gemini_client

router = APIRouter(tags=["ai_questions"])


class GenerateQuestionRequest(BaseModel):
    topic: Optional[str] = None
    difficulty: Literal["easy", "medium", "hard"] = "medium"


@router.get("/")
async def ai_questions_root():
    return {"module": "ai_questions", "status": "active"}


@router.post("/generate")
@limiter.limit("10/hour")
async def generate_question(
    request: Request,
    body: GenerateQuestionRequest,
    current_user: User = Depends(get_current_user),
):
    client = get_gemini_client()
    if client is None:
        raise HTTPException(status_code=503, detail="AI question generation is not configured (missing GEMINI_API_KEY)")

    question = await generate_math_question(client, body.topic, body.difficulty)
    if question is None:
        raise HTTPException(
            status_code=502,
            detail="Could not generate a verified question right now - please try again",
        )

    return {"success": True, "question": question, "tracked": False}
