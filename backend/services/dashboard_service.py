"""
Dashboard Service - Centralized dashboard data
"""

from typing import Dict, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class DashboardService:
    """Unified Dashboard Service"""
    
    def __init__(self):
        self.data_service = None
    
    def get_dashboard(self, user_id: str) -> Dict:
        """Get complete dashboard data"""
        return {
            "greeting": self._get_greeting(),
            "progress": self._get_progress(),
            "recommendations": self._get_recommendations(),
            "activities": self._get_activities(),
            "insights": self._get_insights(),
            "quick_actions": self._get_quick_actions(),
            "timestamp": datetime.now().isoformat()
        }
    
    def _get_greeting(self) -> str:
        hour = datetime.now().hour
        time = "Good Morning" if hour < 12 else "Good Afternoon" if hour < 17 else "Good Evening"
        return f"{time}, Student!"
    
    def _get_progress(self) -> Dict:
        return {
            "overall": 66,
            "completed_lessons": 12,
            "total_lessons": 18,
            "streak": 5
        }
    
    def _get_recommendations(self) -> List[Dict]:
        return [
            {"title": "Medical Doctor", "description": "Healthcare", "confidence": 92},
            {"title": "Software Engineer", "description": "Technology", "confidence": 88},
            {"title": "Civil Engineer", "description": "Engineering", "confidence": 85}
        ]
    
    def _get_activities(self) -> List[Dict]:
        return [
            {"type": "lesson", "action": "Finished Lesson 2", "time": "2 hours ago", "icon": "✅"},
            {"type": "ai", "action": "Asked AI Tutor about Biology", "time": "5 hours ago", "icon": "🤖"},
            {"type": "career", "action": "Saved Career: Medical Doctor", "time": "1 day ago", "icon": "💾"}
        ]
    
    def _get_insights(self) -> Dict:
        return {
            "aggregate_prediction": 12,
            "admission_chance": 72,
            "weak_subjects": ["Physics", "Chemistry"],
            "suggested_lessons": ["Physics - Mechanics", "Chemistry - Organic Compounds"]
        }
    
    def _get_quick_actions(self) -> List[Dict]:
        return [
            {"icon": "📚", "label": "Learn", "path": "/learn"},
            {"icon": "🎯", "label": "Career Match", "path": "/explore"},
            {"icon": "🏛️", "label": "Universities", "path": "/opportunities"},
            {"icon": "💰", "label": "Scholarships", "path": "/opportunities"}
        ]


dashboard_service = DashboardService()
