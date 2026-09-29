"""
Content selection and send-eligibility for the outbound practice-SMS
pilot (roadmap item #6, Phase 1 - see the Sept 2026 feature-phone-
fallback scoping doc). Deliberately outbound-only: no reply parsing, no
two-way quiz scoring - this validates real demand before the harder
Tier 2/3 work that scoping doc lays out gets any engineering time.
"""

import random
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from models.practice_sms_subscriber import PracticeSmsSubscriber
from modules.practice.mastery import load_questions

SMS_COOLDOWN_DAYS = 1


def eligible_subscribers_for_practice_sms(db: Session) -> List[PracticeSmsSubscriber]:
    cutoff = datetime.utcnow() - timedelta(days=SMS_COOLDOWN_DAYS)
    return (
        db.query(PracticeSmsSubscriber)
        .filter(
            PracticeSmsSubscriber.verified.is_(True),
            PracticeSmsSubscriber.opted_in.is_(True),
            (PracticeSmsSubscriber.last_sms_sent_at.is_(None)) | (PracticeSmsSubscriber.last_sms_sent_at < cutoff),
        )
        .all()
    )


def _questions_for(country: str, subject_id: Optional[str]) -> list:
    data = load_questions()
    candidates = []
    for subject in data.get("subjects", []):
        if subject.get("country") != country:
            continue
        if subject_id and subject["id"] != subject_id:
            continue
        for topic in subject.get("topics", []):
            candidates.extend(topic.get("questions", []))
    return candidates


def _find_question_by_id(country: str, question_id: str) -> Optional[dict]:
    for q in _questions_for(country, subject_id=None):
        if q["id"] == question_id:
            return q
    return None


def build_practice_sms_text(subscriber: PracticeSmsSubscriber) -> Optional[Tuple[str, str]]:
    """Returns (message_text, new_question_id), or None if no content
    exists for this subscriber's country/subject. Each message reveals
    the previous question's answer (if any) before posing a new one -
    since this channel is outbound-only, revealing the answer next
    message rather than next reply is what makes it a genuine practice
    loop instead of a question with its own answer given away in the
    same breath."""
    candidates = _questions_for(subscriber.country, subscriber.subject_id)
    if not candidates:
        return None

    lines = []
    if subscriber.last_question_id:
        previous = _find_question_by_id(subscriber.country, subscriber.last_question_id)
        if previous:
            lines.append(f"Last answer: {previous['correct']} - {previous.get('explanation', '')}")

    question = random.choice(candidates)
    letters = "ABCD"
    lines.append(f"New practice question: {question['question']}")
    lines.extend(f"{letters[i]}) {opt}" for i, opt in enumerate(question.get("options", [])))

    return "\n".join(lines), question["id"]
