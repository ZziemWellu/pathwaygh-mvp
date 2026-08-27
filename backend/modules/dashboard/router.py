"""
Dashboard Module Router - real aggregation over enrollments, lesson
progress, and quiz history. No fabricated numbers.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.course import Course, Lesson
from models.enrollment import Enrollment
from models.progress import LessonProgress
from models.quiz_attempt import QuizAttempt
from models.user import User

router = APIRouter(tags=["dashboard"])


@router.get("/")
async def dashboard_root():
    return {"module": "dashboard", "status": "active"}


@router.get("/summary")
async def get_dashboard_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    enrollments = db.query(Enrollment).filter(Enrollment.user_id == current_user.id).all()
    watched_lesson_ids = {
        r[0]
        for r in db.query(LessonProgress.lesson_id)
        .filter(LessonProgress.user_id == current_user.id, LessonProgress.watched.is_(True))
        .all()
    }

    current_courses = []
    continue_learning = None
    for enrollment in enrollments:
        course = db.query(Course).filter(Course.id == enrollment.course_id).first()
        if not course:
            continue
        lessons = sorted(course.lessons, key=lambda l: l.order_index)
        watched_count = sum(1 for l in lessons if l.id in watched_lesson_ids)
        progress_pct = round((watched_count / len(lessons)) * 100) if lessons else 0
        current_courses.append(
            {
                "id": course.slug,
                "title": course.title,
                "level": course.level,
                "progress": progress_pct,
                "lessons_completed": watched_count,
                "lessons_total": len(lessons),
            }
        )
        if continue_learning is None:
            next_lesson = next((l for l in lessons if l.id not in watched_lesson_ids), None)
            if next_lesson:
                continue_learning = {
                    "course_id": course.slug,
                    "course_title": course.title,
                    "lesson_id": next_lesson.slug,
                    "lesson_title": next_lesson.title,
                }

    quiz_attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .all()
    )
    quiz_stats = {
        "total_quizzes": len(quiz_attempts),
        "average_score": round(sum(a.score for a in quiz_attempts) / len(quiz_attempts)) if quiz_attempts else 0,
    }

    by_subject: dict = {}
    for a in quiz_attempts:
        if a.subject_id:
            by_subject.setdefault(a.subject_id, []).append(a.score)
    weak_subjects = sorted(
        (subject for subject, scores in by_subject.items() if sum(scores) / len(scores) < 70),
        key=lambda subject: sum(by_subject[subject]) / len(by_subject[subject]),
    )

    recent_activity = []
    for progress in (
        db.query(LessonProgress)
        .filter(LessonProgress.user_id == current_user.id, LessonProgress.watched.is_(True))
        .order_by(LessonProgress.watched_at.desc())
        .limit(5)
        .all()
    ):
        lesson = db.query(Lesson).filter(Lesson.id == progress.lesson_id).first()
        if lesson:
            recent_activity.append(
                {"type": "lesson", "title": f"Completed: {lesson.title}", "time": progress.watched_at.isoformat() if progress.watched_at else None}
            )
    for attempt in quiz_attempts[:5]:
        recent_activity.append(
            {
                "type": "quiz",
                "title": f"Scored {attempt.score}% on a quiz" + (f" ({attempt.subject_id})" if attempt.subject_id else ""),
                "time": attempt.completed_at.isoformat() if attempt.completed_at else None,
            }
        )
    recent_activity.sort(key=lambda a: a["time"] or "", reverse=True)

    total_lessons_watched = len(watched_lesson_ids)
    total_lessons_available = sum(len(c.lessons) for c in [db.query(Course).filter(Course.id == e.course_id).first() for e in enrollments] if c)

    return {
        "success": True,
        "overview": {
            "courses_enrolled": len(enrollments),
            "lessons_completed": total_lessons_watched,
            "lessons_total": total_lessons_available,
            "quizzes_taken": quiz_stats["total_quizzes"],
            "average_quiz_score": quiz_stats["average_score"],
        },
        "current_courses": current_courses,
        "continue_learning": continue_learning,
        "weak_subjects": weak_subjects,
        "recent_activity": recent_activity[:6],
    }
