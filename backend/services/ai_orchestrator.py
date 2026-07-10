"""
AI Orchestrator - Central AI coordination layer
All AI features go through this orchestrator
"""

from typing import List, Dict, Optional, Any
import logging

logger = logging.getLogger(__name__)


class AIOrchestrator:
    """
    Central AI Orchestrator - Routes all AI requests to appropriate engines
    """
    
    def __init__(self):
        self.career_ai = None
        self.learning_ai = None
        self.admission_ai = None
    
    def _get_career_ai(self):
        if not self.career_ai:
            try:
                from ml.smart_recommender import SmartRecommender
                self.career_ai = SmartRecommender()
            except ImportError:
                logger.warning("SmartRecommender not available")
        return self.career_ai
    
    def get_intent(self, query: str) -> str:
        """Detect user intent from query"""
        query_lower = query.lower()
        
        intents = {
            "career": ["career", "job", "work", "profession", "doctor", "engineer", "lawyer"],
            "learning": ["learn", "study", "course", "lesson", "teach", "tutor", "explain"],
            "admission": ["university", "admission", "school", "college", "programme", "cutoff"],
            "scholarship": ["scholarship", "financial", "aid", "grant", "fund", "sponsor"]
        }
        
        for intent, keywords in intents.items():
            if any(kw in query_lower for kw in keywords):
                return intent
        
        return "general"
    
    def process_query(self, user_id: str, query: str, context: Optional[Dict] = None) -> Dict:
        """Process any query through the orchestrator"""
        intent = self.get_intent(query)
        
        return {
            "intent": intent,
            "user_id": user_id,
            "query": query,
            "source": "AI Orchestrator",
            "response": {
                "message": f"Processing {intent} query: {query}",
                "data": {}
            }
        }
    
    def recommend_courses(self, user_id: str, interests: List[str], subjects: List[str]) -> List[Dict]:
        """AI-powered course recommendations"""
        # Placeholder - returns empty list for now
        return []


ai_orchestrator = AIOrchestrator()
