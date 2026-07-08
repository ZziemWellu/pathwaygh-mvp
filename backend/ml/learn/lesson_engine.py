"""
Lesson Engine - Manages individual lessons and content delivery
"""

import json
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class LessonEngine:
    """
    Manages lesson operations
    """
    
    def __init__(self):
        self.data_dir = Path("backend/data/courses")
        self.lessons_cache = {}
    
    def get_lessons_by_course(self, course_id: str) -> List[Dict]:
        """Get all lessons for a course"""
        # Check if lessons are embedded in course file
        for level_dir in self.data_dir.iterdir():
            if level_dir.is_dir():
                course_file = level_dir / f"{course_id}.json"
                if course_file.exists():
                    with open(course_file, 'r') as f:
                        course = json.load(f)
                        return course.get("lessons", [])
        
        return []
    
    def get_lesson(self, lesson_id: str) -> Optional[Dict]:
        """Get a single lesson by ID"""
        # Search through all courses for the lesson
        for level_dir in self.data_dir.iterdir():
            if level_dir.is_dir():
                for course_file in level_dir.glob("*.json"):
                    try:
                        with open(course_file, 'r') as f:
                            course = json.load(f)
                            for lesson in course.get("lessons", []):
                                if lesson.get("id") == lesson_id:
                                    return lesson
                    except:
                        continue
        return None
    
    def create_lesson(self, course_id: str, lesson_data: Dict) -> Dict:
        """Create a new lesson in a course"""
        lesson_id = lesson_data.get("id") or f"lesson_{course_id}_{int(datetime.now().timestamp())}"
        lesson_data["id"] = lesson_id
        lesson_data["created_at"] = datetime.now().isoformat()
        
        # Find and update the course
        for level_dir in self.data_dir.iterdir():
            if level_dir.is_dir():
                course_file = level_dir / f"{course_id}.json"
                if course_file.exists():
                    with open(course_file, 'r') as f:
                        course = json.load(f)
                    
                    if "lessons" not in course:
                        course["lessons"] = []
                    course["lessons"].append(lesson_data)
                    
                    with open(course_file, 'w') as f:
                        json.dump(course, f, indent=2)
                    
                    logger.info(f"✅ Added lesson to course {course_id}: {lesson_data.get('title')}")
                    return lesson_data
        
        logger.error(f"❌ Course not found: {course_id}")
        return None

lesson_engine = LessonEngine()
