"""
Progress Engine - Tracks learning progress
Integrates with existing PathwayGH progress tracking
"""

from typing import Dict, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ProgressEngine:
    """
    Manages user progress through courses and lessons
    """
    
    def __init__(self):
        # In-memory storage (future: connect to database)
        self.progress_store = {}
    
    def get_user_progress(self, user_id: str) -> Dict:
        """Get overall progress for a user"""
        return self.progress_store.get(user_id, {
            "user_id": user_id,
            "courses": {},
            "total_time_spent": 0,
            "last_activity": None
        })
    
    def update_lesson_progress(
        self,
        user_id: str,
        course_id: str,
        lesson_id: str,
        progress_data: Dict
    ) -> Dict:
        """Update progress for a specific lesson"""
        if user_id not in self.progress_store:
            self.progress_store[user_id] = {
                "user_id": user_id,
                "courses": {},
                "total_time_spent": 0,
                "last_activity": datetime.now().isoformat()
            }
        
        user_progress = self.progress_store[user_id]
        
        if course_id not in user_progress["courses"]:
            user_progress["courses"][course_id] = {
                "lessons": {},
                "progress_percentage": 0,
                "started_at": datetime.now().isoformat()
            }
        
        course_progress = user_progress["courses"][course_id]
        course_progress["lessons"][lesson_id] = {
            **progress_data,
            "updated_at": datetime.now().isoformat()
        }
        
        # Update overall progress
        user_progress["last_activity"] = datetime.now().isoformat()
        
        return user_progress
    
    def get_course_progress(self, user_id: str, course_id: str) -> Dict:
        """Get progress for a specific course"""
        user_progress = self.get_user_progress(user_id)
        return user_progress["courses"].get(course_id, {})
    
    def complete_lesson(self, user_id: str, course_id: str, lesson_id: str) -> Dict:
        """Mark a lesson as completed"""
        return self.update_lesson_progress(
            user_id,
            course_id,
            lesson_id,
            {"status": "completed", "completed_at": datetime.now().isoformat()}
        )

progress_engine = ProgressEngine()
