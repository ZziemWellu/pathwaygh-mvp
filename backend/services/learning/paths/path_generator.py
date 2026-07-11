"""
Personalized Learning Path Generator
Adapts based on student progress and goals
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
import json
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class LearningPathGenerator:
    """
    Generates personalized learning paths based on student data
    """
    
    def __init__(self):
        self.paths_dir = Path("data/learning/paths")
        self.paths_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_path(self, user_id: str, subject: str, goal: str = "mastery") -> Dict:
        """Generate a personalized learning path"""
        
        # Get student data
        student_data = self._get_student_data(user_id)
        
        # Determine current level
        current_level = self._determine_level(student_data, subject)
        
        # Set target level
        target_level = self._determine_target(current_level, goal)
        
        # Generate path steps
        steps = self._generate_steps(subject, current_level, target_level)
        
        # Create path
        path = {
            "user_id": user_id,
            "subject": subject,
            "goal": goal,
            "current_level": current_level,
            "target_level": target_level,
            "steps": steps,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "progress": 0
        }
        
        self._save_path(user_id, subject, path)
        return path
    
    def _get_student_data(self, user_id: str) -> Dict:
        """Get student data from profile and progress"""
        # In production, fetch from database
        return {
            "level": "beginner",
            "completed_lessons": [],
            "quiz_scores": {},
            "interests": ["science", "technology"]
        }
    
    def _determine_level(self, student_data: Dict, subject: str) -> str:
        """Determine current level for a subject"""
        # Simple logic - can be enhanced with AI
        return "beginner"
    
    def _determine_target(self, current_level: str, goal: str) -> str:
        """Determine target level based on goal"""
        levels = ["beginner", "intermediate", "advanced", "expert"]
        current_index = levels.index(current_level)
        
        if goal == "mastery":
            return "expert"
        elif goal == "proficiency":
            return levels[min(current_index + 2, 3)]
        else:
            return levels[min(current_index + 1, 3)]
    
    def _generate_steps(self, subject: str, current_level: str, target_level: str) -> List[Dict]:
        """Generate learning path steps"""
        steps = []
        
        # Subject-specific topics
        topics = {
            "biology": ["Cell Biology", "Genetics", "Ecology", "Human Anatomy", "Evolution"],
            "chemistry": ["Atomic Structure", "Chemical Bonding", "Organic Chemistry", "Inorganic Chemistry"],
            "physics": ["Mechanics", "Thermodynamics", "Electricity", "Waves", "Optics"],
            "mathematics": ["Algebra", "Geometry", "Calculus", "Statistics", "Trigonometry"]
        }
        
        subject_topics = topics.get(subject.lower(), ["Fundamentals", "Intermediate", "Advanced"])
        
        level_map = {
            "beginner": 0,
            "intermediate": 1,
            "advanced": 2,
            "expert": 3
        }
        
        start_idx = level_map.get(current_level, 0)
        end_idx = min(level_map.get(target_level, 2) + 1, len(subject_topics))
        
        for i in range(start_idx, end_idx):
            if i < len(subject_topics):
                steps.append({
                    "step": i + 1,
                    "topic": subject_topics[i],
                    "description": f"Master {subject_topics[i]}",
                    "estimated_hours": 2 + i,
                    "resources": [],
                    "completed": False
                })
        
        return steps
    
    def _save_path(self, user_id: str, subject: str, path: Dict):
        """Save learning path"""
        path_file = self.paths_dir / f"{user_id}_{subject}.json"
        with open(path_file, 'w') as f:
            json.dump(path, f, indent=2)
    
    def get_path(self, user_id: str, subject: str) -> Optional[Dict]:
        """Get existing learning path"""
        path_file = self.paths_dir / f"{user_id}_{subject}.json"
        if path_file.exists():
            with open(path_file, 'r') as f:
                return json.load(f)
        return None
    
    def update_progress(self, user_id: str, subject: str, step_index: int):
        """Update progress on a learning path"""
        path = self.get_path(user_id, subject)
        if not path:
            return
        
        if step_index < len(path["steps"]):
            path["steps"][step_index]["completed"] = True
            path["updated_at"] = datetime.now().isoformat()
            
            # Calculate progress
            completed = sum(1 for s in path["steps"] if s["completed"])
            path["progress"] = int((completed / len(path["steps"])) * 100)
            
            self._save_path(user_id, subject, path)


# Singleton
path_generator = LearningPathGenerator()
