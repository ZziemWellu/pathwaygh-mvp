"""
Recommendation Engine - AI-Powered Recommendations
"""

from typing import Dict, List, Optional, Any
import logging
from core.logging.logger import logger

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """AI-powered recommendation engine"""
    
    def __init__(self):
        self.is_loaded = False
        self.career_data = []
        self.university_data = []
    
    def load(self):
        """Load data and models"""
        try:
            # Load career data
            from services.data_service import data_service
            self.career_data = data_service.get_careers()
            self.university_data = data_service.get_universities()
            self.is_loaded = True
            logger.info("RecommendationEngine loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load RecommendationEngine: {e}")
    
    def recommend_careers(
        self,
        user_id: str,
        context: Optional[Dict] = None,
        limit: int = 5
    ) -> List[Dict]:
        """Generate career recommendations"""
        if not self.is_loaded:
            self.load()
        
        # Default recommendations if no data
        default_careers = [
            {"career": "Medical Doctor", "confidence": 92, "field": "Healthcare"},
            {"career": "Software Engineer", "confidence": 88, "field": "Technology"},
            {"career": "Civil Engineer", "confidence": 85, "field": "Engineering"},
            {"career": "Lawyer", "confidence": 82, "field": "Legal"},
            {"career": "Accountant", "confidence": 80, "field": "Business"}
        ]
        
        # Try to get real recommendations
        try:
            from ml.smart_recommender import SmartRecommender
            recommender = SmartRecommender()
            
            # Extract profile from context
            aggregate = 12
            subjects = {}
            interests = {}
            
            if context and context.get("profile"):
                profile = context["profile"]
                if hasattr(profile, "academic") and profile.academic:
                    aggregate = profile.academic.aggregate or 12
                    for subject in profile.academic.subjects or []:
                        subjects[subject] = 70
                if hasattr(profile, "career") and profile.career:
                    for interest in profile.career.interests or []:
                        interests[interest] = 7
            
            result = recommender.recommend(
                aggregate=aggregate,
                subjects=subjects,
                interests=interests
            )
            
            predictions = result.get("predictions", [])
            if predictions:
                return predictions[:limit]
        except Exception as e:
            logger.warning(f"SmartRecommender failed, using defaults: {e}")
        
        return default_careers[:limit]


class ExplainabilityEngine:
    """Explain AI recommendations"""
    
    def explain(self, intent: str, query: str, response: Dict) -> Dict:
        """Generate explanation for AI response"""
        explanation = {
            "why": "This recommendation is based on your profile and query",
            "how": "AI analyzed your interests and academic background",
            "confidence": "High" if response.get("data") else "Medium",
            "factors": ["Academic performance", "Career interests", "Job market demand"]
        }
        
        if intent == "career":
            explanation["details"] = "Careers matched based on your subjects and interests"
        elif intent == "learning":
            explanation["details"] = "Courses recommended based on your learning goals"
        
        return explanation
