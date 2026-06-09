from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional

router = APIRouter()


class GradeInput(BaseModel):
    english: str
    math: str
    science: str
    social: str
    electives: Dict[str, str]


class EligibilityResponse(BaseModel):
    eligible: bool
    aggregate: int
    eligible_programmes: List[Dict]
    not_eligible_programmes: List[Dict]
    gap_analysis: Optional[Dict]


@router.post("/check", response_model=EligibilityResponse)
async def check_eligibility(grades: GradeInput):
    # WASSCE grade to numeric conversion (lower is better)
    grade_map = {"A1": 1, "B2": 2, "B3": 3, "C4": 4, "C5": 5, "C6": 6, "D7": 7, "E8": 8, "F9": 9}
    
    # Calculate aggregate (best 6 subjects)
    all_grades = [
        grade_map.get(grades.english, 9),
        grade_map.get(grades.math, 9),
        grade_map.get(grades.science, 9),
        grade_map.get(grades.social, 9),
    ]
    for grade in grades.electives.values():
        all_grades.append(grade_map.get(grade, 9))
    
    all_grades.sort()
    aggregate = sum(all_grades[:6])
    
    # Programme eligibility rules
    programmes = [
        {"name": "Medicine (MBChB)", "cutoff": 12, "requirements": ["Biology", "Chemistry"], "universities": ["UG", "KNUST", "UHAS"]},
        {"name": "Engineering", "cutoff": 16, "requirements": ["Physics", "Mathematics"], "universities": ["KNUST", "UG"]},
        {"name": "Computer Science", "cutoff": 18, "requirements": ["Mathematics"], "universities": ["UG", "KNUST", "Ashesi"]},
        {"name": "Law (LLB)", "cutoff": 12, "requirements": ["Government", "Literature"], "universities": ["UG", "KNUST", "Central"]},
        {"name": "Business Administration", "cutoff": 20, "requirements": [], "universities": ["UG", "UPSA", "KNUST"]},
        {"name": "Nursing", "cutoff": 18, "requirements": ["Biology", "Chemistry"], "universities": ["UG", "UHAS", "UCC"]},
        {"name": "Pharmacy", "cutoff": 15, "requirements": ["Biology", "Chemistry"], "universities": ["KNUST", "UCC"]},
    ]
    
    eligible = []
    not_eligible = []
    
    electives_taken = list(grades.electives.keys())
    
    for prog in programmes:
        if aggregate <= prog["cutoff"]:
            eligible.append(prog)
        else:
            not_eligible.append(prog)
    
    gap_analysis = None
    if aggregate > 12:
        gap_analysis = {
            "current_aggregate": aggregate,
            "target_aggregate": 12,
            "improvement_needed": aggregate - 12,
            "tip": "Focus on improving your weakest subjects. Past questions are your best resource."
        }
    
    return EligibilityResponse(
        eligible=aggregate <= 18,
        aggregate=aggregate,
        eligible_programmes=eligible[:3],
        not_eligible_programmes=not_eligible[:2],
        gap_analysis=gap_analysis
    )
