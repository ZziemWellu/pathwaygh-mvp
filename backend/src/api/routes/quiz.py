from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter()


class QuizAnswer(BaseModel):
    q1: str  # Interest area
    q2: str  # Academic strength
    q3: str  # Work preference
    q4: str  # Career value
    q5: str  # School stage


class QuizResult(BaseModel):
    primary_career: Dict
    alternatives: List[Dict]
    confidence: str
    explanation: str


@router.post("/submit")
async def submit_quiz(answers: QuizAnswer):
    # Simple rule-based career matching
    career_map = {
        ("helping", "science"): {"name": "Medical Doctor", "field": "Healthcare", "score": 85},
        ("helping", "arts"): {"name": "Teacher", "field": "Education", "score": 75},
        ("technology", "math"): {"name": "Software Engineer", "field": "Technology", "score": 90},
        ("technology", "science"): {"name": "Engineer", "field": "Engineering", "score": 80},
        ("business", "math"): {"name": "Accountant", "field": "Business", "score": 85},
        ("creative", "arts"): {"name": "Architect", "field": "Creative Arts", "score": 80},
        ("outdoors", "science"): {"name": "Agricultural Scientist", "field": "Agriculture", "score": 75},
        ("persuading", "arts"): {"name": "Lawyer", "field": "Legal", "score": 85},
    }
    
    key = (answers.q1, answers.q2)
    primary = career_map.get(key, {"name": "Business Analyst", "field": "Business", "score": 70})
    
    alternatives = [
        {"name": "Pharmacist", "field": "Healthcare", "score": 65},
        {"name": "Data Scientist", "field": "Technology", "score": 60},
        {"name": "Project Manager", "field": "Business", "score": 55},
    ]
    
    confidence = "High" if primary["score"] >= 80 else "Medium"
    
    explanation = f"Your interest in {answers.q1} and strength in {answers.q2} makes {primary['name']} an excellent fit for your profile."
    
    return QuizResult(
        primary_career=primary,
        alternatives=alternatives[:3],
        confidence=confidence,
        explanation=explanation
    )


@router.get("/questions")
async def get_quiz_questions():
    return {
        "questions": [
            {
                "id": "q1",
                "text": "Which activity sounds most interesting to you?",
                "options": [
                    {"value": "helping", "label": "Helping people solve problems"},
                    {"value": "technology", "label": "Working with computers and technology"},
                    {"value": "business", "label": "Running a business or managing money"},
                    {"value": "creative", "label": "Designing, drawing, or creating things"},
                    {"value": "outdoors", "label": "Working outside with plants or animals"},
                    {"value": "persuading", "label": "Debating, arguing, or persuading others"}
                ]
            },
            {
                "id": "q2",
                "text": "What subject do you enjoy most in school?",
                "options": [
                    {"value": "science", "label": "Biology, Chemistry, or Physics"},
                    {"value": "math", "label": "Mathematics"},
                    {"value": "arts", "label": "English, Literature, or History"},
                    {"value": "business", "label": "Accounting, Economics, or Business"}
                ]
            },
            {
                "id": "q3",
                "text": "How do you prefer to work?",
                "options": [
                    {"value": "office", "label": "In an office or at a desk"},
                    {"value": "field", "label": "Outside or travelling to different locations"},
                    {"value": "hospital", "label": "In a hospital or clinic"},
                    {"value": "remote", "label": "Working remotely from home"}
                ]
            },
            {
                "id": "q4",
                "text": "What matters most to you in a career?",
                "options": [
                    {"value": "income", "label": "High salary"},
                    {"value": "impact", "label": "Making a difference"},
                    {"value": "stability", "label": "Job security"},
                    {"value": "creativity", "label": "Creative freedom"}
                ]
            },
            {
                "id": "q5",
                "text": "What is your current school stage?",
                "options": [
                    {"value": "jhs", "label": "Junior High School (JHS)"},
                    {"value": "shs", "label": "Senior High School (SHS)"},
                    {"value": "university", "label": "University"},
                    {"value": "tvet", "label": "TVET/Technical School"}
                ]
            }
        ]
    }
