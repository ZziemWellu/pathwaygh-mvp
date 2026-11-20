"""Content written in the app or imported by an admin, its review audit trail,
and students' problem reports. See modules/content."""

from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Index, Integer, String, Text

from core.database import Base


def _now():
    return datetime.now(timezone.utc)


class ContentQuestion(Base):
    """A practice question kept in the database rather than the JSON bank:
    imported from a CSV, or drafted by a contributor. load_questions() merges
    these into the bank, so practice treats both alike. Questions that need
    calculating still belong in scripts/build_question_bank.py, where every
    answer is computed and re-checked."""

    __tablename__ = "content_questions"

    id = Column(Integer, primary_key=True)
    # The id students' quizzes and reports use. Unique across the whole bank.
    question_id = Column(String(80), nullable=False, unique=True, index=True)
    subject_id = Column(String(80), nullable=False, index=True)
    topic_id = Column(String(80), nullable=False)
    topic_name = Column(String(255), nullable=False)
    syllabus_topic = Column(String(120), nullable=True, index=True)
    question = Column(Text, nullable=False)
    correct = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # four strings, the correct one among them
    explanation = Column(Text, nullable=False)
    difficulty = Column(String(10), nullable=False, default="medium")
    sub_skill = Column(String(80), nullable=True)
    # See core/drafts.py: pending_review, approved or rejected.
    review_status = Column(String(20), nullable=False, default="pending_review", server_default="pending_review")
    licence = Column(String(40), nullable=False, default="original", server_default="original")
    attribution = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)


class ContentReview(Base):
    """Append-only audit log: who imported, edited, approved or rejected which
    piece of content, and when. For questions in the JSON bank, the latest
    approve/reject here is also what decides whether students see them."""

    __tablename__ = "content_reviews"
    __table_args__ = (Index("ix_content_reviews_item", "item_type", "item_id"),)

    id = Column(Integer, primary_key=True)
    item_type = Column(String(20), nullable=False)  # question, lesson, course, user
    item_id = Column(String(255), nullable=False)  # question id, lesson/course slug, user id
    action = Column(String(20), nullable=False)  # created, imported, edited, approved, rejected, contributor_on, contributor_off
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_now, index=True)


class ContentReport(Base):
    """A student's "Report a problem" on a practice question or a lesson."""

    __tablename__ = "content_reports"
    __table_args__ = (Index("ix_content_reports_item", "item_type", "item_id"),)

    id = Column(Integer, primary_key=True)
    item_type = Column(String(20), nullable=False)  # question, lesson
    item_id = Column(String(255), nullable=False)  # question id or lesson slug
    reason = Column(String(30), nullable=False)
    details = Column(Text, nullable=True)
    reporter_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(20), nullable=False, default="open", server_default="open", index=True)  # open, resolved, dismissed
    resolved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_now, index=True)
