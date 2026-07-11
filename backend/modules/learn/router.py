"""
Learn Module Router - Dynamically loads courses from data/courses/
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict
from pathlib import Path
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


def load_all_courses() -> List[Dict]:
    """Load all courses from data/courses/ directory dynamically"""
    courses = []
    course_dirs = [
        "data/courses/jhs",
        "data/courses/shs",
        "data/courses/tvet",
        "data/courses/skills"
    ]
    
    for dir_path in course_dirs:
        path = Path(dir_path)
        if path.exists():
            for file in path.glob("*.json"):
                try:
                    with open(file, 'r') as f:
                        course = json.load(f)
                        if not course.get("level"):
                            course["level"] = path.name
                        # Add lesson count
                        lesson_count = 0
                        if "modules" in course:
                            for module in course.get("modules", []):
                                lesson_count += len(module.get("lessons", []))
                        elif "lessons" in course:
                            lesson_count = len(course.get("lessons", []))
                        course["lesson_count"] = lesson_count
                        courses.append(course)
                except Exception as e:
                    logger.error(f"Error loading course from {file}: {e}")
    
    return courses


# ============================================
# ROOT ENDPOINT - FIX 404
# ============================================

@router.get("/")
async def learn_root():
    """Learn module root endpoint"""
    courses = load_all_courses()
    return {
        "message": "Learn module is active",
        "status": "active",
        "courses_count": len(courses),
        "total_lessons": sum(c.get("lesson_count", 0) for c in courses),
        "available_levels": list(set(c.get("level", "Unknown") for c in courses))
    }


@router.get("/courses")
async def get_courses(
    level: Optional[str] = None,
    subject: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all courses with filters"""
    courses = load_all_courses()
    
    if level:
        courses = [c for c in courses if c.get("level") == level]
    if subject:
        courses = [c for c in courses if c.get("subject") == subject]
    if search:
        search_lower = search.lower()
        courses = [
            c for c in courses 
            if search_lower in c.get("title", "").lower() 
            or search_lower in c.get("description", "").lower()
        ]
    
    return courses


@router.get("/courses/{course_id}")
async def get_course(course_id: str):
    """Get course by ID"""
    courses = load_all_courses()
    for course in courses:
        if course.get("id") == course_id or course.get("slug") == course_id:
            return course
    raise HTTPException(status_code=404, detail="Course not found")


@router.get("/courses/{course_id}/lessons")
async def get_course_lessons(course_id: str):
    """Get all lessons for a course"""
    course = await get_course(course_id)
    
    lessons = []
    if "modules" in course:
        for module in course["modules"]:
            lessons.extend(module.get("lessons", []))
    elif "lessons" in course:
        lessons = course["lessons"]
    
    return sorted(lessons, key=lambda x: x.get("order_index", 0))


@router.get("/lessons/{lesson_id}")
async def get_lesson(lesson_id: str):
    """Get lesson by ID"""
    courses = load_all_courses()
    for course in courses:
        if "modules" in course:
            for module in course["modules"]:
                for lesson in module.get("lessons", []):
                    if lesson.get("id") == lesson_id:
                        return lesson
        if "lessons" in course:
            for lesson in course.get("lessons", []):
                if lesson.get("id") == lesson_id:
                    return lesson
    
    raise HTTPException(status_code=404, detail="Lesson not found")


@router.post("/enroll")
async def enroll_in_course(request: Dict):
    """Enroll a user in a course"""
    return {
        "status": "success",
        "message": "Enrollment feature coming in Sprint 2",
        "data": request
    }


@router.post("/progress/update")
async def update_progress(request: Dict):
    """Update lesson progress"""
    return {
        "status": "success",
        "message": "Progress tracking coming in Sprint 3",
        "data": request
    }


@router.get("/progress/{user_id}")
async def get_user_progress(user_id: str):
    """Get user progress"""
    return {
        "user_id": user_id,
        "progress": [],
        "message": "Progress tracking coming in Sprint 3"
    }


@router.get("/recent/{user_id}")
async def get_recent_activity(user_id: str):
    """Get recent activity"""
    return {
        "user_id": user_id,
        "activities": [],
        "message": "Recent activity coming in Sprint 3"
    }


@router.post("/recommend")
async def get_recommendations(request: Dict):
    """AI-powered course recommendations"""
    return {
        "user_id": request.get("user_id"),
        "recommendations": [],
        "message": "AI recommendations coming in Sprint 3"
    }

print("✅ Learn module loaded with root endpoint")
