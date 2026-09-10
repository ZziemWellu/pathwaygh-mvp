from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar_filename = Column(String(255), nullable=True)
    is_admin = Column(Boolean, nullable=False, default=False)
    country = Column(String(2), nullable=False, default="GH")
    language = Column(String(3), nullable=False, default="en")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Institutional linkage. school_id/is_school_admin are the real
    # relational link to a School row; the pre-existing `school` string below
    # is separate self-reported profile text and is left untouched.
    school_id = Column(
        Integer,
        ForeignKey("schools.id", use_alter=True, name="fk_users_school_id"),
        nullable=True,
    )
    is_school_admin = Column(Boolean, nullable=False, default=False)

    # Profile fields
    school = Column(String(255), nullable=True)
    grade = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    interests = Column(JSON, nullable=False, default=list)
    goals = Column(JSON, nullable=False, default=list)
    subjects = Column(JSON, nullable=False, default=list)
    saved_careers = Column(JSON, nullable=False, default=list)
    saved_universities = Column(JSON, nullable=False, default=list)
    saved_scholarships = Column(JSON, nullable=False, default=list)

    enrollments = relationship("Enrollment", back_populates="user", cascade="all, delete-orphan")
    lesson_progress = relationship("LessonProgress", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    plans = relationship("Plan", back_populates="user", cascade="all, delete-orphan")
