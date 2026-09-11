"""
AI Tutor Module Router - real LLM-backed chat (Google Gemini).
"""

import os
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from google import genai
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.user import User
from modules.tutor.grounding import build_grounding_context
from modules.tutor.mathtool import compute_math

router = APIRouter(tags=["tutor"])

_client = None


def get_gemini_client():
    global _client
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    if _client is None:
        _client = genai.Client(api_key=api_key)
    return _client


SYSTEM_PROMPT_BY_COUNTRY = {
    "GH": (
        "You are the AI Tutor for PathwayGH, an education platform for Ghanaian JHS and SHS students. "
        "Explain concepts clearly and simply, use short examples relevant to the WASSCE/BECE curriculum where "
        "helpful, and keep answers concise (a few short paragraphs at most). If asked something unrelated to "
        "school subjects or study advice, gently redirect the student back to their studies. "
        "Formatting: you may use Markdown (bold, headings, lists), but do NOT use LaTeX math notation "
        "(no $...$ or $$...$$). Write math plainly instead, e.g. 'x squared' or 'x^2', and use unicode "
        "symbols like ², ³, √, ×, ÷ where natural."
    ),
    "NG": (
        "You are the AI Tutor for PathwayGH, an education platform for Nigerian students. "
        "Explain concepts clearly and simply, use short examples relevant to your school curriculum where "
        "helpful, and keep answers concise (a few short paragraphs at most). If asked something unrelated to "
        "school subjects or study advice, gently redirect the student back to their studies. "
        "Formatting: you may use Markdown (bold, headings, lists), but do NOT use LaTeX math notation "
        "(no $...$ or $$...$$). Write math plainly instead, e.g. 'x squared' or 'x^2', and use unicode "
        "symbols like ², ³, √, ×, ÷ where natural."
    ),
}


LANGUAGE_INSTRUCTION = {
    "en": "",
    "tw": " Respond in Twi (the Akan language spoken in Ghana).",
    "pcm": " Respond in Nigerian Pidgin English.",
}


SOCRATIC_INSTRUCTION = (
    " Teaching style: when a student asks you to solve a problem or wants a direct answer, do not give the "
    "final answer immediately. First ask what they've already tried or what part is confusing them, then offer "
    "one hint or the next small step rather than the full solution. Only give the complete answer if the "
    "student says they are still stuck after the hint, or explicitly asks for the full solution. Always explain "
    "your reasoning rather than stating a bare final answer."
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    subject_id: Optional[str] = None
    lesson_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = None


@router.get("/")
async def tutor_root():
    return {"module": "tutor", "status": "active"}


@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client = get_gemini_client()
    if client is None:
        raise HTTPException(status_code=503, detail="AI tutor is not configured (missing GEMINI_API_KEY)")

    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    grounding = None
    try:
        grounding = build_grounding_context(db, request.subject_id, request.lesson_id, request.message)
    except Exception:
        grounding = None

    computed_math = await compute_math(request.message)

    system_instruction = (
        SYSTEM_PROMPT_BY_COUNTRY.get(current_user.country, SYSTEM_PROMPT_BY_COUNTRY["GH"])
        + LANGUAGE_INSTRUCTION.get(current_user.language, "")
        + SOCRATIC_INSTRUCTION
    )
    if grounding:
        system_instruction += (
            f"\n\nUse the following curriculum material to ground your answer where relevant. "
            f"Don't mention that this material was provided to you.\n{grounding}"
        )
    if computed_math:
        system_instruction += (
            f"\n\nA verified calculation: {computed_math['expression']} = {computed_math['result']}. "
            f"Guide the student toward this result - do not contradict it."
        )

    contents = []
    for turn in (request.history or [])[-10:]:
        contents.append({"role": "model" if turn.role == "assistant" else "user", "parts": [{"text": turn.content}]})
    contents.append({"role": "user", "parts": [{"text": request.message}]})

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=contents,
            config={
                "system_instruction": system_instruction,
                "max_output_tokens": 2048,
            },
        )
        reply = response.text or "I'm not sure how to answer that - could you rephrase your question?"
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI tutor request failed: {e}")

    return {"success": True, "response": reply, "grounded": bool(grounding), "computed_math": computed_math}
