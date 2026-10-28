from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from core.database import Base


class PeerQuestion(Base):
    """A student-posted question in the peer Q&A board (inspired by
    SyllabusGH's "Trending Questions"). status starts "pending_review"
    instead of "visible" when modules/qa/moderation.py's cheap first-pass
    filter flags it (profanity, a posted phone number/email) - otherwise
    it's visible immediately, same as a normal forum post."""

    __tablename__ = "peer_questions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subject_id = Column(String(100), nullable=True)
    body = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="visible")  # visible | pending_review | removed
    flagged_count = Column(Integer, nullable=False, default=0)
    moderation_reason = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="peer_questions")
    answers = relationship("PeerAnswer", back_populates="question", cascade="all, delete-orphan")
