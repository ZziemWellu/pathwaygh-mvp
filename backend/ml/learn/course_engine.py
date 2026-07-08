"""
Course Engine - Manages courses, lessons, and learning content
"""

import json
import uuid
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class CourseEngine:
    """Manages all course-related operations"""
    
    def __init__(self):
        self.data_dir = Path("backend/data/courses")
        self._ensure_directories()
        self.courses = {}
        self._load_all_courses()
        logger.info(f"✅ CourseEngine initialized with {len(self.courses)} courses")
    
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
                            logger.info(f"  ✅ Loaded course: {course.get('title')} ({course_id})")
                    except Exception as e:
                        logger.warning(f"Failed to load course {course_file}: {e}")
        
        if not self.courses:
            logger.warning("⚠️ No courses found. Creating sample courses...")
            self._create_sample_courses()
    
    def _create_sample_courses(self):
        """Create sample courses if none exist"""
        sample_courses = [
            {
                "id": "sample_english_001",
                "slug": "sample-english",
                "title": "Sample English Course",
                "level": "jhs",
                "subject": "English",
                "description": "Sample English course for testing.",
                "difficulty_level": "Beginner",
                "duration_hours": 10,
                "is_published": True,
                "enrollment_count": 0,
                "rating": 0,
                "lessons": [
                    {"id": "sample_english_l1", "title": "Introduction", "description": "Welcome to the course.", "lesson_type": "video", "duration_minutes": 10, "order_index": 1, "is_free_preview": True}
                ]
            },
            {
                "id": "sample_math_001",
                "slug": "sample-math",
                "title": "Sample Math Course",
                "level": "jhs",
                "subject": "Mathematics",
                "description": "Sample Math course for testing.",
                "difficulty_level": "Beginner",
                "duration_hours": 10,
                "is_published": True,
                "enrollment_count": 0,
                "rating": 0,
                "lessons": [
                    {"id": "sample_math_l1", "title": "Introduction", "description": "Welcome to the course.", "lesson_type": "video", "duration_minutes": 10, "order_index": 1, "is_free_preview": True}
                ]
            }
        ]
        
        for course in sample_courses:
            course_id = course["id"]
            self.courses[course_id] = course
            # Save to file
            level = course.get("level", "jhs")
            file_path = self.data_dir / level / f"{course_id}.json"
            with open(file_path, 'w') as f:
                json.dump(course, f, indent=2)
            logger.info(f"  ✅ Created sample course: {course.get('title')}")
    
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
        
        level = course_data.get("level", "shs").lower()
        if level not in ["jhs", "shs", "skills"]:
            level = "shs"
        
        file_path = self.data_dir / level / f"{course_id}.json"
        with open(file_path, 'w') as f:
            json.dump(course_data, f, indent=2)
        
        self.courses[course_id] = course_data
        logger.info(f"✅ Created course: {course_data.get('title')} ({course_id})")
        return course_data

# Singleton instance
course_engine = CourseEngine()
