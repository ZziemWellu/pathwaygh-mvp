"""
Learn Module Router - Dynamically loads courses from data/courses/
FIXED: Correct file paths
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict
from pathlib import Path
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent

def load_all_courses() -> List[Dict]:
    """Load all courses from data/courses/ directory dynamically"""
    courses = []
    
    # FIX: Use absolute path from project root
    base_path = PROJECT_ROOT / "data" / "courses"
    
    if not base_path.exists():
        logger.warning(f"Course directory not found: {base_path}")
        return courses
    
    # Walk through all subdirectories
    for level_dir in base_path.iterdir():
        if level_dir.is_dir():
            for file in level_dir.glob("*.json"):
                try:
                    with open(file, 'r') as f:
                        course = json.load(f)
                        # Ensure level is set
                        if not course.get("level"):
                            course["level"] = level_dir.name
                        # Calculate lesson count
                        lesson_count = 0
                        if "modules" in course:
                            for module in course.get("modules", []):
                                lesson_count += len(module.get("lessons", []))
                        elif "lessons" in course:
                            lesson_count = len(course.get("lessons", []))
                        course["lesson_count"] = lesson_count
                        courses.append(course)
                        logger.info(f"✅ Loaded course: {course.get('title', file.name)}")
                except Exception as e:
                    logger.error(f"Error loading course from {file}: {e}")
    
    logger.info(f"📚 Total courses loaded: {len(courses)}")
    return courses


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
        "message": "Enrollment feature coming soon",
        "data": request
    }


@router.post("/progress/update")
async def update_progress(request: Dict):
    """Update lesson progress"""
    return {
        "status": "success",
        "message": "Progress tracking coming soon",
        "data": request
    }


@router.get("/progress/{user_id}")
async def get_user_progress(user_id: str):
    """Get user progress"""
    return {
        "user_id": user_id,
        "progress": [],
        "message": "Progress tracking coming soon"
    }


@router.get("/recent/{user_id}")
async def get_recent_activity(user_id: str):
    """Get recent activity"""
    return {
        "user_id": user_id,
        "activities": [],
        "message": "Recent activity coming soon"
    }


@router.post("/recommend")
async def get_recommendations(request: Dict):
    """AI-powered course recommendations"""
    return {
        "user_id": request.get("user_id"),
        "recommendations": [],
        "message": "AI recommendations coming soon"
    }

print("✅ Learn module loaded with root endpoint")
