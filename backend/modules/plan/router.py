"""
Plan Module Router - Complete Implementation
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timedelta
import json
import os
import uuid
import logging

logger = logging.getLogger(__name__)

# ✅ FIX: Added prefix here
router = APIRouter(tags=["plan"])

# Data file paths
DATA_DIR = "backend/data/plan"
STUDY_PLANS_FILE = f"{DATA_DIR}/study_plans.json"
ROADMAPS_FILE = f"{DATA_DIR}/roadmaps.json"

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

def load_json(file_path):
    """Load JSON data from file"""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        return {}

def save_json(file_path, data):
    """Save JSON data to file"""
    try:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving to {file_path}: {e}")

# Initialize default data
def init_data():
    """Initialize data files with default content"""
    if not os.path.exists(STUDY_PLANS_FILE):
        default_data = {
            "study_plans": [
                {
                    "id": "plan_001",
                    "name": "WASSCE Preparation Plan",
                    "description": "Comprehensive 6-month study plan for WASSCE",
                    "duration_months": 6,
                    "progress": 0,
                    "status": "active",
                    "subjects": [
                        {"id": "math", "name": "Mathematics", "hours_per_week": 6, "topics": ["Algebra", "Geometry", "Statistics"]},
                        {"id": "english", "name": "English Language", "hours_per_week": 5, "topics": ["Grammar", "Comprehension", "Essay Writing"]},
                        {"id": "science", "name": "Integrated Science", "hours_per_week": 5, "topics": ["Biology", "Chemistry", "Physics"]}
                    ],
                    "milestones": [
                        {"week": 4, "goal": "Complete first mock exam"},
                        {"week": 8, "goal": "Complete all core subjects"},
                        {"week": 12, "goal": "Complete second mock exam"},
                        {"week": 24, "goal": "Ready for WASSCE"}
                    ],
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                },
                {
                    "id": "plan_002",
                    "name": "University Entrance Preparation",
                    "description": "Prepare for university admissions",
                    "duration_months": 3,
                    "progress": 0,
                    "status": "active",
                    "subjects": [
                        {"id": "math", "name": "Mathematics", "hours_per_week": 4, "topics": ["Core Mathematics", "Elective Mathematics"]},
                        {"id": "english", "name": "English Language", "hours_per_week": 3, "topics": ["Reading", "Writing"]}
                    ],
                    "milestones": [
                        {"week": 2, "goal": "Complete application forms"},
                        {"week": 4, "goal": "Submit applications"},
                        {"week": 8, "goal": "Take entrance exams"}
                    ],
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
            ],
            "study_sessions": [],
            "reminders": [],
            "templates": [
                {
                    "id": "template_001",
                    "name": "Daily Study Schedule",
                    "description": "Effective daily study routine",
                    "schedule": [
                        {"time": "06:00", "activity": "Wake up and review"},
                        {"time": "07:00", "activity": "Study Session 1 (2 hours)"},
                        {"time": "09:00", "activity": "Break"},
                        {"time": "10:00", "activity": "Study Session 2 (2 hours)"},
                        {"time": "12:00", "activity": "Lunch"},
                        {"time": "14:00", "activity": "Study Session 3 (2 hours)"},
                        {"time": "16:00", "activity": "Exercise"},
                        {"time": "18:00", "activity": "Study Session 4 (1 hour)"},
                        {"time": "20:00", "activity": "Dinner"},
                        {"time": "21:00", "activity": "Review"},
                        {"time": "22:00", "activity": "Sleep"}
                    ]
                }
            ]
        }
        save_json(STUDY_PLANS_FILE, default_data)
        logger.info("Created default study plans data")

    if not os.path.exists(ROADMAPS_FILE):
        default_data = {
            "roadmaps": [
                {
                    "id": "roadmap_001",
                    "name": "Medical Career Roadmap",
                    "career": "Medical Doctor",
                    "stages": [
                        {"stage": 1, "name": "High School", "duration": "3 years", "actions": ["Focus on Science subjects", "Excel in WASSCE", "Score aggregate 8 or better"]},
                        {"stage": 2, "name": "University - Medical School", "duration": "6 years", "actions": ["Apply to medical schools", "Complete MBChB program"]},
                        {"stage": 3, "name": "Internship", "duration": "1 year", "actions": ["Complete housemanship", "Pass licensing exams"]},
                        {"stage": 4, "name": "Residency/Specialization", "duration": "3-5 years", "actions": ["Choose specialization", "Complete residency program"]}
                    ],
                    "total_duration": "13-15 years",
                    "created_at": datetime.now().isoformat()
                },
                {
                    "id": "roadmap_002",
                    "name": "Software Engineering Career Roadmap",
                    "career": "Software Engineer",
                    "stages": [
                        {"stage": 1, "name": "High School", "duration": "3 years", "actions": ["Focus on Mathematics and ICT", "Excel in WASSCE", "Score aggregate 6 or better"]},
                        {"stage": 2, "name": "University", "duration": "4 years", "actions": ["BSc in Computer Science or Software Engineering", "Learn programming languages", "Build a portfolio"]},
                        {"stage": 3, "name": "Early Career", "duration": "2-3 years", "actions": ["Join a tech company", "Work on real projects"]},
                        {"stage": 4, "name": "Senior Career", "duration": "3-5 years", "actions": ["Specialize in a field", "Lead projects", "Mentor others"]}
                    ],
                    "total_duration": "12-15 years",
                    "created_at": datetime.now().isoformat()
                }
            ]
        }
        save_json(ROADMAPS_FILE, default_data)
        logger.info("Created default roadmaps data")

# Initialize data on import
init_data()

# Pydantic models
class StudyPlanCreate(BaseModel):
    name: str
    description: str
    duration_months: int
    subjects: List[Dict[str, Any]]
    milestones: Optional[List[Dict[str, Any]]] = []

class StudyPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_months: Optional[int] = None
    subjects: Optional[List[Dict[str, Any]]] = None
    milestones: Optional[List[Dict[str, Any]]] = None

class StudySessionLog(BaseModel):
    subject: str
    duration_minutes: int
    topics_covered: List[str]
    notes: Optional[str] = ""

class RoadmapCreate(BaseModel):
    name: str
    career: str
    stages: List[Dict[str, Any]]
    total_duration: str

@router.get("/")
async def plan_root():
    """Plan module root endpoint"""
    return {
        "module": "plan",
        "status": "active",
        "endpoints": [
            "/study-plans",
            "/study-plans/{plan_id}",
            "/study-plans/create",
            "/study-plans/{plan_id}/progress",
            "/study-plans/{plan_id}/schedule",
            "/study-plans/{plan_id}/update",
            "/study-plans/{plan_id}/delete",
            "/roadmaps",
            "/roadmaps/{roadmap_id}",
            "/roadmaps/by-career/{career}",
            "/roadmaps/create",
            "/study-sessions/log",
            "/study-sessions/{user_id}",
            "/templates"
        ]
    }

# ============ STUDY PLANS ============

@router.get("/study-plans")
async def get_study_plans():
    """Get all study plans"""
    try:
        data = load_json(STUDY_PLANS_FILE)
        return {
            "success": True,
            "data": data.get("study_plans", [])
        }
    except Exception as e:
        logger.error(f"Error getting study plans: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/study-plans/{plan_id}")
async def get_study_plan(plan_id: str):
    """Get a specific study plan"""
    try:
        data = load_json(STUDY_PLANS_FILE)
        for plan in data.get("study_plans", []):
            if plan.get("id") == plan_id:
                return {
                    "success": True,
                    "data": plan
                }
        raise HTTPException(status_code=404, detail=f"Plan '{plan_id}' not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting study plan {plan_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/study-plans/create")
async def create_study_plan(request: StudyPlanCreate):
    """Create a new study plan"""
    try:
        data = load_json(STUDY_PLANS_FILE)
        plan_data = request.dict()
        plan_data["id"] = f"plan_{uuid.uuid4().hex[:8]}"
        plan_data["created_at"] = datetime.now().isoformat()
        plan_data["updated_at"] = datetime.now().isoformat()
        plan_data["progress"] = 0
        plan_data["status"] = "active"
        
        plans = data.get("study_plans", [])
        plans.append(plan_data)
        data["study_plans"] = plans
        save_json(STUDY_PLANS_FILE, data)
        
        logger.info(f"Created study plan: {plan_data['id']}")
        return {
            "success": True,
            "data": plan_data,
            "message": "Study plan created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating study plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/study-plans/{plan_id}")
async def update_study_plan(plan_id: str, request: StudyPlanUpdate):
    """Update a study plan"""
    try:
        data = load_json(STUDY_PLANS_FILE)
        plans = data.get("study_plans", [])
        for i, plan in enumerate(plans):
            if plan.get("id") == plan_id:
                update_data = request.dict(exclude_unset=True)
                for key, value in update_data.items():
                    plan[key] = value
                plan["updated_at"] = datetime.now().isoformat()
                plans[i] = plan
                data["study_plans"] = plans
                save_json(STUDY_PLANS_FILE, data)
                logger.info(f"Updated study plan: {plan_id}")
                return {
                    "success": True,
                    "data": plan,
                    "message": "Study plan updated successfully"
                }
        raise HTTPException(status_code=404, detail=f"Plan '{plan_id}' not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating study plan {plan_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/study-plans/{plan_id}")
async def delete_study_plan(plan_id: str):
    """Delete a study plan"""
    try:
        data = load_json(STUDY_PLANS_FILE)
        plans = data.get("study_plans", [])
        for i, plan in enumerate(plans):
            if plan.get("id") == plan_id:
                del plans[i]
                data["study_plans"] = plans
                save_json(STUDY_PLANS_FILE, data)
                logger.info(f"Deleted study plan: {plan_id}")
                return {
                    "success": True,
                    "message": f"Plan '{plan_id}' deleted successfully"
                }
        raise HTTPException(status_code=404, detail=f"Plan '{plan_id}' not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting study plan {plan_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/study-plans/{plan_id}/progress")
async def update_plan_progress(plan_id: str, progress: int = Body(..., embed=True)):
    """Update progress of a study plan"""
    if progress < 0 or progress > 100:
        raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")
    
    try:
        data = load_json(STUDY_PLANS_FILE)
        plans = data.get("study_plans", [])
        for plan in plans:
            if plan.get("id") == plan_id:
                plan["progress"] = min(progress, 100)
                plan["updated_at"] = datetime.now().isoformat()
                if progress >= 100:
                    plan["status"] = "completed"
                data["study_plans"] = plans
                save_json(STUDY_PLANS_FILE, data)
                logger.info(f"Updated progress for plan {plan_id}: {progress}%")
                return {
                    "success": True,
                    "data": plan,
                    "message": f"Progress updated to {progress}%"
                }
        raise HTTPException(status_code=404, detail=f"Plan '{plan_id}' not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating progress for plan {plan_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/study-plans/{plan_id}/schedule")
async def generate_study_schedule(plan_id: str, start_date: str = Query(..., description="Start date in ISO format")):
    """Generate a study schedule for a plan"""
    try:
        data = load_json(STUDY_PLANS_FILE)
        plan = None
        for p in data.get("study_plans", []):
            if p.get("id") == plan_id:
                plan = p
                break
        
        if not plan:
            raise HTTPException(status_code=404, detail=f"Plan '{plan_id}' not found")
        
        start = datetime.fromisoformat(start_date)
        subjects = plan.get("subjects", [])
        
        schedule = []
        for week in range(1, plan.get("duration_months", 1) * 4 + 1):
            week_start = start + timedelta(weeks=week - 1)
            week_schedule = {
                "week": week,
                "start_date": week_start.isoformat(),
                "subjects": []
            }
            for subject in subjects:
                subject_schedule = {
                    "subject": subject.get("name"),
                    "hours": subject.get("hours_per_week", 4),
                    "topics": subject.get("topics", [])[:2]
                }
                week_schedule["subjects"].append(subject_schedule)
            schedule.append(week_schedule)
        
        return {
            "success": True,
            "data": {
                "plan_id": plan_id,
                "plan_name": plan.get("name"),
                "start_date": start_date,
                "duration_weeks": len(schedule),
                "schedule": schedule
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating schedule for plan {plan_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ ROADMAPS ============

@router.get("/roadmaps")
async def get_roadmaps():
    """Get all career roadmaps"""
    try:
        data = load_json(ROADMAPS_FILE)
        return {
            "success": True,
            "data": data.get("roadmaps", [])
        }
    except Exception as e:
        logger.error(f"Error getting roadmaps: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/roadmaps/{roadmap_id}")
async def get_roadmap(roadmap_id: str):
    """Get a specific roadmap"""
    try:
        data = load_json(ROADMAPS_FILE)
        for roadmap in data.get("roadmaps", []):
            if roadmap.get("id") == roadmap_id:
                return {
                    "success": True,
                    "data": roadmap
                }
        raise HTTPException(status_code=404, detail=f"Roadmap '{roadmap_id}' not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting roadmap {roadmap_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/roadmaps/by-career/{career}")
async def get_roadmap_by_career(career: str):
    """Get a roadmap by career name"""
    try:
        data = load_json(ROADMAPS_FILE)
        career_lower = career.lower()
        for roadmap in data.get("roadmaps", []):
            if roadmap.get("career", "").lower() == career_lower:
                return {
                    "success": True,
                    "data": roadmap
                }
        raise HTTPException(status_code=404, detail=f"Roadmap for career '{career}' not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting roadmap by career {career}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/roadmaps/create")
async def create_roadmap(request: RoadmapCreate):
    """Create a new career roadmap"""
    try:
        data = load_json(ROADMAPS_FILE)
        roadmap_data = request.dict()
        roadmap_data["id"] = f"roadmap_{uuid.uuid4().hex[:8]}"
        roadmap_data["created_at"] = datetime.now().isoformat()
        
        roadmaps = data.get("roadmaps", [])
        roadmaps.append(roadmap_data)
        data["roadmaps"] = roadmaps
        save_json(ROADMAPS_FILE, data)
        
        logger.info(f"Created roadmap: {roadmap_data['id']}")
        return {
            "success": True,
            "data": roadmap_data,
            "message": "Roadmap created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating roadmap: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ STUDY SESSIONS ============

@router.post("/study-sessions/log")
async def log_study_session(user_id: str, request: StudySessionLog):
    """Log a study session"""
    try:
        data = load_json(STUDY_PLANS_FILE)
        session_data = request.dict()
        session_data["id"] = f"session_{uuid.uuid4().hex[:8]}"
        session_data["user_id"] = user_id
        session_data["created_at"] = datetime.now().isoformat()
        
        sessions = data.get("study_sessions", [])
        sessions.append(session_data)
        data["study_sessions"] = sessions
        save_json(STUDY_PLANS_FILE, data)
        
        logger.info(f"Logged study session for user {user_id}")
        return {
            "success": True,
            "data": session_data,
            "message": "Study session logged successfully"
        }
    except Exception as e:
        logger.error(f"Error logging study session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/study-sessions/{user_id}")
async def get_study_sessions(user_id: str):
    """Get study sessions for a user"""
    try:
        data = load_json(STUDY_PLANS_FILE)
        sessions = data.get("study_sessions", [])
        user_sessions = [s for s in sessions if s.get("user_id") == user_id]
        return {
            "success": True,
            "data": user_sessions
        }
    except Exception as e:
        logger.error(f"Error getting study sessions for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ TEMPLATES ============

@router.get("/templates")
async def get_templates():
    """Get study plan templates"""
    try:
        data = load_json(STUDY_PLANS_FILE)
        return {
            "success": True,
            "data": data.get("templates", [])
        }
    except Exception as e:
        logger.error(f"Error getting templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))
