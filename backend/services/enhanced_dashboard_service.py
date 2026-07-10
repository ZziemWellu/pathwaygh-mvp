from typing import Dict, List
from datetime import datetime
from services.data_service import data_service
from services.activity_service import activity_service

class EnhancedDashboardService:
    def get_dashboard(self, user_id: str) -> Dict:
        activities = activity_service.get_activities(user_id, limit=10)
        courses = data_service.get_courses()
        
        return {
            "greeting": self._get_greeting(),
            "progress": self._calculate_progress(user_id, courses),
            "recommendations": self._get_recommendations(),
            "activities": self._format_activities(activities),
            "insights": self._get_insights(),
            "quick_actions": self._get_quick_actions()
        }
    
    def _get_greeting(self) -> str:
        hour = datetime.now().hour
        time = "Good Morning" if hour < 12 else "Good Afternoon" if hour < 17 else "Good Evening"
        return f"{time}, Student!"
    
    def _calculate_progress(self, user_id: str, courses: List[Dict]) -> Dict:
        total_lessons = 0
        for course in courses:
            if "modules" in course:
                for module in course.get("modules", []):
                    total_lessons += len(module.get("lessons", []))
            elif "lessons" in course:
                total_lessons += len(course.get("lessons", []))
        
        activities = activity_service.get_activities(user_id, limit=100)
        completed = len([a for a in activities if a["type"] == "lesson_complete"])
        overall = int((completed / max(total_lessons, 1)) * 100)
        
        return {"overall": min(overall, 100), "completed": completed, "total": total_lessons}
    
    def _get_recommendations(self) -> List[Dict]:
        return [
            {"title": "Medical Doctor", "description": "Healthcare", "confidence": 92},
            {"title": "Software Engineer", "description": "Technology", "confidence": 88},
            {"title": "Civil Engineer", "description": "Engineering", "confidence": 85}
        ]
    
    def _format_activities(self, activities: List[Dict]) -> List[Dict]:
        formatted = []
        for act in activities[:5]:
            if act["type"] == "lesson_complete":
                formatted.append({"type": "lesson", "action": "Finished Lesson", "time": "Recently", "icon": "✅"})
            elif act["type"] == "career_save":
                formatted.append({"type": "career", "action": "Saved Career", "time": "Recently", "icon": "💾"})
            elif act["type"] == "ai_interaction":
                formatted.append({"type": "ai", "action": "Asked AI Tutor", "time": "Recently", "icon": "🤖"})
        return formatted
    
    def _get_insights(self) -> Dict:
        return {"aggregate": 12, "admission_chance": 72, "weak_subjects": ["Physics", "Chemistry"]}
    
    def _get_quick_actions(self) -> List[Dict]:
        return [
            {"icon": "📚", "label": "Learn", "path": "/learn"},
            {"icon": "🎯", "label": "Career Match", "path": "/explore"},
            {"icon": "🏛️", "label": "Universities", "path": "/opportunities"},
            {"icon": "💰", "label": "Scholarships", "path": "/opportunities"}
        ]

enhanced_dashboard_service = EnhancedDashboardService()
