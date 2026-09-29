from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from core.database import Base


class GamificationProfile(Base):
    """One row per student. Deliberately minimal compared to SyllabusGH's
    75+ badge wall and daily-spin-wheel mechanics - XP/streaks/badges tied
    to genuine learning activity only, no purchase-linked or randomized-
    reward mechanics, which are the manipulative-engagement patterns a
    platform for minors should avoid rather than copy.

    leaderboard_opt_in is false by default - SyllabusGH's national
    leaderboard shows minors' full real names and schools; this app's
    leaderboard (see modules/gamification/router.py) is opt-in, scoped to
    the student's own school, and shows leaderboard_display_name (a
    student-chosen pseudonym), never full_name."""

    __tablename__ = "gamification_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    xp_points = Column(Integer, nullable=False, default=0)
    current_streak_days = Column(Integer, nullable=False, default=0)
    longest_streak_days = Column(Integer, nullable=False, default=0)
    last_activity_date = Column(Date, nullable=True)
    leaderboard_opt_in = Column(Boolean, nullable=False, default=False)
    leaderboard_display_name = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="gamification_profile")


class EarnedAchievement(Base):
    """One row per (student, achievement) they've unlocked. Achievement
    definitions themselves (name/description/icon/condition) live as a
    static dict in modules/gamification/achievements.py, not in the
    database - they're fixed content, same treatment as the practice
    question bank's structure, not per-user state."""

    __tablename__ = "earned_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_earned_achievement_user_achievement"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(String(50), nullable=False)
    earned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="earned_achievements")


def today_utc() -> date:
    return datetime.now(timezone.utc).date()
