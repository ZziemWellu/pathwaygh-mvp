"""
Plan Module Router - Study Plans and Roadmaps
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import SessionLocal, get_db
from core.security import get_current_user
from models.plan import Plan
from models.user import User

router = APIRouter(tags=["plan"])

DEFAULT_PLANS = [
    {
        "name": "WASSCE Preparation Plan",
        "description": "Comprehensive 6-month study plan for WASSCE",
        "duration_months": 6,
        "subjects": ["Mathematics", "English Language", "Integrated Science"],
        "goal": "exam_preparation",
        "target_exam": "WASSCE",
        "priority": "high",
    },
    {
        "name": "University Entrance Preparation",
        "description": "Prepare for university admissions",
        "duration_months": 3,
        "subjects": ["Mathematics", "English Language"],
        "goal": "university_admission",
        "target_exam": "University Entrance",
        "priority": "high",
    },
]


def _seed_default_plans_if_empty():
    db = SessionLocal()
    try:
        if db.query(Plan).count() == 0:
            for p in DEFAULT_PLANS:
                _create_plan_row(db, p)
    finally:
        db.close()


def _create_plan_row(db: Session, fields: dict, user_id: Optional[int] = None) -> Plan:
    slug = f"plan_{uuid.uuid4().hex[:8]}"
    data = {
        "id": slug,
        "duration": f"{fields.get('duration_months', 3)} months",
        "progress": 0,
        "status": "active",
        **fields,
    }
    plan = Plan(slug=slug, user_id=user_id, title=fields["name"], data=data)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def _plan_out(plan: Plan) -> dict:
    return {**plan.data, "id": plan.slug}


_seed_default_plans_if_empty()


class CreatePlanRequest(BaseModel):
    name: str
    description: Optional[str] = None
    duration_months: int = 3
    goal: Optional[str] = None
    subjects: Optional[List[str]] = []
    target_exam: Optional[str] = None
    priority: Optional[str] = "medium"


class UpdatePlanRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_months: Optional[int] = None
    progress: Optional[int] = None
    status: Optional[str] = None
    subjects: Optional[List[str]] = None


@router.get("/")
async def plan_root():
    return {
        "module": "plan",
        "status": "active",
        "endpoints": ["/study-plans", "/study-plans/{id}", "/study-plans/create", "/study-plans/{id}/progress", "/roadmaps", "/templates"],
    }


@router.get("/study-plans")
async def get_study_plans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plans = db.query(Plan).all()
    return [
        _plan_out(p)
        for p in plans
        if current_user.country == "GH" or p.data.get("target_exam") != "WASSCE"
    ]


@router.get("/study-plans/{plan_id}")
async def get_study_plan(plan_id: str, db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.slug == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return _plan_out(plan)


@router.post("/study-plans/create")
async def create_study_plan(request: CreatePlanRequest, db: Session = Depends(get_db)):
    plan = _create_plan_row(
        db,
        {
            "name": request.name,
            "description": request.description or f"Study plan for {request.goal or 'general'}",
            "duration_months": request.duration_months,
            "subjects": request.subjects or [],
            "goal": request.goal or "general_improvement",
            "target_exam": request.target_exam,
            "priority": request.priority or "medium",
        },
    )
    return {"success": True, "message": "Study plan created successfully", "plan": _plan_out(plan)}


@router.put("/study-plans/{plan_id}")
async def update_study_plan(plan_id: str, request: UpdatePlanRequest, db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.slug == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    data = dict(plan.data)
    if request.name is not None:
        data["name"] = request.name
        plan.title = request.name
    if request.description is not None:
        data["description"] = request.description
    if request.duration_months is not None:
        data["duration_months"] = request.duration_months
        data["duration"] = f"{request.duration_months} months"
    if request.progress is not None:
        data["progress"] = min(100, max(0, request.progress))
    if request.status is not None:
        data["status"] = request.status
    if request.subjects is not None:
        data["subjects"] = request.subjects
    data["updated_at"] = datetime.now(timezone.utc).isoformat()

    plan.data = data
    db.commit()
    return {"success": True, "message": "Plan updated successfully", "plan": _plan_out(plan)}


@router.delete("/study-plans/{plan_id}")
async def delete_study_plan(plan_id: str, db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.slug == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    deleted = _plan_out(plan)
    db.delete(plan)
    db.commit()
    return {"success": True, "message": f"Plan '{plan_id}' deleted successfully", "deleted": deleted}


@router.put("/study-plans/{plan_id}/progress")
async def update_progress(plan_id: str, payload: dict, db: Session = Depends(get_db)):
    progress = payload.get("progress")
    if progress is None:
        raise HTTPException(status_code=400, detail="Progress value required")

    plan = db.query(Plan).filter(Plan.slug == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    data = dict(plan.data)
    data["progress"] = min(100, max(0, progress))
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    plan.data = data
    db.commit()
    return {"success": True, "message": f"Progress updated to {progress}%", "plan": _plan_out(plan)}


@router.get("/roadmaps")
async def get_roadmaps():
    return [
        {
            "id": "roadmap_001",
            "name": "Medical Career Roadmap",
            "career": "Medical Doctor",
            "stages": [
                {"stage": 1, "name": "High School", "duration": "3 years"},
                {"stage": 2, "name": "University - Medical School", "duration": "6 years"},
            ],
            "total_duration": "9+ years",
        }
    ]


@router.get("/templates")
async def get_templates():
    return [
        {"id": "template_001", "name": "Daily Study Schedule", "description": "Structured daily study plan for exam preparation", "type": "study_schedule"},
        {"id": "template_002", "name": "Weekly Study Planner", "description": "Weekly breakdown of subjects and topics", "type": "weekly_planner"},
    ]
