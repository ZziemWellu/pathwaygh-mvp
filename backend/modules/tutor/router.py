"""
AI Tutor Module Router - real LLM-backed chat (Google Gemini).
"""

import os

from fastapi import APIRouter, Depends, HTTPException
from google import genai
from pydantic import BaseModel

from core.security import get_current_user
from models.user import User

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


class ChatRequest(BaseModel):
    message: str


@router.get("/")
async def tutor_root():
    return {"module": "tutor", "status": "active"}


@router.post("/chat")
async def chat(request: ChatRequest, current_user: User = Depends(get_current_user)):
    client = get_gemini_client()
    if client is None:
        raise HTTPException(status_code=503, detail="AI tutor is not configured (missing GEMINI_API_KEY)")

    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=request.message,
            config={
                "system_instruction": SYSTEM_PROMPT_BY_COUNTRY.get(current_user.country, SYSTEM_PROMPT_BY_COUNTRY["GH"])
                + LANGUAGE_INSTRUCTION.get(current_user.language, ""),
                "max_output_tokens": 2048,
            },
        )
        reply = response.text or "I'm not sure how to answer that - could you rephrase your question?"
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI tutor request failed: {e}")

    return {"success": True, "response": reply}
