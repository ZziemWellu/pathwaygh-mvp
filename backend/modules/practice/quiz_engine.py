"""
Practice Module Quiz Engine
Handles quiz generation, scoring, and analytics
"""

import json
import random
from typing import List, Dict, Any, Optional
from datetime import datetime
import os

class QuizEngine:
    """Handles all quiz-related operations"""
    
    def __init__(self, questions_file: str = "backend/data/practice/questions.json"):
        self.questions_file = questions_file
        self.questions_data = None
        self._load_questions()
    
    def _load_questions(self) -> None:
        """Load questions from JSON file"""
        try:
            with open(self.questions_file, 'r') as f:
                self.questions_data = json.load(f)
        except FileNotFoundError:
            # Create default structure if file doesn't exist
            self.questions_data = {"subjects": []}
            self._save_questions()
    
    def _save_questions(self) -> None:
        """Save questions to JSON file"""
        os.makedirs(os.path.dirname(self.questions_file), exist_ok=True)
        with open(self.questions_file, 'w') as f:
            json.dump(self.questions_data, f, indent=2)
    
    def get_subjects(self) -> List[Dict[str, Any]]:
        """Get all subjects with basic info"""
        return [
            {
                "id": s["id"],
                "name": s["name"],
                "description": s.get("description", ""),
                "icon": s.get("icon", "📚"),
                "total_questions": s.get("total_questions", 0),
                "topics": [{"id": t["id"], "name": t["name"]} for t in s.get("topics", [])]
            }
            for s in self.questions_data.get("subjects", [])
        ]
    
    def get_subject_by_id(self, subject_id: str) -> Optional[Dict[str, Any]]:
        """Get full subject data by ID"""
        for s in self.questions_data.get("subjects", []):
            if s["id"] == subject_id:
                return s
        return None
    
    def generate_quiz(self, subject_id: str, num_questions: int = 10, 
                      difficulty: Optional[str] = None) -> Dict[str, Any]:
        """Generate a quiz for a subject"""
        subject = self.get_subject_by_id(subject_id)
        if not subject:
            return {"error": f"Subject '{subject_id}' not found"}
        
        # Collect all questions from all topics
        all_questions = []
        for topic in subject.get("topics", []):
            for q in topic.get("questions", []):
                q_copy = q.copy()
                q_copy["topic_id"] = topic["id"]
                q_copy["topic_name"] = topic["name"]
                all_questions.append(q_copy)
        
        # Filter by difficulty if specified
        if difficulty:
            all_questions = [q for q in all_questions if q.get("difficulty") == difficulty]
        
        # Shuffle and select questions
        random.shuffle(all_questions)
        selected_questions = all_questions[:num_questions]
        
        # Clean up answers (remove correct answer from options for client)
        client_questions = []
        for q in selected_questions:
            q_clean = q.copy()
            correct = q_clean.pop("correct", None)
            q_clean["correct_hash"] = self._hash_answer(correct) if correct else None
            if "options" in q_clean:
                random.shuffle(q_clean["options"])
            client_questions.append(q_clean)
        
        quiz_id = f"quiz_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        return {
            "quiz_id": quiz_id,
            "subject_id": subject_id,
            "subject_name": subject["name"],
            "num_questions": len(selected_questions),
            "difficulty": difficulty or "Mixed",
            "questions": client_questions,
            "timestamp": datetime.now().isoformat()
        }
    
    def _hash_answer(self, answer: str) -> str:
        """Create a simple hash of the correct answer for verification"""
        return str(hash(answer) & 0xFFFFFFFF)
    
    def verify_answer(self, question_id: str, answer: str) -> Dict[str, Any]:
        """Verify a user's answer to a question"""
        for subject in self.questions_data.get("subjects", []):
            for topic in subject.get("topics", []):
                for q in topic.get("questions", []):
                    if q["id"] == question_id:
                        is_correct = q["correct"] == answer
                        return {
                            "question_id": question_id,
                            "is_correct": is_correct,
                            "correct_answer": q["correct"],
                            "explanation": q.get("explanation", ""),
                            "feedback": "Correct!" if is_correct else "Incorrect. Review the explanation below."
                        }
        
        return {"error": "Question not found"}
    
    def get_questions_by_difficulty(self, subject_id: str, difficulty: str) -> List[Dict[str, Any]]:
        """Get questions of a specific difficulty for a subject"""
        subject = self.get_subject_by_id(subject_id)
        if not subject:
            return []
        
        questions = []
        for topic in subject.get("topics", []):
            for q in topic.get("questions", []):
                if q.get("difficulty") == difficulty:
                    questions.append(q)
        return questions
    
    def add_question(self, subject_id: str, topic_id: str, question_data: Dict[str, Any]) -> bool:
        """Add a new question to the database"""
        subject = self.get_subject_by_id(subject_id)
        if not subject:
            return False
        
        for topic in subject.get("topics", []):
            if topic["id"] == topic_id:
                topic["questions"].append(question_data)
                subject["total_questions"] = len(topic["questions"])
                self._save_questions()
                return True
        
        return False
    
    def get_quiz_stats(self, subject_id: str, user_id: str) -> Dict[str, Any]:
        """Get quiz statistics for a user on a subject"""
        return {
            "subject_id": subject_id,
            "user_id": user_id,
            "total_attempts": 0,
            "average_score": 0,
            "best_score": 0,
            "questions_answered": 0,
            "correct_answers": 0,
            "accuracy": 0
        }
