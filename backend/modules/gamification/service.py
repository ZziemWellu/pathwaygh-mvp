"""
XP, streaks, and achievement-unlocking. Called from the real activity
endpoints (modules/learn/router.py's lesson-progress update,
modules/practice/router.py's quiz submit) right after the real event is
persisted - never on a schedule, so "you just earned X" is always true
at the moment it's shown, the same discipline check_and_issue_certificate
already follows for course completion.
"""

from datetime import timedelta
from typing import List

from sqlalchemy.orm import Session

from models.gamification import EarnedAchievement, GamificationProfile, today_utc
from models.user import User
from modules.gamification.achievements import ACHIEVEMENTS

XP_PER_LESSON = 10
XP_PER_QUIZ_BASE = 5
XP_PER_CORRECT_ANSWER = 1


def get_or_create_profile(db: Session, user_id: int) -> GamificationProfile:
    profile = db.query(GamificationProfile).filter(GamificationProfile.user_id == user_id).first()
    if not profile:
        profile = GamificationProfile(user_id=user_id)
        db.add(profile)
        db.flush()
    return profile


def _record_activity(profile: GamificationProfile) -> None:
    """Updates streak fields for one XP-earning activity today. Idempotent
    within a single day - a student who does 3 quizzes today doesn't get
    a streak of 3, they get a streak that just advances by 1 the first
    time today, same as SyllabusGH's own "practice every day" streak
    concept normally works."""
    today = today_utc()
    if profile.last_activity_date == today:
        return

    if profile.last_activity_date == today - timedelta(days=1):
        profile.current_streak_days += 1
    else:
        profile.current_streak_days = 1

    profile.longest_streak_days = max(profile.longest_streak_days, profile.current_streak_days)
    profile.last_activity_date = today


def check_and_award_achievements(db: Session, user: User, profile: GamificationProfile) -> List[dict]:
    """Returns the achievements newly unlocked by this call (empty list if
    none) - the caller surfaces these as an "unlocked!" moment in the
    response. Does not commit - the caller commits alongside whatever
    else it changed in the same request."""
    already_earned = {
        row.achievement_id for row in db.query(EarnedAchievement).filter(EarnedAchievement.user_id == user.id).all()
    }

    newly_earned = []
    for achievement_id, definition in ACHIEVEMENTS.items():
        if achievement_id in already_earned:
            continue
        if definition["condition"](db, user, profile):
            db.add(EarnedAchievement(user_id=user.id, achievement_id=achievement_id))
            newly_earned.append({"id": achievement_id, **{k: v for k, v in definition.items() if k != "condition"}})

    return newly_earned


def award_for_lesson_completed(db: Session, user: User) -> dict:
    """Does not commit - the caller (modules/learn/router.py) commits
    alongside the LessonProgress/Certificate changes already in that
    request."""
    profile = get_or_create_profile(db, user.id)
    profile.xp_points += XP_PER_LESSON
    _record_activity(profile)
    newly_earned = check_and_award_achievements(db, user, profile)
    return {"xp_awarded": XP_PER_LESSON, "total_xp": profile.xp_points, "new_achievements": newly_earned}


def award_for_quiz_completed(db: Session, user: User, correct_count: int) -> dict:
    """Does not commit - the caller (modules/practice/router.py) commits
    alongside the QuizAttempt/mastery changes already in that request."""
    profile = get_or_create_profile(db, user.id)
    xp = XP_PER_QUIZ_BASE + XP_PER_CORRECT_ANSWER * correct_count
    profile.xp_points += xp
    _record_activity(profile)
    newly_earned = check_and_award_achievements(db, user, profile)
    return {"xp_awarded": xp, "total_xp": profile.xp_points, "new_achievements": newly_earned}
