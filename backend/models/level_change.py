from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from core.database import Base


class LevelChange(Base):
    """Who corrected a student's level, from what to what, and why. A
    correction decides what a child can see, so it leaves a record."""

    __tablename__ = "level_changes"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    changed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    from_level = Column(String(10), nullable=True)
    to_level = Column(String(10), nullable=False)
    reason = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
