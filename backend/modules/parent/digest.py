"""
Content generation and eligibility for the parent WhatsApp digest. Reuses
the same real aggregation the dashboard/school-admin/impact features
already rely on - no new queries duplicating what overview_for_users and
the weak-topics lookup already compute correctly.
"""

from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from models.skill_mastery import SkillMastery
from models.user import User
from modules.dashboard.aggregation import overview_for_users
from modules.practice.mastery import topic_names_by_id

DIGEST_COOLDOWN_DAYS = 6
MAX_WEAK_TOPICS_MENTIONED = 2


def build_digest_text(db: Session, user: User) -> Optional[str]:
    overview = overview_for_users(db, [user.id])[user.id]
    if overview["courses_enrolled"] == 0 and overview["quizzes_taken"] == 0:
        # Nothing meaningful to report yet - don't send a content-free message.
        return None

    lines = [f"PathwayGH weekly update for {user.full_name}:"]

    if overview["lessons_total"] > 0:
        lines.append(f"- Lessons completed: {overview['lessons_completed']}/{overview['lessons_total']}")
    if overview["quizzes_taken"] > 0:
        lines.append(f"- Quizzes taken: {overview['quizzes_taken']}, average score: {overview['average_quiz_score']}%")

    weak_masteries = (
        db.query(SkillMastery)
        .filter(SkillMastery.user_id == user.id, SkillMastery.mastery_probability < 0.5)
        .order_by(SkillMastery.mastery_probability.asc())
        .limit(MAX_WEAK_TOPICS_MENTIONED)
        .all()
    )
    if weak_masteries:
        topic_names = topic_names_by_id()
        names = [topic_names.get(m.topic_id, m.topic_id) for m in weak_masteries]
        lines.append(f"- Could use more practice on: {', '.join(names)}")

    return "\n".join(lines)


def eligible_users_for_digest(db: Session) -> List[User]:
    cutoff = datetime.utcnow() - timedelta(days=DIGEST_COOLDOWN_DAYS)
    return (
        db.query(User)
        .filter(
            User.guardian_phone.isnot(None),
            User.guardian_whatsapp_opt_in.is_(True),
            (User.last_digest_sent_at.is_(None)) | (User.last_digest_sent_at < cutoff),
        )
        .all()
    )
