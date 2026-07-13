"""
Plan Module Router - Study Plans, Roadmaps, and Sessions
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import uuid
import datetime
import json
from pathlib import Path

router = APIRouter(tags=["plan"])

# Data storage
PLANS_FILE = Path(__file__).parent.parent.parent / "data" / "plans.json"

# Ensure data directory exists
PLANS_FILE.parent.mkdir(parents=True, exist_ok=True)

def load_plans():
    """Load plans from JSON file"""
    if PLANS_FILE.exists():
        try:
            with open(PLANS_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_plans(plans):
    """Save plans to JSON file"""
    with open(PLANS_FILE, 'w') as f:
        json.dump(plans, f, indent=2)

# Initialize with sample data if empty
def init_sample_plans():
    plans = load_plans()
    if not plans:
        sample_plans = [
            {
                "id": "plan_001",
                "name": "WASSCE Preparation Plan",
                "description": "Comprehensive 6-month study plan for WASSCE",
                "duration_months": 6,
                "duration": "6 months",
                "progress": 0,
                "subjects": ["Mathematics", "English Language", "Integrated Science"],
                "goal": "exam_preparation",
                "target_exam": "WASSCE",
                "priority": "high",
                "status": "active",
                "created_at": datetime.datetime.now().isoformat()
            },
            {
                "id": "plan_002",
                "name": "University Entrance Preparation",
                "description": "Prepare for university admissions",
                "duration_months": 3,
                "duration": "3 months",
                "progress": 0,
                "subjects": ["Mathematics", "English Language"],
                "goal": "university_admission",
                "target_exam": "University Entrance",
                "priority": "high",
                "status": "active",
                "created_at": datetime.datetime.now().isoformat()
            },
            {
                "id": "plan_003",
                "name": "SHS Science Student Roadmap",
                "description": "3-year roadmap for science students from SHS 1 to 3",
                "duration_months": 36,
                "duration": "36 months",
                "progress": 0,
                "subjects": ["Biology", "Chemistry", "Physics", "Mathematics"],
                "goal": "career_readiness",
                "target_exam": "WASSCE",
                "priority": "high",
                "status": "active",
                "created_at": datetime.datetime.now().isoformat()
            },
            {
                "id": "plan_004",
                "name": "Intensive 3-Month WAEC Prep",
                "description": "Intensive 3-month preparation for WAEC exams",
                "duration_months": 3,
                "duration": "3 months",
                "progress": 0,
                "subjects": ["Mathematics", "English", "Science", "Social Studies"],
                "goal": "exam_preparation",
                "target_exam": "WAEC",
                "priority": "high",
                "status": "active",
                "created_at": datetime.datetime.now().isoformat()
            }
        ]
        save_plans(sample_plans)
    return load_plans()

# Initialize sample data
init_sample_plans()

# ============================================
# Request Models
# ============================================

class CreatePlanRequest(BaseModel):
    name: str
    description: Optional[str] = None
    duration_months: int = 3
    goal: Optional[str] = None
    subjects: Optional[List[str]] = []
    target_exam: Optional[str] = None
    priority: Optional[str] = "medium"
    user_id: Optional[str] = "test_user"

class UpdatePlanRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_months: Optional[int] = None
    progress: Optional[int] = None
    status: Optional[str] = None
    subjects: Optional[List[str]] = None

# ============================================
# Endpoints
# ============================================

@router.get("/")
async def plan_root():
    return {
        "module": "plan",
        "status": "active",
        "endpoints": [
            "/study-plans",
            "/study-plans/{id}",
            "/study-plans/create",
            "/study-plans/{id}/progress",
            "/study-plans/{id}/schedule",
            "/roadmaps",
            "/templates"
        ]
    }

@router.get("/study-plans")
async def get_study_plans():
    """Get all study plans"""
    return load_plans()

@router.get("/study-plans/{plan_id}")
async def get_study_plan(plan_id: str):
    """Get a specific study plan"""
    plans = load_plans()
    for plan in plans:
        if plan.get("id") == plan_id:
            return plan
    raise HTTPException(status_code=404, detail="Plan not found")

@router.post("/study-plans/create")
async def create_study_plan(request: CreatePlanRequest):
    """Create a new study plan"""
    plans = load_plans()
    
    new_plan = {
        "id": f"plan_{uuid.uuid4().hex[:8]}",
        "name": request.name,
        "description": request.description or f"Study plan for {request.goal or 'general' }",
        "duration_months": request.duration_months,
        "duration": f"{request.duration_months} months",
        "progress": 0,
        "subjects": request.subjects or [],
        "goal": request.goal or "general_improvement",
        "target_exam": request.target_exam,
        "priority": request.priority or "medium",
        "status": "active",
        "user_id": request.user_id,
        "created_at": datetime.datetime.now().isoformat()
    }
    
    plans.append(new_plan)
    save_plans(plans)
    
    return {
        "success": True,
        "message": "Study plan created successfully",
        "plan": new_plan
    }

@router.put("/study-plans/{plan_id}")
async def update_study_plan(plan_id: str, request: UpdatePlanRequest):
    """Update a study plan"""
    plans = load_plans()
    for i, plan in enumerate(plans):
        if plan.get("id") == plan_id:
            if request.name is not None:
                plan["name"] = request.name
            if request.description is not None:
                plan["description"] = request.description
            if request.duration_months is not None:
                plan["duration_months"] = request.duration_months
                plan["duration"] = f"{request.duration_months} months"
            if request.progress is not None:
                plan["progress"] = min(100, max(0, request.progress))
            if request.status is not None:
                plan["status"] = request.status
            if request.subjects is not None:
                plan["subjects"] = request.subjects
            plan["updated_at"] = datetime.datetime.now().isoformat()
            plans[i] = plan
            save_plans(plans)
            return {
                "success": True,
                "message": "Plan updated successfully",
                "plan": plan
            }
    raise HTTPException(status_code=404, detail="Plan not found")

@router.delete("/study-plans/{plan_id}")
async def delete_study_plan(plan_id: str):
    """Delete a study plan"""
    plans = load_plans()
    for i, plan in enumerate(plans):
        if plan.get("id") == plan_id:
            deleted = plans.pop(i)
            save_plans(plans)
            return {
                "success": True,
                "message": f"Plan '{plan_id}' deleted successfully",
                "deleted": deleted
            }
    raise HTTPException(status_code=404, detail="Plan not found")

@router.put("/study-plans/{plan_id}/progress")
async def update_progress(plan_id: str, data: dict):
    """Update progress for a study plan"""
    progress = data.get("progress")
    if progress is None:
        raise HTTPException(status_code=400, detail="Progress value required")
    
    plans = load_plans()
    for plan in plans:
        if plan.get("id") == plan_id:
            plan["progress"] = min(100, max(0, progress))
            plan["updated_at"] = datetime.datetime.now().isoformat()
            save_plans(plans)
            return {
                "success": True,
                "message": f"Progress updated to {progress}%",
                "plan": plan
            }
    raise HTTPException(status_code=404, detail="Plan not found")

@router.get("/study-plans/{plan_id}/schedule")
async def generate_schedule(plan_id: str, start_date: Optional[str] = None):
    """Generate a study schedule for a plan"""
    plans = load_plans()
    plan = None
    for p in plans:
        if p.get("id") == plan_id:
            plan = p
            break
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Generate weekly schedule
    weeks = plan.get("duration_months", 3) * 4
    subjects = plan.get("subjects", ["General"])
    if not subjects:
        subjects = ["General"]
    
    schedule = []
    for week in range(1, weeks + 1):
        week_schedule = {
            "week": week,
            "start_date": f"2026-07-{(week * 7):02d}",
            "subjects": [
                {
                    "subject": subjects[i % len(subjects)],
                    "hours": 4 + (week % 3),
                    "topics": [f"Topic {i+1} for {subjects[i % len(subjects)]}"]
                }
                for i in range(min(3, len(subjects)))
            ]
        }
        schedule.append(week_schedule)
    
    return {
        "success": True,
        "data": {
            "plan_id": plan_id,
            "plan_name": plan.get("name"),
            "start_date": start_date or "2026-07-13",
            "duration_weeks": weeks,
            "schedule": schedule[:16]  # Limit to 16 weeks
        }
    }

@router.get("/roadmaps")
async def get_roadmaps():
    """Get career roadmaps"""
    return [
        {
            "id": "roadmap_001",
            "name": "Medical Career Roadmap",
            "career": "Medical Doctor",
            "stages": [
                {"stage": 1, "name": "High School", "duration": "3 years"},
                {"stage": 2, "name": "University - Medical School", "duration": "6 years"},
                {"stage": 3, "name": "Internship", "duration": "1 year"},
                {"stage": 4, "name": "Residency/Specialization", "duration": "3-5 years"}
            ],
            "total_duration": "13-15 years"
        },
        {
            "id": "roadmap_002",
            "name": "Software Engineering Career Roadmap",
            "career": "Software Engineer",
            "stages": [
                {"stage": 1, "name": "High School", "duration": "3 years"},
                {"stage": 2, "name": "University - Computer Science", "duration": "4 years"},
                {"stage": 3, "name": "Junior Developer", "duration": "2 years"},
                {"stage": 4, "name": "Senior Developer", "duration": "3+ years"}
            ],
            "total_duration": "12-15 years"
        }
    ]

@router.get("/templates")
async def get_templates():
    """Get study plan templates"""
    return [
        {
            "id": "template_001",
            "name": "Daily Study Schedule",
            "description": "Structured daily study plan for exam preparation",
            "type": "study_schedule"
        },
        {
            "id": "template_002",
            "name": "Weekly Study Planner",
            "description": "Weekly breakdown of subjects and topics",
            "type": "weekly_planner"
        }
    ]

@router.post("/study-sessions/log")
async def log_study_session(data: dict):
    """Log a study session"""
    return {
        "success": True,
        "data": {
            "id": f"session_{uuid.uuid4().hex[:8]}",
            "user_id": data.get("user_id", "test_user"),
            "subject": data.get("subject", "General"),
            "duration_minutes": data.get("duration_minutes", 60),
            "topics_covered": data.get("topics_covered", []),
            "notes": data.get("notes", ""),
            "created_at": datetime.datetime.now().isoformat()
        },
        "message": "Study session logged successfully"
    }

@router.get("/study-sessions/{user_id}")
async def get_study_sessions(user_id: str):
    """Get study sessions for a user"""
    return {
        "success": True,
        "sessions": [],
        "message": "Study sessions feature coming soon"
    }

print("✅ Plan module loaded")
