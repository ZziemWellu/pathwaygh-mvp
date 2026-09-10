"""
Shared course-completion check, called from two places: the lesson-progress
endpoint (automatic, on the exact call that crosses 100%) and the standalone
/check endpoint (manual/retroactive, idempotent - covers users who completed
a course before this feature existed, or any edge case where the automatic
trigger doesn't fire). Keeping this in one place means completion logic is
never duplicated between those two entry points.
"""

import secrets
from typing import Optional, Tuple

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.certificate import Certificate
from models.course import Course
from models.progress import LessonProgress
from models.user import User

# Excludes visually ambiguous characters (0/O, 1/I/L), same alphabet
# convention as the school join code - this one is longer (12 chars) since
# it's typed off a printed certificate by a stranger, not during live
# registration, and needs to resist guessing.
CERT_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CERT_CODE_LENGTH = 12


def _generate_certificate_code(db: Session) -> str:
    for _ in range(10):
        code = "".join(secrets.choice(CERT_CODE_ALPHABET) for _ in range(CERT_CODE_LENGTH))
        if not db.query(Certificate).filter(Certificate.code == code).first():
            return code
    raise RuntimeError("Could not generate a unique certificate code, please retry")


def check_and_issue_certificate(db: Session, user: User, course: Course) -> Tuple[Optional[Certificate], bool]:
    """Idempotently checks whether `user` has watched every lesson in `course`.

    Returns (certificate, created):
      - (None, False)          - not complete yet, or course has zero lessons
      - (existing_cert, False) - already certified (no-op)
      - (new_cert, True)       - just crossed 100% on this call

    `created` lets callers fire a one-time completion celebration instead of
    re-announcing an already-issued certificate on every subsequent call.
    """
    existing = (
        db.query(Certificate).filter(Certificate.user_id == user.id, Certificate.course_id == course.id).first()
    )
    if existing:
        return existing, False

    lesson_ids = {lesson.id for lesson in course.lessons}
    if not lesson_ids:
        return None, False  # a course with zero lessons can never "complete"

    watched_ids = {
        row[0]
        for row in db.query(LessonProgress.lesson_id)
        .filter(
            LessonProgress.user_id == user.id,
            LessonProgress.lesson_id.in_(lesson_ids),
            LessonProgress.watched.is_(True),
        )
        .all()
    }
    if not lesson_ids.issubset(watched_ids):
        return None, False

    certificate = Certificate(
        user_id=user.id,
        course_id=course.id,
        code=_generate_certificate_code(db),
        recipient_name=user.full_name,
        course_title=course.title,
        lesson_count=len(lesson_ids),
    )
    db.add(certificate)
    try:
        db.commit()
    except IntegrityError:
        # Race: the auto-trigger and a manual /check call both saw
        # "complete" at once. The unique constraint caught it - fetch and
        # return the winner instead of surfacing a 500.
        db.rollback()
        existing = (
            db.query(Certificate).filter(Certificate.user_id == user.id, Certificate.course_id == course.id).first()
        )
        return existing, False
    db.refresh(certificate)
    return certificate, True
