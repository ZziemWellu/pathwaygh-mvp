"""
Unified Data Service - Complete data management
"""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class DataService:
    """Single source of truth for all data access"""
    
    def __init__(self):
        self.data_dir = Path("data")
        self.cache = {}
        self._ensure_directories()
    
    def _ensure_directories(self):
        dirs = [
            "data/courses/jhs",
            "data/courses/shs",
            "data/courses/tvet",
            "data/courses/skills",
            "data/progress",
            "data/enrollments"
        ]
        for d in dirs:
            Path(d).mkdir(parents=True, exist_ok=True)
    
    def get_courses(self, level: Optional[str] = None) -> List[Dict]:
        """Get all courses"""
        courses = []
        course_dirs = ["data/courses/jhs", "data/courses/shs", "data/courses/tvet", "data/courses/skills"]
        
        for dir_path in course_dirs:
            if Path(dir_path).exists():
                for file in Path(dir_path).glob("*.json"):
                    try:
                        with open(file, 'r') as f:
                            course = json.load(f)
                            if not course.get("level"):
                                course["level"] = Path(dir_path).name
                            courses.append(course)
                    except Exception as e:
                        logger.error(f"Error loading {file}: {e}")
        
        if level:
            courses = [c for c in courses if c.get("level") == level]
        
        return courses
    
    def get_course(self, course_id: str) -> Optional[Dict]:
        """Get a specific course by ID"""
        for course in self.get_courses():
            if course.get("id") == course_id or course.get("slug") == course_id:
                return course
        return None
    
    def get_lesson(self, lesson_id: str) -> Optional[Dict]:
        """Get a lesson by ID"""
        for course in self.get_courses():
            for lesson in course.get("lessons", []):
                if lesson.get("id") == lesson_id:
                    return lesson
            for module in course.get("modules", []):
                for lesson in module.get("lessons", []):
                    if lesson.get("id") == lesson_id:
                        return lesson
        return None

data_service = DataService()
