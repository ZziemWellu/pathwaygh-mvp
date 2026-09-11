"""
Bayesian Knowledge Tracing (BKT) for per-topic mastery, plus the adaptive
slot allocation that uses it to bias practice-quiz question selection
toward a student's weakest topics.

Fixed-parameter BKT: these are standard literature defaults, not fitted
from PathwayGH's own attempt data - there isn't enough attempt volume yet
to fit parameters honestly. This is an explicit, documented starting
point, not a calibrated model. Guess probability is computed per-question
from the actual option count rather than a fixed constant, since not
every question has the same number of options.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Optional

from sqlalchemy.orm import Session

from models.skill_mastery import SkillMastery

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
QUESTIONS_FILE = PROJECT_ROOT / "data" / "practice" / "questions.json"

DEFAULT_PRIOR = 0.3
P_TRANSIT = 0.1
P_SLIP = 0.1


def load_questions() -> dict:
    """Loads the practice question bank, falling back to a tiny built-in
    sample if the data file is missing or unreadable - shared by the
    practice router (question selection) and the dashboard router (topic
    display names for weak-topic reporting)."""
    try:
        if QUESTIONS_FILE.exists():
            with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data.get("subjects"):
                    return data
    except Exception as e:
        logger.error(f"Error loading questions: {e}")

    return {
        "subjects": [
            {
                "id": "mathematics",
                "name": "Mathematics",
                "icon": "\U0001F4D0",
                "country": "GH",
                "topics": [
                    {
                        "id": "algebra",
                        "name": "Algebra",
                        "questions": [
                            {"id": "math_001", "question": "What is 2 + 2?", "options": ["3", "4", "5", "6"], "correct": "4", "difficulty": "easy"},
                            {"id": "math_002", "question": "What is 3 x 3?", "options": ["6", "8", "9", "12"], "correct": "9", "difficulty": "easy"},
                            {"id": "math_003", "question": "What is the square root of 16?", "options": ["2", "3", "4", "5"], "correct": "4", "difficulty": "medium"},
                        ],
                    },
                ],
            },
        ]
    }


def topic_names_by_id() -> Dict[str, str]:
    data = load_questions()
    names: Dict[str, str] = {}
    for subject in data.get("subjects", []):
        for topic in subject.get("topics", []):
            names[topic["id"]] = topic["name"]
    return names


def update_mastery(prior: float, is_correct: bool, num_options: int) -> float:
    """One Bayesian Knowledge Tracing step: a Bayes update on the observed
    answer (reflecting the knowledge state as it existed BEFORE this
    attempt), then the forward-looking learning transition. This ordering
    is the textbook-correct one (Corbett & Anderson, 1995) - applying the
    transition first would use an already-inflated prior to interpret
    evidence that couldn't yet reflect that learning."""
    p_guess = 1 / num_options if num_options > 0 else 0.25

    if is_correct:
        numerator = prior * (1 - P_SLIP)
        denominator = numerator + (1 - prior) * p_guess
    else:
        numerator = prior * P_SLIP
        denominator = numerator + (1 - prior) * (1 - p_guess)

    posterior = numerator / denominator if denominator > 0 else prior
    posterior = min(max(posterior, 0.0), 1.0)
    return posterior + (1 - posterior) * P_TRANSIT


