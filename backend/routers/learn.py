"""
Learning Router - API endpoints for courses and learning
Follows existing PathwayGH router pattern
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging

from ml.learn.course_engine import course_engine
from ml.learn.lesson_engine import lesson_engine
from ml.learn.progress_engine import progress_engine

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================
# Pydantic Models
# ============================================

class CourseCreate(BaseModel):
    title: str
    slug: str
    description: str
    level: str  # jhs, shs, skills
    subject: str
    lessons: Optional[List[Dict]] = []


class LessonCreate(BaseModel):
    title: str
    description: str
    lesson_type: str  # video, text, quiz, interactive
    video_url: Optional[str] = None
    content: Optional[str] = None
    duration_minutes: int = 0
    order_index: int = 0


class ProgressUpdate(BaseModel):
    status: str  # not_started, in_progress, completed
    watched_percentage: Optional[int] = 0
    time_spent_seconds: Optional[int] = 0


# ============================================
# Course Endpoints
# ============================================

@router.get("/courses")
async def get_courses(
    level: Optional[str] = None,
    subject: Optional[str] = None
) -> List[Dict]:
    """Get all courses with optional filtering"""
    return course_engine.get_all_courses(level, subject)


@router.get("/courses/{course_id}")
async def get_course(course_id: str) -> Dict:
    """Get a single course by ID"""
    course = course_engine.get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.get("/courses/{course_id}/lessons")
async def get_course_lessons(course_id: str) -> List[Dict]:
    """Get all lessons for a course"""
    lessons = lesson_engine.get_lessons_by_course(course_id)
    if not lessons:
        # Check if course exists
        course = course_engine.get_course(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        return []
    return lessons


@router.post("/courses")
async def create_course(course_data: CourseCreate) -> Dict:
    """Create a new course"""
    return course_engine.create_course(course_data.dict())


@router.post("/courses/{course_id}/lessons")
async def add_lesson(course_id: str, lesson_data: LessonCreate) -> Dict:
    """Add a lesson to a course"""
    lesson = lesson_engine.create_lesson(course_id, lesson_data.dict())
    if not lesson:
        raise HTTPException(status_code=404, detail="Course not found")
    return lesson


# ============================================
# Progress Endpoints
# ============================================

@router.get("/progress/{user_id}")
async def get_progress(user_id: str) -> Dict:
    """Get overall progress for a user"""
    return progress_engine.get_user_progress(user_id)


@router.get("/progress/{user_id}/{course_id}")
async def get_course_progress(user_id: str, course_id: str) -> Dict:
    """Get progress for a specific course"""
    return progress_engine.get_course_progress(user_id, course_id)


@router.post("/progress/{user_id}/{course_id}/{lesson_id}")
async def update_progress(
    user_id: str,
    course_id: str,
    lesson_id: str,
    progress: ProgressUpdate
) -> Dict:
    """Update progress for a lesson"""
    return progress_engine.update_lesson_progress(
        user_id,
        course_id,
        lesson_id,
        progress.dict()
    )


@router.post("/progress/{user_id}/{course_id}/{lesson_id}/complete")
async def complete_lesson(
    user_id: str,
    course_id: str,
    lesson_id: str
) -> Dict:
    """Mark a lesson as completed"""
    return progress_engine.complete_lesson(user_id, course_id, lesson_id)


print("✅ Learning routes loaded!")
