from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from core.database import Base


class PeerAnswer(Base):
    """A student-posted reply to a PeerQuestion. Same moderation-state
    shape as PeerQuestion (see modules/qa/moderation.py) - a reply is
    exactly as capable of exposing personal contact info or hosting
    abuse as the question it's replying to."""

    __tablename__ = "peer_answers"

    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey("peer_questions.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    body = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="visible")  # visible | pending_review | removed
    flagged_count = Column(Integer, nullable=False, default=0)
    moderation_reason = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    question = relationship("PeerQuestion", back_populates="answers")
    user = relationship("User", back_populates="peer_answers")
