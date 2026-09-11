"""
Retrieval grounding for the AI tutor. Two paths, tried in order:

1. Lesson content (`Lesson.content`, a markdown body) - real code, but
   every seeded lesson has `content=NULL` today, so this path is
   currently dormant. It activates automatically the moment real lesson
   content gets authored, with no further code changes.
2. Practice question bank content (`practice/questions.json`, via
   modules.practice.mastery.load_questions) - genuinely populated today.
   Each question's `explanation` field is the only substantive, real
   text anywhere in the platform right now.
"""

import re
from typing import Optional

from sqlalchemy.orm import Session

from models.course import Lesson
from modules.practice.mastery import load_questions

MAX_LESSON_CONTENT_CHARS = 2000
MAX_GROUNDING_ITEMS = 8

_WORD_RE = re.compile(r"[a-z0-9]+")


def _lesson_grounding(db: Session, lesson_id: str) -> Optional[str]:
    lesson = db.query(Lesson).filter(Lesson.slug == lesson_id).first()
    if not lesson or not lesson.content:
        return None
    return f'Lesson content for "{lesson.title}":\n{lesson.content[:MAX_LESSON_CONTENT_CHARS]}'


def _keywords(text: str) -> set:
    return {w for w in _WORD_RE.findall(text.lower()) if len(w) >= 3}


def _subject_grounding(subject_id: str, message: str) -> Optional[str]:
    data = load_questions()
    subject = next((s for s in data.get("subjects", []) if s["id"] == subject_id), None)
    if not subject:
        return None

    candidates = []
    for topic in subject.get("topics", []):
        for q in topic.get("questions", []):
            explanation = q.get("explanation", "")
            candidates.append((topic["name"], q.get("question", ""), explanation))
    if not candidates:
        return None

    message_keywords = _keywords(message)
    scored = []
    for topic_name, question, explanation in candidates:
        overlap = len(message_keywords & _keywords(f"{question} {explanation}"))
        scored.append((overlap, topic_name, question, explanation))
    scored.sort(key=lambda item: item[0], reverse=True)

    top = [item for item in scored if item[0] > 0][:MAX_GROUNDING_ITEMS]
    if not top:
        # Nothing matched the message's keywords - fall back to a
        # representative sample so the tutor still has some grounding
        # rather than none, rather than giving up on this subject entirely.
        top = scored[:MAX_GROUNDING_ITEMS]

    lines = [f'Curriculum material for subject "{subject["name"]}":']
    for _, topic_name, question, explanation in top:
        lines.append(f"- [{topic_name}] Q: {question} A: {explanation}")
    return "\n".join(lines)


def build_grounding_context(
    db: Session, subject_id: Optional[str], lesson_id: Optional[str], message: str
) -> Optional[str]:
    if lesson_id:
        grounding = _lesson_grounding(db, lesson_id)
        if grounding:
            return grounding

    if subject_id:
        return _subject_grounding(subject_id, message)

    return None
