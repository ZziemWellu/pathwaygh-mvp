"""
Course Engine - Manages courses, lessons, and learning content
Follows existing PathwayGH patterns
"""

import json
import uuid
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class CourseEngine:
    """
    Manages all course-related operations
    Follows same pattern as existing PathwayGH ML modules
    """
    
    def __init__(self):
        self.data_dir = Path("backend/data/courses")
        self._ensure_directories()
        self.courses = {}
        self._load_all_courses()
    
    def _ensure_directories(self):
        """Create course directories if they don't exist"""
        for subdir in ["jhs", "shs", "skills"]:
            (self.data_dir / subdir).mkdir(parents=True, exist_ok=True)
    
    def _load_all_courses(self):
        """Load all courses from JSON files into memory"""
        for level_dir in self.data_dir.iterdir():
            if level_dir.is_dir():
                for course_file in level_dir.glob("*.json"):
                    try:
                        with open(course_file, 'r') as f:
                            course = json.load(f)
                            course_id = course.get("id", course_file.stem)
                            self.courses[course_id] = course
                    except Exception as e:
                        logger.warning(f"Failed to load course {course_file}: {e}")
        
        logger.info(f"✅ Loaded {len(self.courses)} courses")
    
    def get_all_courses(self, level: Optional[str] = None, subject: Optional[str] = None) -> List[Dict]:
        """Get all courses with optional filtering"""
        results = []
        for course in self.courses.values():
            if level and course.get("level") != level:
                continue
            if subject and course.get("subject") != subject:
                continue
            results.append(course)
        return results
    
    def get_course(self, course_id: str) -> Optional[Dict]:
        """Get a single course by ID"""
        return self.courses.get(course_id)
    
    def get_course_by_slug(self, slug: str) -> Optional[Dict]:
        """Get a course by slug"""
        for course in self.courses.values():
            if course.get("slug") == slug:
                return course
        return None
    
    def create_course(self, course_data: Dict) -> Dict:
        """Create a new course"""
        course_id = course_data.get("id") or f"course_{uuid.uuid4().hex[:8]}"
        course_data["id"] = course_id
        course_data["created_at"] = datetime.now().isoformat()
        
        # Determine level directory
        level = course_data.get("level", "shs").lower()
        if level not in ["jhs", "shs", "skills"]:
            level = "shs"
        
        # Save to file
        file_path = self.data_dir / level / f"{course_id}.json"
        with open(file_path, 'w') as f:
            json.dump(course_data, f, indent=2)
        
        self.courses[course_id] = course_data
        logger.info(f"✅ Created course: {course_data.get('title')} ({course_id})")
        
        return course_data
    
    def get_course_progress(self, user_id: str, course_id: str) -> Dict:
        """Get a user's progress for a specific course"""
        # Placeholder - integrates with existing progress tracking
        return {
            "user_id": user_id,
            "course_id": course_id,
            "progress_percentage": 0,
            "completed_lessons": [],
            "total_lessons": len(self.courses.get(course_id, {}).get("lessons", []))
        }

# Singleton instance
course_engine = CourseEngine()
