from datetime import date, datetime, timezone

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from core.database import Base


class Flashcard(Base):
    """A student-created flashcard reviewed via spaced repetition (SM-2 -
    see modules/flashcards/spaced_repetition.py). Content is whatever the
    student is studying - not auto-generated from the practice bank or
    vocabulary list, since a student's own weak spots are usually more
    specific than either of those (a phrase from a textbook, a formula,
    a date) - unlike Word of the Day or practice questions, this is
    inherently per-student content, not shared/static."""

    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)

    # SM-2 spaced-repetition state. A brand-new card is due immediately
    # (due_date defaults to today) so it shows up in the very next review
    # session rather than waiting a day.
    ease_factor = Column(Float, nullable=False, default=2.5)
    interval_days = Column(Integer, nullable=False, default=0)
    repetitions = Column(Integer, nullable=False, default=0)
    due_date = Column(Date, default=lambda: datetime.now(timezone.utc).date())
    last_reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="flashcards")


def today_utc() -> date:
    return datetime.now(timezone.utc).date()
