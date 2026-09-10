"""
Practice Module Router
"""

import json
import logging
import random
import uuid
from pathlib import Path
from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.quiz_attempt import QuizAttempt
from models.user import User

router = APIRouter(tags=["practice"])
logger = logging.getLogger(__name__)


class QuizStartRequest(BaseModel):
    subject_id: str
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    question_count: Optional[int] = 5


class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: Dict[int, str]
    time_spent: Optional[int] = 30


PROJECT_ROOT = Path(__file__).resolve().parents[2]
QUESTIONS_FILE = PROJECT_ROOT / "data" / "practice" / "questions.json"

# In-flight quizzes are ephemeral session state (the correct answers must stay
# server-side while a quiz is being taken); completed results are persisted
# to QuizAttempt below so history survives a restart.
active_quizzes: Dict[str, dict] = {}


def load_questions():
    try:
        if QUESTIONS_FILE.exists():
            with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data.get("subjects"):
                    return data
    except Exception as e:
        logger.error(f"Error loading questions: {e}")

    return {
        "subjects": [
            {
                "id": "mathematics",
                "name": "Mathematics",
                "icon": "\U0001F4D0",
                "country": "GH",
                "topics": [
                    {
                        "id": "algebra",
                        "name": "Algebra",
                        "questions": [
                            {"id": "math_001", "question": "What is 2 + 2?", "options": ["3", "4", "5", "6"], "correct": "4", "difficulty": "easy"},
                            {"id": "math_002", "question": "What is 3 x 3?", "options": ["6", "8", "9", "12"], "correct": "9", "difficulty": "easy"},
                            {"id": "math_003", "question": "What is the square root of 16?", "options": ["2", "3", "4", "5"], "correct": "4", "difficulty": "medium"},
                        ],
                    },
                ],
            },
        ]
    }


def get_all_questions(
    subject_id: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    country: Optional[str] = None,
):
    data = load_questions()
    all_questions = []
    for subject in data.get("subjects", []):
        if subject_id and subject["id"] != subject_id:
            continue
        if country and subject.get("country") != country:
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


@router.get("/")
async def practice_root():
    data = load_questions()
    subjects = data.get("subjects", [])
    return {
        "module": "practice",
        "status": "active",
        "subjects_count": len(subjects),
        "total_questions": sum(len(t.get("questions", [])) for s in subjects for t in s.get("topics", [])),
    }


@router.get("/subjects")
async def get_subjects(country: Optional[str] = None):
    data = load_questions()
    subjects = []
    for s in data.get("subjects", []):
        if country and s.get("country") != country:
            continue
        topics = []
        question_count = 0
        for t in s.get("topics", []):
            q_count = len(t.get("questions", []))
            question_count += q_count
            topics.append({"id": t["id"], "name": t["name"], "question_count": q_count})
        subjects.append(
            {"id": s["id"], "name": s["name"], "icon": s.get("icon", "\U0001F4DA"), "topics": topics, "question_count": question_count}
        )
    return {"success": True, "subjects": subjects}


@router.get("/subject/{subject_id}")
async def get_subject(subject_id: str):
    data = load_questions()
    for s in data.get("subjects", []):
        if s["id"] == subject_id:
            return {"success": True, "subject": s}
    raise HTTPException(status_code=404, detail=f"Subject '{subject_id}' not found")


@router.post("/quiz/start")
async def start_quiz(request: QuizStartRequest, current_user: User = Depends(get_current_user)):
    questions = get_all_questions(request.subject_id, request.topic, request.difficulty, current_user.country)
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for the selected criteria")

    count = min(request.question_count or 5, len(questions))
    selected = random.sample(questions, count)

    quiz_id = f"quiz_{uuid.uuid4().hex[:8]}"
    quiz_data = {
        "id": quiz_id,
        "user_id": current_user.id,
        "subject_id": request.subject_id,
        "topic": request.topic,
        "correct_answers": {i: q["correct"] for i, q in enumerate(selected)},
        "questions": [
            {"id": q["id"], "question": q["question"], "options": q.get("options", []), "difficulty": q.get("difficulty", "medium")}
            for q in selected
        ],
    }
    active_quizzes[quiz_id] = quiz_data

    return {"success": True, "id": quiz_id, "questions": quiz_data["questions"], "total": len(quiz_data["questions"])}


@router.post("/quiz/submit")
async def submit_quiz(
    request: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = active_quizzes.get(request.quiz_id)
    if not quiz or quiz["user_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="Quiz not found")

    correct_answers = quiz.get("correct_answers", {})
    correct_count = 0
    results = []
    for i, answer in request.answers.items():
        idx = int(i)
        is_correct = answer == correct_answers.get(idx, "")
        if is_correct:
            correct_count += 1
        results.append({"question_index": idx, "user_answer": answer, "correct_answer": correct_answers.get(idx, ""), "is_correct": is_correct})

    total = len(correct_answers)
    score = round((correct_count / total) * 100) if total > 0 else 0

    db.add(
        QuizAttempt(
            user_id=current_user.id,
            quiz_id=request.quiz_id,
            subject_id=quiz.get("subject_id"),
            score=score,
            total_questions=total,
            answers={str(k): v for k, v in request.answers.items()},
            time_spent=request.time_spent,
        )
    )
    db.commit()

    del active_quizzes[request.quiz_id]

    return {
        "success": True,
        "score": score,
        "correct": correct_count,
        "incorrect": total - correct_count,
        "total": total,
        "results": results,
        "time_spent": request.time_spent or 30,
    }


@router.get("/history")
async def get_quiz_history(
    limit: Optional[int] = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .limit(limit or 20)
        .all()
    )
    history = [
        {
            "quiz_id": a.quiz_id,
            "score": a.score,
            "correct": round(a.score / 100 * a.total_questions) if a.total_questions else 0,
            "total": a.total_questions,
            "date": a.completed_at.isoformat() if a.completed_at else None,
        }
        for a in attempts
    ]
    return {"success": True, "history": history, "total": len(history)}


@router.get("/statistics")
async def get_quiz_statistics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).all()
    if not attempts:
        return {"success": True, "total_quizzes": 0, "average_score": 0, "best_score": 0, "total_questions": 0, "accuracy": 0}

    total_questions = sum(a.total_questions for a in attempts)
    correct_answers = sum(round(a.score / 100 * a.total_questions) for a in attempts)

    by_subject: Dict[str, list] = {}
    for a in attempts:
        if a.subject_id:
            by_subject.setdefault(a.subject_id, []).append(a.score)
    subject_averages = {subject: round(sum(scores) / len(scores)) for subject, scores in by_subject.items()}

    return {
        "success": True,
        "total_quizzes": len(attempts),
        "average_score": round(sum(a.score for a in attempts) / len(attempts)),
        "best_score": max(a.score for a in attempts),
        "total_questions": total_questions,
        "accuracy": round((correct_answers / total_questions) * 100) if total_questions else 0,
        "subject_averages": subject_averages,
    }
