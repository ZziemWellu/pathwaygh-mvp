from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from core.database import Base


class SkillMastery(Base):
    __tablename__ = "skill_masteries"
    __table_args__ = (UniqueConstraint("user_id", "subject_id", "topic_id", name="uq_mastery_user_subject_topic"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(String(100), nullable=False)
    topic_id = Column(String(100), nullable=False)
    # Bayesian Knowledge Tracing estimate: probability the student has
    # mastered this topic. Starts at a fixed prior and updates per attempt -
    # see modules/practice/mastery.py.
    mastery_probability = Column(Float, nullable=False, default=0.3)
    attempts_count = Column(Integer, nullable=False, default=0)
    last_updated = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="skill_masteries")