def record_topic_attempt(
    db: Session,
    cache: Dict[tuple, SkillMastery],
    user_id: int,
    subject_id: str,
    topic_id: Optional[str],
    is_correct: bool,
    num_options: int,
) -> Optional[SkillMastery]:
    """Get-or-create the SkillMastery row for this student+topic and apply
    one BKT update. Does not commit - the caller commits once after
    processing every answered question in a quiz, alongside the QuizAttempt
    insert, so this stays one transaction.

    `cache` must be a dict the caller creates fresh per request (e.g. per
    quiz submission) and passes to every call in that request. A single
    quiz commonly has multiple questions from the same topic (many
    subjects only have one topic today), and a newly `db.add()`-ed row
    has no id yet until flush/commit - without this cache, a second call
    for the same topic within the same request wouldn't find the first
    call's not-yet-flushed row and would try to insert a duplicate,
    violating the (user_id, subject_id, topic_id) unique constraint."""
    if not topic_id:
        return None

    key = (user_id, subject_id, topic_id)
    mastery = cache.get(key)
    if mastery is None:
        mastery = (
            db.query(SkillMastery)
            .filter(SkillMastery.user_id == user_id, SkillMastery.subject_id == subject_id, SkillMastery.topic_id == topic_id)
            .first()
        )
        if not mastery:
            # attempts_count and mastery_probability are set explicitly
            # here rather than relying on the Column default= (which only
            # applies at flush/commit, not immediately on construction) -
            # we need to read and increment attempts_count right below
            # without a flush.
            mastery = SkillMastery(
                user_id=user_id, subject_id=subject_id, topic_id=topic_id, mastery_probability=DEFAULT_PRIOR, attempts_count=0
            )
            db.add(mastery)
        cache[key] = mastery

    mastery.mastery_probability = update_mastery(mastery.mastery_probability, is_correct, num_options)
    mastery.attempts_count += 1
    return mastery


def allocate_adaptive_slots(topic_question_counts: Dict[str, int], masteries: Dict[str, float], total: int) -> Dict[str, int]:
    """Largest-remainder (Hamilton) apportionment of `total` question slots
    across topics, weighted toward whichever topics the student has
    mastered least. `topic_question_counts` is {topic_id: available count};
    missing entries in `masteries` default to DEFAULT_PRIOR (no attempt
    history yet). Returns {topic_id: slot_count} summing to
    min(total, sum(available)) - capped per topic by what's actually
    available, with any freed slots redistributed to remaining topics.

    With identical mastery across topics (e.g. a student's first-ever quiz
    in a subject, where no history exists for any topic), weakness is
    identical and this degenerates to an even split - equivalent to plain
    random. A single-topic subject gets 100% of slots by the same general
    formula - no special-casing needed for either case.
    """
    topic_ids = [t for t, count in topic_question_counts.items() if count > 0]
    total = min(total, sum(topic_question_counts.values()))
    if not topic_ids or total <= 0:
        return {t: 0 for t in topic_question_counts}

    remaining_topics = list(topic_ids)
    remaining_total = total
    allocation: Dict[str, int] = {t: 0 for t in topic_question_counts}

    # Loop to redistribute any slots freed by availability caps - at the
    # current 1-2-topics-per-subject content scale this converges in at
    # most one extra pass, but the loop handles more topics correctly too.
    while remaining_topics and remaining_total > 0:
        weaknesses = {t: 1 - masteries.get(t, DEFAULT_PRIOR) for t in remaining_topics}
        weakness_sum = sum(weaknesses.values())
        if weakness_sum <= 0:
            weaknesses = {t: 1 for t in remaining_topics}
            weakness_sum = len(remaining_topics)

        exact_shares = {t: weaknesses[t] / weakness_sum * remaining_total for t in remaining_topics}
        floors = {t: int(exact_shares[t]) for t in remaining_topics}
        remainders = sorted(remaining_topics, key=lambda t: exact_shares[t] - floors[t], reverse=True)

        leftover = remaining_total - sum(floors.values())
        for t in remainders[:leftover]:
            floors[t] += 1

        capped_out = []
        for t in remaining_topics:
            available_here = topic_question_counts[t] - allocation[t]
            slots = min(floors[t], available_here)
            allocation[t] += slots
            if slots < floors[t] or available_here == slots:
                # This topic is now fully saturated (or was capped this
                # round) - remove it and redistribute next pass.
                if allocation[t] >= topic_question_counts[t]:
                    capped_out.append(t)

        remaining_total = total - sum(allocation.values())
        remaining_topics = [t for t in remaining_topics if t not in capped_out]

    return allocation
