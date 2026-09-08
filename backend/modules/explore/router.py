"""
Explore Module Router
"""

from fastapi import APIRouter, HTTPException
from typing import Optional  # ← THIS WAS MISSING!
import json
from pathlib import Path

router = APIRouter(tags=["explore"])

PROJECT_ROOT = Path(__file__).resolve().parents[2]
CAREERS_FILE = PROJECT_ROOT / "data" / "explore" / "careers.json"
UNIVERSITIES_FILE = PROJECT_ROOT / "data" / "explore" / "universities.json"
SCHOLARSHIPS_FILE = PROJECT_ROOT / "data" / "explore" / "scholarships.json"

# ============================================================
# Load Functions
# ============================================================

def _filter_by_country(items, country):
    if country is None:
        return items
    return [item for item in items if item.get("country") == country]

def load_careers(country: Optional[str] = None):
    try:
        if CAREERS_FILE.exists():
            with open(CAREERS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return _filter_by_country(data.get("careers", []), country)
    except Exception as e:
        print(f"Error loading careers: {e}")
    return []

def load_universities(country: Optional[str] = None):
    try:
        if UNIVERSITIES_FILE.exists():
            with open(UNIVERSITIES_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return _filter_by_country(data.get("universities", []), country)
    except Exception as e:
        print(f"Error loading universities: {e}")
    return []

def load_scholarships(country: Optional[str] = None):
    try:
        if SCHOLARSHIPS_FILE.exists():
            with open(SCHOLARSHIPS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return _filter_by_country(data.get("scholarships", []), country)
    except Exception as e:
        print(f"Error loading scholarships: {e}")
    return []

# ============================================================
# Root Endpoint
# ============================================================

@router.get("/")
async def explore_root():
    return {
        "module": "explore",
        "status": "active",
        "endpoints": {
            "careers": "/api/explore/careers",
            "universities": "/api/explore/universities",
            "scholarships": "/api/explore/scholarships"
        }
    }

# ============================================================
# Careers Endpoints
# ============================================================

@router.get("/careers")
async def get_careers(country: Optional[str] = None):
    return {"success": True, "careers": load_careers(country)}

@router.get("/career/{career_id}")
async def get_career(career_id: str):
    careers = load_careers()
    for c in careers:
        if c.get("id") == career_id:
            return {"success": True, "career": c}
    raise HTTPException(status_code=404, detail=f"Career '{career_id}' not found")

# ============================================================
# Universities Endpoints
# ============================================================

@router.get("/universities")
async def get_universities(country: Optional[str] = None):
    return {"success": True, "universities": load_universities(country)}

@router.get("/university/{university_id}")
async def get_university(university_id: str):
    universities = load_universities()
    for u in universities:
        if u.get("id") == university_id:
            return {"success": True, "university": u}
    raise HTTPException(status_code=404, detail=f"University '{university_id}' not found")

# ============================================================
# Scholarships Endpoints
# ============================================================

@router.get("/scholarships")
async def get_scholarships(
    type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    country: Optional[str] = None
):
    """Get all scholarships with filters"""
    scholarships = load_scholarships(country)
    
    if type:
        scholarships = [s for s in scholarships if s.get("type") == type]
    if status:
        scholarships = [s for s in scholarships if s.get("status") == status]
    if search:
        search_lower = search.lower()
        scholarships = [
            s for s in scholarships
            if search_lower in s.get("title", "").lower()
            or search_lower in s.get("sponsor", "").lower()
            or search_lower in s.get("description", "").lower()
        ]
    
    return {"success": True, "scholarships": scholarships, "total": len(scholarships)}

@router.get("/scholarship/{scholarship_id}")
async def get_scholarship(scholarship_id: str):
    scholarships = load_scholarships()
    for s in scholarships:
        if s.get("id") == scholarship_id:
            return {"success": True, "scholarship": s}
    raise HTTPException(status_code=404, detail=f"Scholarship '{scholarship_id}' not found")
