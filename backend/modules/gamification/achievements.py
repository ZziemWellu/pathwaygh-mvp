"""
Static achievement definitions. Deliberately a short, meaningful list
(~9 items) rather than SyllabusGH's 75+ badge wall - every one here ties
to a genuine learning milestone (first attempt, a real streak, actual
mastery, course completion), not an arbitrary grind counter or a
purchase/referral-linked badge, which are the manipulative-engagement
patterns worth not copying on a platform built for minors.

Each condition function takes (db, user, profile) and returns whether
the achievement should be considered earned right now - called from
modules/gamification/service.py after XP-earning activity, never on a
schedule, so a student only ever sees "unlocked" the moment they
actually did the thing.
"""

from typing import Callable, Dict

from sqlalchemy.orm import Session

from models.certificate import Certificate
from models.flashcard import Flashcard
from models.gamification import GamificationProfile
from models.progress import LessonProgress
from models.quiz_attempt import QuizAttempt
from models.skill_mastery import SkillMastery
from models.user import User
from models.vocabulary_progress import VocabularyProgress
from modules.practice.mastery import effective_mastery


def _first_quiz(db: Session, user: User, profile: GamificationProfile) -> bool:
    return db.query(QuizAttempt).filter(QuizAttempt.user_id == user.id).count() >= 1


def _first_lesson(db: Session, user: User, profile: GamificationProfile) -> bool:
    return db.query(LessonProgress).filter(LessonProgress.user_id == user.id, LessonProgress.watched.is_(True)).count() >= 1


def _quiz_master_10(db: Session, user: User, profile: GamificationProfile) -> bool:
    return db.query(QuizAttempt).filter(QuizAttempt.user_id == user.id).count() >= 10


def _high_scorer(db: Session, user: User, profile: GamificationProfile) -> bool:
    return db.query(QuizAttempt).filter(QuizAttempt.user_id == user.id, QuizAttempt.score == 100).count() >= 1


def _mastery_achieved(db: Session, user: User, profile: GamificationProfile) -> bool:
    rows = db.query(SkillMastery).filter(SkillMastery.user_id == user.id).all()
    return any(effective_mastery(m) >= 0.8 for m in rows)


def _course_complete(db: Session, user: User, profile: GamificationProfile) -> bool:
    return db.query(Certificate).filter(Certificate.user_id == user.id, Certificate.is_revoked.is_(False)).count() >= 1


def _wordsmith(db: Session, user: User, profile: GamificationProfile) -> bool:
    return db.query(VocabularyProgress).filter(VocabularyProgress.user_id == user.id).count() >= 5


def _flashcard_habit(db: Session, user: User, profile: GamificationProfile) -> bool:
    return (
        db.query(Flashcard).filter(Flashcard.user_id == user.id, Flashcard.last_reviewed_at.isnot(None)).count() >= 5
    )


def _streak(days: int) -> Callable[[Session, User, GamificationProfile], bool]:
    def check(db: Session, user: User, profile: GamificationProfile) -> bool:
        return profile.current_streak_days >= days

    return check


ACHIEVEMENTS: Dict[str, dict] = {
    "first_quiz": {
        "name": "Quick Start",
        "description": "Complete your first practice quiz",
        "icon": "\U0001F680",
        "condition": _first_quiz,
    },
    "first_lesson": {
        "name": "First Steps",
        "description": "Complete your first lesson",
        "icon": "\U0001F4D6",
        "condition": _first_lesson,
    },
    "streak_3": {
        "name": "On a Roll",
        "description": "Practice 3 days in a row",
        "icon": "\U0001F525",
        "condition": _streak(3),
    },
    "streak_7": {
        "name": "Weekly Warrior",
        "description": "Practice 7 days in a row",
        "icon": "\U0001F4C5",
        "condition": _streak(7),
    },
    "streak_30": {
        "name": "Unstoppable",
        "description": "Practice 30 days in a row",
        "icon": "\U0001F3C6",
        "condition": _streak(30),
    },
    "quiz_master_10": {
        "name": "Quiz Master",
        "description": "Complete 10 practice quizzes",
        "icon": "\U0001F9E0",
        "condition": _quiz_master_10,
    },
    "high_scorer": {
        "name": "Perfect Score",
        "description": "Score 100% on a practice quiz",
        "icon": "\U0001F4AF",
        "condition": _high_scorer,
    },
    "mastery_achieved": {
        "name": "Mastery",
        "description": "Reach strong mastery on a topic",
        "icon": "⭐",
        "condition": _mastery_achieved,
    },
    "course_complete": {
        "name": "Course Complete",
        "description": "Finish every lesson in a course",
        "icon": "\U0001F393",
        "condition": _course_complete,
    },
    "wordsmith": {
        "name": "Wordsmith",
        "description": "Learn 5 Word of the Day entries",
        "icon": "\U0001F4DA",
        "condition": _wordsmith,
    },
    "flashcard_habit": {
        "name": "Card Sharp",
        "description": "Review 5 flashcards",
        "icon": "\U0001F5C2",
        "condition": _flashcard_habit,
    },
}
