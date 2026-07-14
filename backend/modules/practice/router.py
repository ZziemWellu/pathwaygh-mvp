"""
Practice Module Router - Complete Production Version
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import random
import uuid
import datetime
from pathlib import Path
import logging

router = APIRouter(tags=["practice"])
logger = logging.getLogger(__name__)

# ============================================================
# Data Models
# ============================================================

class QuizStartRequest(BaseModel):
    subject_id: str
    user_id: str
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    question_count: Optional[int] = 5

class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: Dict[int, str]
    user_id: str
    time_spent: Optional[int] = 30

# ============================================================
# Data Loading - COMPLETE QUESTIONS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]
QUESTIONS_FILE = PROJECT_ROOT / "data" / "practice" / "questions.json"

# In-memory storage
quiz_history = {}
active_quizzes = {}

def load_questions():
    """Load questions from JSON file with complete fallback"""
    try:
        if QUESTIONS_FILE.exists():
            with open(QUESTIONS_FILE, 'r') as f:
                data = json.load(f)
                if data.get("subjects"):
                    return data
    except Exception as e:
        logger.error(f"Error loading questions: {e}")
    
    # COMPLETE FALLBACK DATA - 3 subjects with 20+ questions
    return {
        "subjects": [
            {
                "id": "mathematics",
                "name": "Mathematics",
                "icon": "📐",
                "topics": [
                    {
                        "id": "algebra",
                        "name": "Algebra",
                        "questions": [
                            {"id": "math_001", "question": "What is 2 + 2?", "options": ["3", "4", "5", "6"], "correct": "4", "difficulty": "easy"},
                            {"id": "math_002", "question": "What is 3 x 3?", "options": ["6", "8", "9", "12"], "correct": "9", "difficulty": "easy"},
                            {"id": "math_003", "question": "What is the square root of 16?", "options": ["2", "3", "4", "5"], "correct": "4", "difficulty": "medium"},
                            {"id": "math_004", "question": "What is 4 x 8?", "options": ["32", "34", "30", "28"], "correct": "32", "difficulty": "medium"},
                            {"id": "math_005", "question": "What is the value of pi?", "options": ["3.14", "3.41", "3.15", "3.12"], "correct": "3.14", "difficulty": "hard"},
                            {"id": "math_006", "question": "How many sides does a triangle have?", "options": ["2", "3", "4", "5"], "correct": "3", "difficulty": "easy"},
                            {"id": "math_007", "question": "What is the area of a circle?", "options": ["πr²", "2πr", "πd", "r²"], "correct": "πr²", "difficulty": "medium"},
                            {"id": "math_008", "question": "What is 10 / 2?", "options": ["2", "4", "5", "6"], "correct": "5", "difficulty": "easy"},
                            {"id": "math_009", "question": "What is the perimeter of a square with side 4?", "options": ["8", "12", "16", "20"], "correct": "16", "difficulty": "medium"},
                            {"id": "math_010", "question": "What is 25% of 200?", "options": ["25", "50", "75", "100"], "correct": "50", "difficulty": "hard"}
                        ]
                    },
                    {
                        "id": "geometry",
                        "name": "Geometry",
                        "questions": [
                            {"id": "math_011", "question": "How many degrees in a right angle?", "options": ["45", "90", "180", "360"], "correct": "90", "difficulty": "easy"},
                            {"id": "math_012", "question": "What is the sum of angles in a triangle?", "options": ["90", "180", "270", "360"], "correct": "180", "difficulty": "easy"}
                        ]
                    }
                ]
            },
            {
                "id": "english",
                "name": "English Language",
                "icon": "📝",
                "topics": [
                    {
                        "id": "grammar",
                        "name": "Grammar",
                        "questions": [
                            {"id": "eng_001", "question": "What is a noun?", "options": ["Action word", "Person/place/thing", "Describing word", "Connecting word"], "correct": "Person/place/thing", "difficulty": "easy"},
                            {"id": "eng_002", "question": "What is a verb?", "options": ["Action word", "Person/place/thing", "Describing word", "Connecting word"], "correct": "Action word", "difficulty": "easy"},
                            {"id": "eng_003", "question": "Which is a correct sentence?", "options": ["He go to school", "He goes to school", "He going to school", "He went to school"], "correct": "He goes to school", "difficulty": "medium"},
                            {"id": "eng_004", "question": "What is the plural of 'child'?", "options": ["Childs", "Children", "Childrens", "Childes"], "correct": "Children", "difficulty": "medium"},
                            {"id": "eng_005", "question": "What is the past tense of 'run'?", "options": ["Runned", "Ran", "Run", "Running"], "correct": "Ran", "difficulty": "medium"}
                        ]
                    },
                    {
                        "id": "comprehension",
                        "name": "Reading Comprehension",
                        "questions": [
                            {"id": "eng_006", "question": "What is the main idea of a paragraph?", "options": ["The first sentence", "The central thought", "The last sentence", "The title"], "correct": "The central thought", "difficulty": "medium"}
                        ]
                    }
                ]
            },
            {
                "id": "science",
                "name": "Science",
                "icon": "🔬",
                "topics": [
                    {
                        "id": "biology",
                        "name": "Biology",
                        "questions": [
                            {"id": "sci_001", "question": "What is the largest organ in the human body?", "options": ["Heart", "Liver", "Skin", "Brain"], "correct": "Skin", "difficulty": "medium"},
                            {"id": "sci_002", "question": "What is the smallest unit of life?", "options": ["Atom", "Molecule", "Cell", "Tissue"], "correct": "Cell", "difficulty": "easy"},
                            {"id": "sci_003", "question": "What is the function of the heart?", "options": ["Pump blood", "Filter waste", "Digest food", "Think"], "correct": "Pump blood", "difficulty": "easy"},
                            {"id": "sci_004", "question": "What is the chemical symbol for water?", "options": ["H2O", "CO2", "NaCl", "O2"], "correct": "H2O", "difficulty": "easy"}
                        ]
                    },
                    {
                        "id": "chemistry",
                        "name": "Chemistry",
                        "questions": [
                            {"id": "sci_005", "question": "What is the atomic number of Carbon?", "options": ["4", "6", "8", "10"], "correct": "6", "difficulty": "hard"},
                            {"id": "sci_006", "question": "What is the chemical formula for salt?", "options": ["H2O", "CO2", "NaCl", "O2"], "correct": "NaCl", "difficulty": "medium"}
                        ]
                    },
                    {
                        "id": "physics",
                        "name": "Physics",
                        "questions": [
                            {"id": "sci_007", "question": "What is the speed of light?", "options": ["300,000 km/s", "150,000 km/s", "500,000 km/s", "100,000 km/s"], "correct": "300,000 km/s", "difficulty": "hard"}
                        ]
                    }
                ]
            }
        ]
    }

def get_all_questions(subject_id: Optional[str] = None, topic: Optional[str] = None, difficulty: Optional[str] = None):
    """Get filtered questions"""
    data = load_questions()
    all_questions = []
    
    for subject in data.get("subjects", []):
        if subject_id and subject["id"] != subject_id:
            continue
            
        for topic_data in subject.get("topics", []):
            if topic and topic_data["id"] != topic:
                continue
                
            for q in topic_data.get("questions", []):
                if difficulty and q.get("difficulty") != difficulty:
                    continue
                q["subject_id"] = subject["id"]
                q["subject_name"] = subject["name"]
                q["topic_name"] = topic_data["name"]
                all_questions.append(q)
    
    return all_questions

# ============================================================
# API Endpoints
# ============================================================

@router.get("/")
async def practice_root():
    """Practice module root endpoint"""
    data = load_questions()
    subjects = data.get("subjects", [])
    return {
        "module": "practice",
        "status": "active",
        "subjects_count": len(subjects),
        "total_questions": sum(
            len(t.get("questions", [])) 
            for s in subjects 
            for t in s.get("topics", [])
        )
    }

@router.get("/subjects")
async def get_subjects():
    """Get all subjects with their topics and question counts"""
    data = load_questions()
    subjects = []
    
    for s in data.get("subjects", []):
        topics = []
        question_count = 0
        for t in s.get("topics", []):
            q_count = len(t.get("questions", []))
            question_count += q_count
            topics.append({"id": t["id"], "name": t["name"], "question_count": q_count})
        
        subjects.append({
            "id": s["id"],
            "name": s["name"],
            "icon": s.get("icon", "📚"),
            "topics": topics,
            "question_count": question_count
        })
    
    return {"success": True, "subjects": subjects}

@router.get("/subject/{subject_id}")
async def get_subject(subject_id: str):
    """Get subject details"""
    data = load_questions()
    for s in data.get("subjects", []):
        if s["id"] == subject_id:
            return {"success": True, "subject": s}
    raise HTTPException(status_code=404, detail=f"Subject '{subject_id}' not found")

@router.post("/quiz/start")
async def start_quiz(request: QuizStartRequest):
    """Start a new quiz with questions"""
    questions = get_all_questions(
        request.subject_id, 
        request.topic, 
        request.difficulty
    )
    
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for the selected criteria")
    
    # Select questions
    count = min(request.question_count or 5, len(questions))
    selected = random.sample(questions, count)
    
    # Create quiz
    quiz_id = f"quiz_{uuid.uuid4().hex[:8]}"
    quiz_data = {
        "id": quiz_id,
        "user_id": request.user_id,
        "subject_id": request.subject_id,
        "topic": request.topic,
        "difficulty": request.difficulty,
        "questions": [
            {
                "id": q["id"],
                "question": q["question"],
                "options": q.get("options", []),
                "difficulty": q.get("difficulty", "medium")
            } for q in selected
        ],
        "started_at": datetime.datetime.now().isoformat()
    }
    
    active_quizzes[quiz_id] = quiz_data
    
    # Add correct answers separately (not sent to client)
    correct_answers = {i: q["correct"] for i, q in enumerate(selected)}
    quiz_data["correct_answers"] = correct_answers
    
    return {
        "success": True,
        "id": quiz_id,
        "questions": quiz_data["questions"],
        "total": len(quiz_data["questions"])
    }

@router.post("/quiz/submit")
async def submit_quiz(request: QuizSubmitRequest):
    """Submit quiz answers and get results"""
    if request.quiz_id not in active_quizzes:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    quiz = active_quizzes[request.quiz_id]
    correct_answers = quiz.get("correct_answers", {})
    
    # Calculate score
    correct_count = 0
    results = []
    
    for i, answer in request.answers.items():
        idx = int(i)
        is_correct = answer == correct_answers.get(idx, "")
        if is_correct:
            correct_count += 1
        results.append({
            "question_index": idx,
            "user_answer": answer,
            "correct_answer": correct_answers.get(idx, ""),
            "is_correct": is_correct
        })
    
    total = len(correct_answers)
    score = round((correct_count / total) * 100) if total > 0 else 0
    
    # Save to history
    user_id = request.user_id
    if user_id not in quiz_history:
        quiz_history[user_id] = []
    
    quiz_history[user_id].append({
        "quiz_id": request.quiz_id,
        "subject": quiz.get("subject_id", "Unknown"),
        "topic": quiz.get("topic", "General"),
        "score": score,
        "correct": correct_count,
        "incorrect": total - correct_count,
        "total": total,
        "answers": request.answers,
        "time_spent": request.time_spent or 30,
        "date": datetime.datetime.now().isoformat()
    })
    
    # Clean up active quiz
    del active_quizzes[request.quiz_id]
    
    return {
        "success": True,
        "score": score,
        "correct": correct_count,
        "incorrect": total - correct_count,
        "total": total,
        "results": results,
        "time_spent": request.time_spent or 30
    }

@router.get("/history/{user_id}")
async def get_quiz_history(user_id: str, limit: Optional[int] = 20):
    """Get user's quiz history"""
    history = quiz_history.get(user_id, [])
    if limit:
        history = history[-limit:]
    return {"success": True, "history": history, "total": len(history)}

