from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship

from core.database import Base


class ExerciseResult(Base):
    __tablename__ = "exercise_results"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    score = Column(Integer, nullable=False)  # percentage 0-100
    correct_count = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
    lesson = relationship("Lesson")
