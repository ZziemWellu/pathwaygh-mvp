"""
Decision Memory Engine
Tracks career decisions and detects changes
"""

from typing import Dict, List, Optional
from datetime import datetime
import json

class DecisionMemory:
    def __init__(self):
        self.memory_store = {}
    
    def add_decision(self, user_id: str, decision: Dict):
        """Add a decision to user's history"""
        if user_id not in self.memory_store:
            self.memory_store[user_id] = []
        
        decision["timestamp"] = datetime.now().isoformat()
        self.memory_store[user_id].append(decision)
        
        # Keep last 20 decisions
        if len(self.memory_store[user_id]) > 20:
            self.memory_store[user_id] = self.memory_store[user_id][-20:]
    
    def get_decision_history(self, user_id: str) -> List[Dict]:
        """Get user's decision history"""
        return self.memory_store.get(user_id, [])
    
    def get_career_evolution(self, user_id: str) -> Dict:
        """Track how career interests evolved"""
        history = self.get_decision_history(user_id)
        
        careers = []
        for entry in history:
            if "career" in entry:
                careers.append({
                    "career": entry["career"],
                    "timestamp": entry.get("timestamp"),
                    "confidence": entry.get("confidence", 0)
                })
        
        return {
            "career_history": careers,
            "total_decisions": len(careers),
            "latest": careers[-1] if careers else None,
            "evolution": self._analyze_evolution(careers)
        }
    
    def _analyze_evolution(self, careers: List) -> Dict:
        """Analyze career evolution pattern"""
        if len(careers) < 2:
            return {"pattern": "No significant changes"}
        
        first = careers[0].get("career")
        last = careers[-1].get("career")
        
        if first == last:
            return {"pattern": "Consistent interest", "career": first}
        else:
            return {
                "pattern": "Evolving interests",
                "from": first,
                "to": last,
                "recommendation": "Consider exploring related careers"
            }
    
    def detect_change(self, user_id: str, new_career: str) -> Optional[str]:
        """Detect if career interest changed"""
        history = self.get_decision_history(user_id)
        if not history:
            return None
        
        last = history[-1]
        if "career" in last and last["career"] != new_career:
            return f"Earlier you preferred {last['career']}. Has your interest changed?"
        
        return None
    
    def get_context_message(self, user_id: str) -> Optional[str]:
        """Generate context-aware message based on decision history"""
        history = self.get_decision_history(user_id)
        if not history:
            return None
        
        last = history[-1]
        message = ""
        
        if "career" in last:
            message += f"Previously, you showed interest in {last['career']}. "
        
        if "aggregate" in last:
            message += f"Your aggregate was {last['aggregate']}. "
        
        if len(history) >= 3:
            message += "You've explored several options. Let me help you narrow down."
        
        return message if message else None

decision_memory = DecisionMemory()
