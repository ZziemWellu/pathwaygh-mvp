"""
Explore Module Router
"""

from datetime import date
from fastapi import APIRouter, HTTPException
from typing import Optional
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

def _available_in(item, country):
    """An item is shown in a country if it lists it in `countries`, or (older
    single-country records) if its `country` matches."""
    countries = item.get("countries")
    if countries:
        return country in countries
    return item.get("country") == country


def _filter_by_country(items, country):
    if country is None:
        return items
    return [item for item in items if _available_in(item, country)]


def _parse_date(value):
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None


def scholarship_status(scholarship, today=None):
    """Work the status out from the dates so it never goes stale.

    open / upcoming / closed when the deadline is a date; "rolling" when the
    deadline is "rolling"; otherwise "check" (the dates are announced yearly).
    """
    today = today or date.today()
    deadline = _parse_date(scholarship.get("deadline"))
    if deadline is None:
        return "rolling" if scholarship.get("deadline") == "rolling" else "check"
    if today > deadline:
        return "closed"
    opens = _parse_date(scholarship.get("opens"))
    if opens and today < opens:
        return "upcoming"
    return "open"

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
                scholarships = [
                    {**s, "status": scholarship_status(s)} for s in data.get("scholarships", [])
                ]
                return _filter_by_country(scholarships, country)
    except Exception as e:
        print(f"Error loading scholarships: {e}")
    return []

# ============================================================
# Root Endpoint
# ============================================================

@router.get("/")
def explore_root():
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
def get_careers(country: Optional[str] = None):
    return {"success": True, "careers": load_careers(country)}

@router.get("/career/{career_id}")
def get_career(career_id: str):
    careers = load_careers()
    for c in careers:
        if c.get("id") == career_id:
            return {"success": True, "career": c}
    raise HTTPException(status_code=404, detail=f"Career '{career_id}' not found")

# ============================================================
# Universities Endpoints
# ============================================================

@router.get("/universities")
def get_universities(country: Optional[str] = None):
    return {"success": True, "universities": load_universities(country)}

@router.get("/university/{university_id}")
def get_university(university_id: str):
    universities = load_universities()
    for u in universities:
        if u.get("id") == university_id:
            return {"success": True, "university": u}
    raise HTTPException(status_code=404, detail=f"University '{university_id}' not found")

# ============================================================
# Scholarships Endpoints
# ============================================================

@router.get("/scholarships")
def get_scholarships(
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
            or search_lower in s.get("eligibility", "").lower()
        ]
    
    return {"success": True, "scholarships": scholarships, "total": len(scholarships)}

@router.get("/scholarship/{scholarship_id}")
def get_scholarship(scholarship_id: str):
    scholarships = load_scholarships()
    for s in scholarships:
        if s.get("id") == scholarship_id:
            return {"success": True, "scholarship": s}
    raise HTTPException(status_code=404, detail=f"Scholarship '{scholarship_id}' not found")
