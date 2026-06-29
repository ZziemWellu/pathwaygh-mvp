"""
Conversational Memory Engine
Stores and retrieves conversation context for personalized responses
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from collections import defaultdict

class ConversationMemory:
    def __init__(self):
        # In-memory storage (replace with Redis/DB in production)
        self.sessions = defaultdict(lambda: {
            "messages": [],
            "context": {},
            "created_at": datetime.now(),
            "last_active": datetime.now()
        })
        self.max_messages = 20
        self.expiry_hours = 24
    
    def create_session(self) -> str:
        """Create a new conversation session"""
        session_id = str(uuid.uuid4())[:8]
        self.sessions[session_id] = {
            "messages": [],
            "context": {},
            "created_at": datetime.now(),
            "last_active": datetime.now()
        }
        return session_id
    
    def add_message(self, session_id: str, role: str, content: str, metadata: Dict = None):
        """Add a message to conversation history"""
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "messages": [],
                "context": {},
                "created_at": datetime.now(),
                "last_active": datetime.now()
            }
        
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        
        self.sessions[session_id]["messages"].append(message)
        self.sessions[session_id]["last_active"] = datetime.now()
        
        # Keep only last N messages
        if len(self.sessions[session_id]["messages"]) > self.max_messages:
            self.sessions[session_id]["messages"] = self.sessions[session_id]["messages"][-self.max_messages:]
        
        # Extract context from user messages
        if role == "user":
            self._extract_context(session_id, content)
    
    def _extract_context(self, session_id: str, content: str):
        """Extract key information from user messages"""
        context = self.sessions[session_id]["context"]
        content_lower = content.lower()
        
        # Extract interests
        interests = ["healthcare", "technology", "business", "creative", "engineering", "law", "education", "agriculture"]
        found_interests = [i for i in interests if i in content_lower]
        if found_interests:
            if "interests" not in context:
                context["interests"] = []
            for interest in found_interests:
                if interest not in context["interests"]:
                    context["interests"].append(interest)
        
        # Extract aggregate score
        import re
        aggregate_match = re.search(r'aggregate\s*(\d+)', content_lower)
        if aggregate_match:
            context["aggregate"] = int(aggregate_match.group(1))
        
        # Extract career goals
        career_keywords = ["doctor", "engineer", "lawyer", "nurse", "pharmacist", "teacher", "accountant"]
        for career in career_keywords:
            if career in content_lower:
                context["career_goal"] = career.title()
        
        # Extract subjects
        subjects = ["biology", "chemistry", "physics", "mathematics", "english", "ict", "accounting", "government", "literature"]
        found_subjects = [s for s in subjects if s in content_lower]
        if found_subjects:
            if "subjects" not in context:
                context["subjects"] = []
            for subject in found_subjects:
                if subject not in context["subjects"]:
                    context["subjects"].append(subject.title())
    
    def get_context(self, session_id: str) -> Dict:
        """Get conversation context for a session"""
        if session_id not in self.sessions:
            return {}
        
        # Check expiry
        last_active = self.sessions[session_id]["last_active"]
        if datetime.now() - last_active > timedelta(hours=self.expiry_hours):
            del self.sessions[session_id]
            return {}
        
        return self.sessions[session_id]["context"]
    
    def get_history(self, session_id: str) -> List[Dict]:
        """Get conversation history"""
        if session_id not in self.sessions:
            return []
        return self.sessions[session_id]["messages"]
    
    def clear_session(self, session_id: str):
        """Clear a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
    
    def generate_personalized_response(self, session_id: str, query: str, base_response: str) -> str:
        """Enhance response with context from conversation history"""
        context = self.get_context(session_id)
        if not context:
            return base_response
        
        # Personalize based on context
        personalized = base_response
        if "interests" in context and context["interests"]:
            interests_str = ", ".join(context["interests"])
            if interests_str.lower() not in base_response.lower():
                personalized += f"\n\n💡 I noticed you're interested in {interests_str} - this career aligns well with those interests."
        
        if "career_goal" in context:
            goal = context["career_goal"]
            if goal.lower() not in base_response.lower():
                personalized += f"\n\n🎯 You mentioned earlier that you're interested in {goal} - this is a great path to consider."
        
        return personalized

memory = ConversationMemory()
