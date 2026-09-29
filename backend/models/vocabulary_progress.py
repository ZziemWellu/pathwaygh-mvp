from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from core.database import Base


class VocabularyProgress(Base):
    """One row per (student, word) marked learned - the word bank itself
    (data/vocabulary/words.json) is static content, this is the only
    per-user state Word of the Day needs."""

    __tablename__ = "vocabulary_progress"
    __table_args__ = (UniqueConstraint("user_id", "word_id", name="uq_vocabulary_progress_user_word"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    word_id = Column(String(50), nullable=False)
    learned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="vocabulary_progress")
