from typing import Dict, List
from datetime import datetime
from core.logging.logger import logger

class ActivityService:
    def __init__(self):
        self.activities = []
    
    def log_activity(self, user_id: str, activity_type: str, data: Dict) -> Dict:
        activity = {
            "id": f"act_{len(self.activities) + 1}",
            "user_id": user_id,
            "type": activity_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        self.activities.append(activity)
        return activity
    
    def get_activities(self, user_id: str, limit: int = 10) -> List[Dict]:
        user_activities = [a for a in self.activities if a["user_id"] == user_id]
        user_activities.sort(key=lambda x: x["timestamp"], reverse=True)
        return user_activities[:limit]

activity_service = ActivityService()
