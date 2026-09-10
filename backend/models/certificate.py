from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from core.database import Base


class Certificate(Base):
    __tablename__ = "certificates"
    __table_args__ = (UniqueConstraint("user_id", "course_id", name="uq_certificate_user_course"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    code = Column(String(20), unique=True, nullable=False, index=True)

    # Snapshots taken at issuance, never live-joined - a certificate already
    # shared externally must not silently change if the student later edits
    # their profile name or an admin edits the course.
    recipient_name = Column(String(255), nullable=False)
    course_title = Column(String(255), nullable=False)
    lesson_count = Column(Integer, nullable=False)

    issued_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_revoked = Column(Boolean, nullable=False, default=False)

    user = relationship("User", back_populates="certificates")
    course = relationship("Course", back_populates="certificates")
