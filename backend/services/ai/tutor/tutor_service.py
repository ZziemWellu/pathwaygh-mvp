"""
AI Tutor Service - Persistent Learning Context
Remembers student history, adapts responses
"""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)


class AITutorService:
    """
    AI Tutor with persistent learning context
    """
    
    def __init__(self):
        self.sessions_dir = Path("data/ai/sessions")
        self.sessions_dir.mkdir(parents=True, exist_ok=True)
        self.memory_dir = Path("data/ai/memory")
        self.memory_dir.mkdir(parents=True, exist_ok=True)
    
    def get_session(self, user_id: str) -> Dict:
        """Get or create a tutoring session for a user"""
        session_file = self.sessions_dir / f"{user_id}.json"
        
        if session_file.exists():
            with open(session_file, 'r') as f:
                return json.load(f)
        
        # Create new session
        session = {
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "conversation": [],
            "knowledge": {
                "subjects": {},
                "skills": {},
                "weak_areas": [],
                "strong_areas": [],
                "progress": {}
            },
            "context": {
                "current_subject": None,
                "current_topic": None,
                "difficulty_level": "medium",
                "learning_style": "mixed"
            }
        }
        
        self._save_session(user_id, session)
        return session
    
    def _save_session(self, user_id: str, session: Dict):
        """Save session to file"""
        session_file = self.sessions_dir / f"{user_id}.json"
        with open(session_file, 'w') as f:
            json.dump(session, f, indent=2)
    
    def add_interaction(self, user_id: str, query: str, response: str, metadata: Dict = None):
        """Add an interaction to the session"""
        session = self.get_session(user_id)
        
        interaction = {
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "response": response,
            "metadata": metadata or {}
        }
        
        session["conversation"].append(interaction)
        session["updated_at"] = datetime.now().isoformat()
        
        # Extract knowledge from interaction
        self._extract_knowledge(user_id, query, response)
        
        self._save_session(user_id, session)
    
    def _extract_knowledge(self, user_id: str, query: str, response: str):
        """Extract knowledge from interaction"""
        session = self.get_session(user_id)
        
        # Simple extraction based on keywords
        query_lower = query.lower()
        
        subjects = ["biology", "chemistry", "physics", "mathematics", "english", "history", "geography", "ict"]
        for subject in subjects:
            if subject in query_lower:
                if subject not in session["knowledge"]["subjects"]:
                    session["knowledge"]["subjects"][subject] = {
                        "interactions": 0,
                        "mastery": 0,
                        "last_accessed": datetime.now().isoformat()
                    }
                session["knowledge"]["subjects"][subject]["interactions"] += 1
        
        self._save_session(user_id, session)
    
    def generate_response(self, user_id: str, query: str) -> Dict:
        """Generate a personalized tutoring response"""
        session = self.get_session(user_id)
        
        # Build context from session
        context = self._build_context(user_id, session)
        
        # Generate response based on context
        response = self._generate_tutoring_response(query, context)
        
        # Save interaction
        self.add_interaction(user_id, query, response)
        
        return {
            "response": response,
            "context": context,
            "session_id": user_id,
            "source": "AI Tutor v2.0"
        }
    
    def _build_context(self, user_id: str, session: Dict) -> Dict:
        """Build context for response generation"""
        return {
            "user_id": user_id,
            "knowledge": session.get("knowledge", {}),
            "context": session.get("context", {}),
            "recent_interactions": session.get("conversation", [])[-5:],
            "interaction_count": len(session.get("conversation", []))
        }
    
    def _generate_tutoring_response(self, query: str, context: Dict) -> str:
        """Generate tutoring response based on context"""
        # This is a placeholder - will be enhanced with RAG and LLM
        query_lower = query.lower()
        
        # Subject-specific responses
        if "biology" in query_lower:
            return "Let me help you with Biology! What specific topic are you studying? Cells, Genetics, Ecology, or Human Anatomy?"
        elif "chemistry" in query_lower:
            return "Great! Let's explore Chemistry together. Are you working on Organic Chemistry, Inorganic Chemistry, or Physical Chemistry?"
        elif "physics" in query_lower:
            return "Physics is fascinating! Are you studying Mechanics, Thermodynamics, Electricity, or Waves and Optics?"
        elif "mathematics" in query_lower or "math" in query_lower:
            return "I love Mathematics! What area are you focusing on? Algebra, Geometry, Calculus, or Statistics?"
        elif "help" in query_lower or "explain" in query_lower:
            return "I'm here to help! Please tell me which subject or topic you'd like to learn about, and I'll provide a personalized explanation."
        else:
            return "I'm your AI Tutor! I can help you with: Biology, Chemistry, Physics, Mathematics, English, History, Geography, and ICT. What would you like to learn today?"
    
    def get_learning_summary(self, user_id: str) -> Dict:
        """Get a summary of the user's learning progress"""
        session = self.get_session(user_id)
        
        subjects = session.get("knowledge", {}).get("subjects", {})
        total_interactions = len(session.get("conversation", []))
        
        return {
            "subjects": subjects,
            "total_interactions": total_interactions,
            "last_active": session.get("updated_at"),
            "strong_areas": self._get_strong_areas(subjects),
            "weak_areas": self._get_weak_areas(subjects)
        }
    
    def _get_strong_areas(self, subjects: Dict) -> List[str]:
        """Identify strong areas based on interactions"""
        return [s for s, data in subjects.items() if data.get("interactions", 0) > 5][:3]
    
    def _get_weak_areas(self, subjects: Dict) -> List[str]:
        """Identify weak areas"""
        return [s for s, data in subjects.items() if data.get("interactions", 0) < 3][:3]


# Singleton
tutor_service = AITutorService()
