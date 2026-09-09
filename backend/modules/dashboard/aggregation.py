"""
Bulk per-user overview stats - shared by the individual dashboard summary and
the school roster dashboard so both stay in sync and neither pays an N+1 cost
per student. Runs a fixed 3-4 queries regardless of how many user_ids are
passed in, then groups/aggregates in Python (matching this codebase's existing
"fetch rows, aggregate in Python" convention rather than SQL GROUP BY).
"""

from sqlalchemy.orm import Session

from models.course import Course
from models.enrollment import Enrollment
from models.progress import LessonProgress
from models.quiz_attempt import QuizAttempt


def _empty_overview() -> dict:
    return {
        "courses_enrolled": 0,
        "lessons_completed": 0,
        "lessons_total": 0,
        "quizzes_taken": 0,
        "average_quiz_score": 0,
    }


def overview_for_users(db: Session, user_ids: list) -> dict:
    """Returns {user_id: overview_dict} for every id in user_ids (ids with no
    activity at all still get an entry via _empty_overview)."""
    overview = {uid: _empty_overview() for uid in user_ids}
    if not user_ids:
        return overview

    enrollments = db.query(Enrollment).filter(Enrollment.user_id.in_(user_ids)).all()
    course_ids = {e.course_id for e in enrollments}
    courses = {c.id: c for c in db.query(Course).filter(Course.id.in_(course_ids)).all()}

    enrollments_by_user: dict = {}
    for e in enrollments:
        enrollments_by_user.setdefault(e.user_id, []).append(e)

    watched_lesson_ids_by_user: dict = {}
    for user_id, lesson_id in (
        db.query(LessonProgress.user_id, LessonProgress.lesson_id)
        .filter(LessonProgress.user_id.in_(user_ids), LessonProgress.watched.is_(True))
        .all()
    ):
        watched_lesson_ids_by_user.setdefault(user_id, set()).add(lesson_id)

    quiz_attempts_by_user: dict = {}
    for attempt in db.query(QuizAttempt).filter(QuizAttempt.user_id.in_(user_ids)).all():
        quiz_attempts_by_user.setdefault(attempt.user_id, []).append(attempt)

    for user_id in user_ids:
        user_enrollments = enrollments_by_user.get(user_id, [])
        watched_ids = watched_lesson_ids_by_user.get(user_id, set())
        lessons_completed = 0
        lessons_total = 0
        for e in user_enrollments:
            course = courses.get(e.course_id)
            if not course:
                continue
            lessons_total += len(course.lessons)
            lessons_completed += sum(1 for lesson in course.lessons if lesson.id in watched_ids)

        attempts = quiz_attempts_by_user.get(user_id, [])
        average_quiz_score = round(sum(a.score for a in attempts) / len(attempts)) if attempts else 0

        overview[user_id] = {
            "courses_enrolled": len(user_enrollments),
            "lessons_completed": lessons_completed,
            "lessons_total": lessons_total,
            "quizzes_taken": len(attempts),
            "average_quiz_score": average_quiz_score,
        }

    return overview
