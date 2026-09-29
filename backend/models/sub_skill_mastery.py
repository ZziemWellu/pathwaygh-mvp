from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from core.database import Base


class SubSkillMastery(Base):
    """Finer-grained companion to SkillMastery: BKT mastery tracked per
    sub_skill (e.g. "linear_equations" within the "algebra" topic) rather
    than per whole topic. A separate table rather than a nullable column
    on SkillMastery, so the existing topic-level unique constraint isn't
    weakened by NULL-vs-NULL ambiguity, and so topic-level tracking keeps
    working unchanged for any question that has no sub_skill tag."""

    __tablename__ = "sub_skill_masteries"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "subject_id", "topic_id", "sub_skill", name="uq_subskill_mastery_user_subject_topic_subskill"
        ),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(String(100), nullable=False)
    topic_id = Column(String(100), nullable=False)
    sub_skill = Column(String(100), nullable=False)
    mastery_probability = Column(Float, nullable=False, default=0.3)
    attempts_count = Column(Integer, nullable=False, default=0)
    last_updated = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="sub_skill_masteries")
