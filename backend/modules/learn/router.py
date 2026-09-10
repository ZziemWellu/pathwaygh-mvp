"""
Learn Module Router - Courses and video lessons, backed by Postgres.
"""

from datetime import datetime, timezone
from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user, get_current_user_optional
from models.course import Course, Exercise, Lesson
from models.enrollment import Enrollment
from models.exercise_result import ExerciseResult
from models.progress import LessonProgress
from models.user import User
from modules.certificates.service import check_and_issue_certificate

router = APIRouter()


def _lesson_out(lesson: Lesson, watched_lesson_ids: set) -> dict:
    return {
        "id": lesson.slug,
        "title": lesson.title,
        "description": lesson.description,
        "lesson_type": lesson.lesson_type,
        "order_index": lesson.order_index,
        "is_free_preview": lesson.is_free_preview,
        "duration_minutes": lesson.duration_minutes,
        "video_url": lesson.video_url,
        "video_provider": lesson.video_provider,
        "content": lesson.content,
        "has_exercises": len(lesson.exercises) > 0,
        "watched": lesson.id in watched_lesson_ids,
    }


def _exercise_out(exercise: Exercise) -> dict:
    # correct_index is deliberately omitted so the client can't read answers
    return {"id": exercise.id, "question": exercise.question, "options": exercise.options}


def _course_out(course: Course, enrolled_ids: set) -> dict:
    return {
        "id": course.slug,
        "title": course.title,
        "description": course.description,
        "level": course.level,
        "country": course.country,
        "lesson_count": len(course.lessons),
        "enrolled": course.id in enrolled_ids,
    }


def _watched_lesson_ids(db: Session, user: Optional[User]) -> set:
    if not user:
        return set()
    rows = db.query(LessonProgress.lesson_id).filter(LessonProgress.user_id == user.id, LessonProgress.watched.is_(True)).all()
    return {r[0] for r in rows}


def _enrolled_course_ids(db: Session, user: Optional[User]) -> set:
    if not user:
        return set()
    rows = db.query(Enrollment.course_id).filter(Enrollment.user_id == user.id).all()
    return {r[0] for r in rows}


@router.get("/")
async def learn_root(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    return {
        "message": "Learn module is active",
        "status": "active",
        "courses_count": len(courses),
        "total_lessons": sum(len(c.lessons) for c in courses),
        "available_levels": sorted({c.level for c in courses}),
    }


@router.get("/courses")
async def get_courses(
    level: Optional[str] = None,
    search: Optional[str] = None,
    country: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    query = db.query(Course)
    if level:
        query = query.filter(Course.level == level)
    if country:
        query = query.filter(Course.country == country)
    if search:
        like = f"%{search.lower()}%"
        query = query.filter(Course.title.ilike(like))

    enrolled_ids = _enrolled_course_ids(db, current_user)
    return [_course_out(c, enrolled_ids) for c in query.all()]


@router.get("/enrolled")
async def get_enrolled_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    enrolled_ids = _enrolled_course_ids(db, current_user)
    courses = db.query(Course).filter(Course.id.in_(enrolled_ids)).all() if enrolled_ids else []
    return [_course_out(c, enrolled_ids) for c in courses]


@router.get("/courses/{course_slug}")
async def get_course(
    course_slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    course = db.query(Course).filter(Course.slug == course_slug).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    watched_ids = _watched_lesson_ids(db, current_user)
    enrolled_ids = _enrolled_course_ids(db, current_user)
    return {
        **_course_out(course, enrolled_ids),
        "lessons": [_lesson_out(lesson, watched_ids) for lesson in course.lessons],
    }


@router.post("/courses/{course_slug}/enroll")
async def enroll_in_course(course_slug: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.slug == course_slug).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = db.query(Enrollment).filter(Enrollment.user_id == current_user.id, Enrollment.course_id == course.id).first()
    if not existing:
        db.add(Enrollment(user_id=current_user.id, course_id=course.id))
        db.commit()

    return {"success": True, "message": "Enrolled successfully"}


@router.get("/lessons/{lesson_slug}")
async def get_lesson(
    lesson_slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    lesson = db.query(Lesson).filter(Lesson.slug == lesson_slug).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    watched_ids = _watched_lesson_ids(db, current_user)
    out = _lesson_out(lesson, watched_ids)

    if lesson.exercises:
        out["exercises"] = [_exercise_out(e) for e in lesson.exercises]
        best_result = None
        if current_user:
            best_result = (
                db.query(ExerciseResult)
                .filter(ExerciseResult.user_id == current_user.id, ExerciseResult.lesson_id == lesson.id)
                .order_by(ExerciseResult.score.desc())
                .first()
            )
        out["best_score"] = best_result.score if best_result else None

    return out


class ExerciseSubmitRequest(BaseModel):
    answers: Dict[int, int]  # exercise_id -> selected option index


@router.post("/lessons/{lesson_slug}/exercises/submit")
async def submit_exercises(
    lesson_slug: str,
    request: ExerciseSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.query(Lesson).filter(Lesson.slug == lesson_slug).first()
    if not lesson or not lesson.exercises:
        raise HTTPException(status_code=404, detail="Lesson or exercises not found")

    exercises_by_id = {e.id: e for e in lesson.exercises}
    correct_count = 0
    results = []
    for exercise in lesson.exercises:
        selected = request.answers.get(exercise.id)
        is_correct = selected == exercise.correct_index
        if is_correct:
            correct_count += 1
        results.append(
            {
                "exercise_id": exercise.id,
                "selected": selected,
                "correct_index": exercise.correct_index,
                "is_correct": is_correct,
                "explanation": exercise.explanation,
            }
        )

    total = len(lesson.exercises)
    score = round((correct_count / total) * 100) if total else 0

    db.add(
        ExerciseResult(
            user_id=current_user.id,
            lesson_id=lesson.id,
            score=score,
            correct_count=correct_count,
            total_questions=total,
        )
    )
    db.commit()

    return {"success": True, "score": score, "correct_count": correct_count, "total_questions": total, "results": results}


class ProgressUpdate(BaseModel):
    watched: bool = True


@router.post("/lessons/{lesson_slug}/progress")
async def update_lesson_progress(
    lesson_slug: str,
    payload: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.query(Lesson).filter(Lesson.slug == lesson_slug).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    progress = (
        db.query(LessonProgress)
        .filter(LessonProgress.user_id == current_user.id, LessonProgress.lesson_id == lesson.id)
        .first()
    )
    if not progress:
        progress = LessonProgress(user_id=current_user.id, lesson_id=lesson.id)
        db.add(progress)

    progress.watched = payload.watched
    progress.watched_at = datetime.now(timezone.utc) if payload.watched else None
    db.commit()

    certificate_issued = False
    certificate_code = None
    if payload.watched:
        certificate, created = check_and_issue_certificate(db, current_user, lesson.course)
        if created:
            certificate_issued = True
            certificate_code = certificate.code

    return {
        "success": True,
        "watched": progress.watched,
        "certificate_issued": certificate_issued,
        "certificate_code": certificate_code,
    }
