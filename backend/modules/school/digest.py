"""
Content generation and eligibility for the school-admin WhatsApp digest.
Mirrors modules/parent/digest.py's shape exactly, reusing the same real
aggregation /api/school/dashboard already relies on - no new queries
duplicating overview_for_users/summarize_overviews.
"""

from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from models.school import School
from models.user import User
from modules.dashboard.aggregation import overview_for_users, summarize_overviews

SCHOOL_DIGEST_COOLDOWN_DAYS = 6


def build_school_digest_text(db: Session, admin: User) -> Optional[str]:
    # Excludes admins from the roster this digest reports on - unlike
    # /api/school/dashboard's roster (which intentionally lists everyone,
    # admins included, for display), an admin's own zero activity would
    # otherwise skew "average completion" and make "no real students yet"
    # unreachable, since creating a school always links its creator.
    students = db.query(User).filter(User.school_id == admin.school_id, User.is_school_admin.is_(False)).all()
    if not students:
        return None

    overview_by_user = overview_for_users(db, [s.id for s in students])
    summary = summarize_overviews(list(overview_by_user.values()))
    school = db.query(School).filter(School.id == admin.school_id).first()
    school_name = school.name if school else "your school"

    lines = [
        f"PathwayGH weekly update for {school_name}:",
        f"- Students: {summary['student_count']}",
        f"- Average lesson completion: {summary['average_completion_rate']}%",
    ]
    if summary["quizzes_taken"] > 0:
        lines.append(f"- Quizzes taken: {summary['quizzes_taken']}, average score: {summary['average_quiz_score']}%")

    return "\n".join(lines)


def eligible_admins_for_digest(db: Session) -> List[User]:
    cutoff = datetime.utcnow() - timedelta(days=SCHOOL_DIGEST_COOLDOWN_DAYS)
    return (
        db.query(User)
        .filter(
            User.is_school_admin.is_(True),
            User.school_id.isnot(None),
            User.school_digest_whatsapp_opt_in.is_(True),
            User.phone.isnot(None),
            (User.last_school_digest_sent_at.is_(None)) | (User.last_school_digest_sent_at < cutoff),
        )
        .all()
    )
