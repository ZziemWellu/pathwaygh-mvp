"""
On-demand AI-generated bonus math practice questions (roadmap-adjacent
item inspired by Solvxit-GH's "unlimited practice question generation").

Deliberately scoped to Mathematics only, and deliberately NOT fed into
the BKT mastery pipeline: unlike the curated, human-reviewed question
bank (data/practice/questions.json), an LLM can state a wrong "correct"
answer with complete confidence, and unverified AI-generated difficulty
would pollute mastery calibration built on the curated bank. Every
generated question is independently checked - the model must also
report a plain arithmetic expression that evaluates (via
modules/tutor/mathtool.py's existing sandboxed evaluator - the same one
already trusted for the tutor's chat-time math grounding) to the exact
value of its own stated correct answer. A question that fails this
check is discarded and regenerated, up to a small retry budget, rather
than ever served to a student unverified.
"""

import logging
from typing import List, Literal, Optional

from pydantic import BaseModel

from modules.tutor.mathtool import evaluate_expression

logger = logging.getLogger(__name__)

MAX_GENERATION_ATTEMPTS = 3
NUMERIC_TOLERANCE = 1e-6

DIFFICULTY_GUIDANCE = {
    "easy": "suitable for a JHS/BECE-level student - simple arithmetic or a one-step calculation",
    "medium": "suitable for an SHS/WASSCE-level student - may require 2-3 steps",
    "hard": "a more challenging WASSCE-level question requiring multiple steps or combined concepts",
}


class GeneratedMathQuestion(BaseModel):
    question: str
    options: List[str]
    correct: str
    explanation: str
    verification_expression: str


def _build_prompt(topic: Optional[str], difficulty: str) -> str:
    topic_line = f" on the topic of {topic}" if topic else ""
    return (
        f"Generate one WASSCE/BECE-style multiple-choice Mathematics practice question{topic_line}, "
        f"{DIFFICULTY_GUIDANCE.get(difficulty, DIFFICULTY_GUIDANCE['medium'])}.\n\n"
        "Requirements:\n"
        "- Exactly 4 answer options, plausible distractors, only one correct.\n"
        "- 'correct' must be a plain number (e.g. '42' or '3.5') with no units, symbols, or extra words - "
        "it must exactly match one of the 4 options.\n"
        "- 'verification_expression' must be a plain arithmetic expression using only numbers and "
        "+ - * / ^ ( ) - no variables, no equals sign, no words - that evaluates to exactly the same "
        "numeric value as 'correct'. This is independently checked by a calculator, so it must be exact.\n"
        "- 'explanation' should briefly show the working."
    )


def _verify(candidate: GeneratedMathQuestion) -> bool:
    if len(candidate.options) != 4 or candidate.correct not in candidate.options:
        return False
    try:
        stated_answer = float(candidate.correct)
    except ValueError:
        return False

    computed = evaluate_expression(candidate.verification_expression)
    if computed is None:
        return False
    return abs(computed - stated_answer) < NUMERIC_TOLERANCE


def generate_math_question(
    gemini_client, topic: Optional[str], difficulty: Literal["easy", "medium", "hard"]
) -> Optional[dict]:
    """Returns a verified question dict, or None if no verified question
    could be produced within the retry budget - the caller should treat
    None as "generation unavailable right now", not retry indefinitely."""
    prompt = _build_prompt(topic, difficulty)

    for attempt in range(MAX_GENERATION_ATTEMPTS):
        try:
            response = gemini_client.models.generate_content(
                model="gemini-3.6-flash",
                contents=[{"role": "user", "parts": [{"text": prompt}]}],
                config={
                    "response_mime_type": "application/json",
                    "response_schema": GeneratedMathQuestion,
                    "max_output_tokens": 1024,
                },
            )
            candidate = response.parsed
        except Exception as e:
            logger.warning(f"AI question generation attempt {attempt + 1} failed to call/parse Gemini: {e}")
            continue

        if candidate is None:
            continue

        if _verify(candidate):
            return {
                "question": candidate.question,
                "options": candidate.options,
                "correct": candidate.correct,
                "explanation": candidate.explanation,
            }
        logger.info(f"Discarding an AI-generated question that failed verification (attempt {attempt + 1})")

    return None
