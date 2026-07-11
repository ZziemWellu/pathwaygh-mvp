"""
Explore Module Router
"""

from fastapi import APIRouter, HTTPException
import json
import os

router = APIRouter(tags=["explore"])

CAREERS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "explore", "careers.json")

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