@router.get("/statistics/{user_id}")
async def get_quiz_statistics(user_id: str):
    """Get user's quiz statistics"""
    history = quiz_history.get(user_id, [])
    
    if not history:
        return {
            "success": True,
            "total_quizzes": 0,
            "average_score": 0,
            "best_score": 0,
            "total_questions": 0,
            "correct_answers": 0,
            "accuracy": 0,
            "subjects": {}
        }
    
    total_score = 0
    best_score = 0
    total_questions = 0
    correct_answers = 0
    subjects = {}
    
    for entry in history:
        total_score += entry.get("score", 0)
        best_score = max(best_score, entry.get("score", 0))
        total_questions += entry.get("total", 0)
        correct_answers += entry.get("correct", 0)
        
        subject = entry.get("subject", "Unknown")
        if subject not in subjects:
            subjects[subject] = {"quizzes": 0, "total_score": 0, "best": 0}
        subjects[subject]["quizzes"] += 1
        subjects[subject]["total_score"] += entry.get("score", 0)
        subjects[subject]["best"] = max(subjects[subject]["best"], entry.get("score", 0))
    
    return {
        "success": True,
        "total_quizzes": len(history),
        "average_score": round(total_score / len(history)) if history else 0,
        "best_score": best_score,
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "accuracy": round((correct_answers / total_questions) * 100) if total_questions > 0 else 0,
        "subjects": subjects
    }

logger.info("✅ Practice module loaded with complete endpoints")
