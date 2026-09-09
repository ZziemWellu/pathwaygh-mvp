from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from core.database import Base


class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    country = Column(String(2), nullable=False, default="GH")
    join_code = Column(String(16), nullable=False, unique=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
