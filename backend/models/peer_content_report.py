from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from core.database import Base


class PeerContentReport(Base):
    """One student's report of a peer_questions or peer_answers row.
    Unique per (reporter, target) so one student can't inflate a post's
    flagged_count by reporting it repeatedly - see
    modules/qa/router.py's COMMUNITY_FLAG_THRESHOLD."""

    __tablename__ = "peer_content_reports"
    __table_args__ = (
        UniqueConstraint("reporter_user_id", "target_type", "target_id", name="uq_peer_report_reporter_target"),
    )

    id = Column(Integer, primary_key=True)
    reporter_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_type = Column(String(10), nullable=False)  # "question" | "answer"
    target_id = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    reporter = relationship("User", back_populates="peer_content_reports")
