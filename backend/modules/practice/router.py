"""
Practice Module Router
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import json
import os
import random
import uuid
from datetime import datetime

router = APIRouter(tags=["practice"])

QUESTIONS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "practice", "questions.json")

def load_questions():
    try:
        with open(QUESTIONS_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
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
                                {
                                    "id": "math_001",
                                    "question": "What is 2 + 2?",
                                    "options": ["3", "4", "5", "6"],
                                    "correct": "4",
                                    "difficulty": "Easy"
                                }
                            ]
                        }
                    ]
                }
            ]
        }

@router.get("/")
async def practice_root():
    return {"module": "practice", "status": "active"}

@router.get("/subjects")
async def get_subjects():
    data = load_questions()
    subjects = []
    for s in data.get("subjects", []):
        subjects.append({
            "id": s["id"],
            "name": s["name"],
            "icon": s.get("icon", "📚"),
            "topics": [t["name"] for t in s.get("topics", [])]
        })
    return {"success": True, "subjects": subjects}

@router.get("/subject/{subject_id}")
async def get_subject(subject_id: str):
    data = load_questions()
    for s in data.get("subjects", []):
        if s["id"] == subject_id:
            return {"success": True, "subject": s}
    raise HTTPException(status_code=404, detail=f"Subject '{subject_id}' not found")

@router.post("/quiz/start")
async def start_quiz():
    return {
        "success": True,
        "quiz": {
            "id": f"quiz_{uuid.uuid4().hex[:8]}",
            "questions": [
                {"id": "q1", "question": "What is 2+2?", "options": ["3", "4", "5", "6"]}
            ]
        }
    }

@router.post("/quiz/submit")
async def submit_quiz():
    return {"success": True, "score": 80, "correct": 4, "total": 5}
