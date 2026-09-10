from sqlalchemy import JSON, Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from core.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    level = Column(String(50), nullable=False)  # jhs, shs, skills, tvet
    country = Column(String(2), nullable=False, default="GH")

    lessons = relationship(
        "Lesson", back_populates="course", cascade="all, delete-orphan", order_by="Lesson.order_index"
    )
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    # No cascade delete: a course with issued certificates must not have
    # them silently disappear if the course is deleted (see the delete
    # guard in modules/admin/router.py).
    certificates = relationship("Certificate", back_populates="course")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    slug = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    lesson_type = Column(String(20), nullable=False, default="video")  # video, text, quiz
    order_index = Column(Integer, nullable=False, default=0)
    is_free_preview = Column(Boolean, nullable=False, default=False)
    duration_minutes = Column(Integer, nullable=True)

    # Video-specific fields (null for non-video lessons)
    video_url = Column(String(500), nullable=True)
    video_provider = Column(String(20), nullable=True)  # youtube, vimeo
    duration_seconds = Column(Integer, nullable=True)

    # Text-lesson body (markdown), null for video-only lessons
    content = Column(Text, nullable=True)

    course = relationship("Course", back_populates="lessons")
    progress_entries = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")
    exercises = relationship(
        "Exercise", back_populates="lesson", cascade="all, delete-orphan", order_by="Exercise.order_index"
    )


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # list of strings
    correct_index = Column(Integer, nullable=False)  # index into options
    explanation = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False, default=0)

    lesson = relationship("Lesson", back_populates="exercises")
