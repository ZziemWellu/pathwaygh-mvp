"""
Explore Module Router
FIXED: Added universities endpoint
"""

from fastapi import APIRouter, HTTPException
import json
import os
from pathlib import Path

router = APIRouter(tags=["explore"])

PROJECT_ROOT = Path(__file__).parent.parent.parent
CAREERS_FILE = PROJECT_ROOT / "data" / "explore" / "careers.json"
UNIVERSITIES_FILE = PROJECT_ROOT / "data" / "explore" / "universities.json"

def load_careers():
    try:
        with open(CAREERS_FILE, 'r') as f:
            data = json.load(f)
            return data.get("careers", [])
    except:
        return [
            {"id": "medical_doctor", "title": "Medical Doctor", "category": "Healthcare"},
            {"id": "software_engineer", "title": "Software Engineer", "category": "Technology"}
        ]

def load_universities():
    try:
        if UNIVERSITIES_FILE.exists():
            with open(UNIVERSITIES_FILE, 'r') as f:
                data = json.load(f)
                return data.get("universities", [])
    except:
        pass
    # Fallback data
    return [
        {"id": "knust", "name": "KNUST", "location": "Kumasi", "cutoff": "12"},
        {"id": "ug", "name": "University of Ghana", "location": "Accra", "cutoff": "14"},
        {"id": "umat", "name": "UMaT", "location": "Tarkwa", "cutoff": "16"}
    ]

@router.get("/")
async def explore_root():
    return {"module": "explore", "status": "active"}

@router.get("/careers")
async def get_careers():
    return {"success": True, "careers": load_careers()}

@router.get("/career/{career_id}")
async def get_career(career_id: str):
    careers = load_careers()
    for c in careers:
        if c.get("id") == career_id:
            return {"success": True, "career": c}
    raise HTTPException(status_code=404, detail=f"Career '{career_id}' not found")

@router.get("/universities")
async def get_universities():
    """Get all universities - FIXED: Returns data instead of 404"""
    return {"success": True, "universities": load_universities()}

@router.get("/university/{university_id}")
async def get_university(university_id: str):
    universities = load_universities()
    for u in universities:
        if u.get("id") == university_id:
            return {"success": True, "university": u}
    raise HTTPException(status_code=404, detail=f"University '{university_id}' not found")
