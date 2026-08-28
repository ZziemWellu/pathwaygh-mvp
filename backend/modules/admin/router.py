"""
Admin Module Router - content-authoring CRUD for courses, lessons, and
exercises. Every route requires require_admin (a real is_admin flag on
the User row, set manually in the database - no self-service signup).
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import require_admin
from models.course import Course, Exercise, Lesson
from models.user import User

router = APIRouter(tags=["admin"])


# ============================================================
# Response helpers
# ============================================================

def _course_out(course: Course) -> dict:
    return {
        "id": course.id,
        "slug": course.slug,
        "title": course.title,
        "description": course.description,
        "level": course.level,
        "lesson_count": len(course.lessons),
    }


def _lesson_out(lesson: Lesson) -> dict:
    return {
        "id": lesson.id,
        "course_id": lesson.course_id,
        "slug": lesson.slug,
        "title": lesson.title,
        "description": lesson.description,
        "lesson_type": lesson.lesson_type,
        "order_index": lesson.order_index,
        "is_free_preview": lesson.is_free_preview,
        "duration_minutes": lesson.duration_minutes,
        "video_url": lesson.video_url,
        "video_provider": lesson.video_provider,
        "content": lesson.content,
        "exercise_count": len(lesson.exercises),
    }


def _exercise_out(exercise: Exercise) -> dict:
    # Admin view includes correct_index - the student-facing endpoint
    # in modules/learn/router.py deliberately omits it.
    return {
        "id": exercise.id,
        "lesson_id": exercise.lesson_id,
        "question": exercise.question,
        "options": exercise.options,
        "correct_index": exercise.correct_index,
        "explanation": exercise.explanation,
        "order_index": exercise.order_index,
    }


@router.get("/")
async def admin_root(admin: User = Depends(require_admin)):
    return {"module": "admin", "status": "active", "admin": admin.email}


# ============================================================
# Courses
# ============================================================

class CourseIn(BaseModel):
    slug: str
    title: str
    description: Optional[str] = None
    level: str


@router.get("/courses")
async def list_courses(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return [_course_out(c) for c in db.query(Course).all()]


@router.post("/courses")
async def create_course(payload: CourseIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if db.query(Course).filter(Course.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="A course with this slug already exists")
    course = Course(**payload.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return _course_out(course)


@router.get("/courses/{course_id}")
async def get_course(course_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return {**_course_out(course), "lessons": [_lesson_out(l) for l in course.lessons]}


@router.put("/courses/{course_id}")
async def update_course(course_id: int, payload: CourseIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for field, value in payload.model_dump().items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return _course_out(course)


@router.delete("/courses/{course_id}")
async def delete_course(course_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"success": True}


# ============================================================
# Lessons
# ============================================================

class LessonIn(BaseModel):
    course_id: int
    slug: str
    title: str
    description: Optional[str] = None
    lesson_type: str = "video"
    order_index: int = 0
    is_free_preview: bool = False
    duration_minutes: Optional[int] = None
    video_url: Optional[str] = None
    video_provider: Optional[str] = None
    content: Optional[str] = None


@router.get("/courses/{course_id}/lessons")
async def list_lessons(course_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return [_lesson_out(l) for l in course.lessons]


@router.post("/lessons")
async def create_lesson(payload: LessonIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if not db.query(Course).filter(Course.id == payload.course_id).first():
        raise HTTPException(status_code=404, detail="Course not found")
    lesson = Lesson(**payload.model_dump())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return _lesson_out(lesson)


@router.get("/lessons/{lesson_id}")
async def get_lesson(lesson_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return {**_lesson_out(lesson), "exercises": [_exercise_out(e) for e in lesson.exercises]}


@router.put("/lessons/{lesson_id}")
async def update_lesson(lesson_id: int, payload: LessonIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    for field, value in payload.model_dump().items():
        setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    return _lesson_out(lesson)


@router.delete("/lessons/{lesson_id}")
async def delete_lesson(lesson_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    db.delete(lesson)
    db.commit()
    return {"success": True}


# ============================================================
# Exercises
# ============================================================

class ExerciseIn(BaseModel):
    lesson_id: int
    question: str
    options: List[str]
    correct_index: int
    explanation: Optional[str] = None
    order_index: int = 0


@router.get("/lessons/{lesson_id}/exercises")
async def list_exercises(lesson_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return [_exercise_out(e) for e in lesson.exercises]


@router.post("/exercises")
async def create_exercise(payload: ExerciseIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if not db.query(Lesson).filter(Lesson.id == payload.lesson_id).first():
        raise HTTPException(status_code=404, detail="Lesson not found")
    if not (0 <= payload.correct_index < len(payload.options)):
        raise HTTPException(status_code=400, detail="correct_index must be a valid index into options")
    exercise = Exercise(**payload.model_dump())
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return _exercise_out(exercise)


@router.put("/exercises/{exercise_id}")
async def update_exercise(exercise_id: int, payload: ExerciseIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    if not (0 <= payload.correct_index < len(payload.options)):
        raise HTTPException(status_code=400, detail="correct_index must be a valid index into options")
    for field, value in payload.model_dump().items():
        setattr(exercise, field, value)
    db.commit()
    db.refresh(exercise)
    return _exercise_out(exercise)


@router.delete("/exercises/{exercise_id}")
async def delete_exercise(exercise_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    db.delete(exercise)
    db.commit()
    return {"success": True}


class ReorderRequest(BaseModel):
    exercise_ids: List[int]  # in desired order


@router.post("/lessons/{lesson_id}/exercises/reorder")
async def reorder_exercises(lesson_id: int, payload: ReorderRequest, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    exercises_by_id = {e.id: e for e in lesson.exercises}
    if set(payload.exercise_ids) != set(exercises_by_id.keys()):
        raise HTTPException(status_code=400, detail="exercise_ids must match exactly the lesson's existing exercises")
    for index, exercise_id in enumerate(payload.exercise_ids):
        exercises_by_id[exercise_id].order_index = index
    db.commit()
    return [_exercise_out(exercises_by_id[eid]) for eid in payload.exercise_ids]
