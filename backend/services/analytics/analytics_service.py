"""
Advanced Analytics Service
Mastery graphs, study streaks, predictions
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class AnalyticsService:
    """
    Advanced learning analytics
    """
    
    def __init__(self):
        self.analytics_dir = Path("data/analytics")
        self.analytics_dir.mkdir(parents=True, exist_ok=True)
    
    def track_activity(self, user_id: str, activity_type: str, data: Dict):
        """Track user activity"""
        activity_file = self.analytics_dir / f"{user_id}_activity.json"
        
        activities = []
        if activity_file.exists():
            with open(activity_file, 'r') as f:
                activities = json.load(f)
        
        activities.append({
            "timestamp": datetime.now().isoformat(),
            "type": activity_type,
            "data": data
        })
        
        # Keep last 1000 activities
        if len(activities) > 1000:
            activities = activities[-1000:]
        
        with open(activity_file, 'w') as f:
            json.dump(activities, f, indent=2)
    
    def get_study_streak(self, user_id: str) -> Dict:
        """Calculate study streak"""
        activity_file = self.analytics_dir / f"{user_id}_activity.json"
        if not activity_file.exists():
            return {"streak": 0, "days": []}
        
        with open(activity_file, 'r') as f:
            activities = json.load(f)
        
        # Extract days with activity
        days = set()
        for activity in activities:
            date = datetime.fromisoformat(activity["timestamp"]).date()
            days.add(date)
        
        # Sort days
        sorted_days = sorted(days)
        
        # Calculate streak
        if not sorted_days:
            return {"streak": 0, "days": []}
        
        # Count consecutive days
        streak = 1
        current = sorted_days[-1]
        
        for i in range(len(sorted_days) - 2, -1, -1):
            if (current - sorted_days[i]).days == 1:
                streak += 1
                current = sorted_days[i]
            else:
                break
        
        return {
            "streak": streak,
            "days": len(sorted_days),
            "last_active": sorted_days[-1].isoformat() if sorted_days else None
        }
    
    def get_mastery_graph(self, user_id: str) -> Dict:
        """Generate mastery graph"""
        # Placeholder - in production, use actual data
        return {
            "subjects": {
                "Biology": 72,
                "Chemistry": 65,
                "Physics": 58,
                "Mathematics": 80,
                "English": 70
            },
            "overall": 69
        }
    
    def predict_performance(self, user_id: str) -> Dict:
        """Predict future performance"""
        # Placeholder - in production, use ML
        return {
            "predicted_score": 78,
            "confidence": 85,
            "recommendations": [
                "Focus on Physics",
                "Practice more Chemistry",
                "Review Mathematics concepts"
            ]
        }


# Singleton
analytics_service = AnalyticsService()
