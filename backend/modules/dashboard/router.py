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
from models.skill_mastery import SkillMastery
from models.user import User
from modules.dashboard.aggregation import overview_for_users
from modules.practice.mastery import topic_names_by_id

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
    by_subject: dict = {}
    for a in quiz_attempts:
        if a.subject_id:
            by_subject.setdefault(a.subject_id, []).append(a.score)
    weak_subjects = sorted(
        (subject for subject, scores in by_subject.items() if sum(scores) / len(scores) < 70),
        key=lambda subject: sum(by_subject[subject]) / len(by_subject[subject]),
    )

    # Additive to weak_subjects above (kept unchanged) - real per-skill
    # mastery from the adaptive learning engine, once attempts exist.
    topic_names = topic_names_by_id()
    weak_masteries = (
        db.query(SkillMastery)
        .filter(SkillMastery.user_id == current_user.id, SkillMastery.mastery_probability < 0.5)
        .order_by(SkillMastery.mastery_probability.asc())
        .all()
    )
    weak_topics = [
        {"subject_id": m.subject_id, "topic_id": m.topic_id, "topic_name": topic_names.get(m.topic_id, m.topic_id)}
        for m in weak_masteries
    ]

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

    overview = overview_for_users(db, [current_user.id])[current_user.id]

    return {
        "success": True,
        "overview": overview,
        "current_courses": current_courses,
        "continue_learning": continue_learning,
        "weak_subjects": weak_subjects,
        "weak_topics": weak_topics,
        "recent_activity": recent_activity[:6],
    }
