"""
Profile Module Router - Complete with saved items
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
import datetime
from typing import List, Optional

router = APIRouter(tags=["profile"])

# In-memory storage for saved items (will be replaced with database)
saved_careers = {}
saved_universities = {}

class SaveCareerRequest(BaseModel):
    user_id: str
    career_id: str
    career_data: Optional[dict] = None

class SaveUniversityRequest(BaseModel):
    user_id: str
    university_id: str
    university_data: Optional[dict] = None

@router.get("/")
async def profile_root():
    return {"module": "profile", "status": "active"}

@router.get("/{user_id}")
async def get_profile(user_id: str):
    """Get user profile"""
    return {
        "user_id": user_id,
        "full_name": "Student",
        "email": "student@example.com",
        "role": "student",
        "created_at": datetime.datetime.now().isoformat()
    }

@router.post("/save-career")
async def save_career(request: SaveCareerRequest):
    """Save a career to user's saved items"""
    user_id = request.user_id
    career_id = request.career_id
    
    if not user_id or not career_id:
        raise HTTPException(status_code=400, detail="user_id and career_id required")
    
    # Initialize user's saved careers if not exists
    if user_id not in saved_careers:
        saved_careers[user_id] = []
    
    # Add career if not already saved
    if career_id not in saved_careers[user_id]:
        saved_careers[user_id].append({
            "career_id": career_id,
            "career_data": request.career_data,
            "saved_at": datetime.datetime.now().isoformat()
        })
    
    return {
        "success": True,
        "message": "Career saved successfully",
        "user_id": user_id,
        "career_id": career_id,
        "total_saved": len(saved_careers[user_id]),
        "saved_at": datetime.datetime.now().isoformat()
    }

@router.delete("/unsave-career")
async def unsave_career(user_id: str, career_id: str):
    """Remove a career from user's saved items"""
    if user_id in saved_careers:
        saved_careers[user_id] = [
            c for c in saved_careers[user_id] 
            if c.get("career_id") != career_id
        ]
    
    return {
        "success": True,
        "message": "Career removed from saved items",
        "user_id": user_id,
        "career_id": career_id
    }

@router.get("/saved-careers/{user_id}")
async def get_saved_careers(user_id: str):
    """Get all saved careers for a user"""
    careers = saved_careers.get(user_id, [])
    return {
        "success": True,
        "user_id": user_id,
        "careers": careers,
        "count": len(careers)
    }

@router.post("/save-university")
async def save_university(request: SaveUniversityRequest):
    """Save a university to user's saved items"""
    user_id = request.user_id
    university_id = request.university_id
    
    if not user_id or not university_id:
        raise HTTPException(status_code=400, detail="user_id and university_id required")
    
    if user_id not in saved_universities:
        saved_universities[user_id] = []
    
    if university_id not in [u.get("university_id") for u in saved_universities[user_id]]:
        saved_universities[user_id].append({
            "university_id": university_id,
            "university_data": request.university_data,
            "saved_at": datetime.datetime.now().isoformat()
        })
    
    return {
        "success": True,
        "message": "University saved successfully",
        "user_id": user_id,
        "university_id": university_id,
        "total_saved": len(saved_universities[user_id]),
        "saved_at": datetime.datetime.now().isoformat()
    }

@router.delete("/unsave-university")
async def unsave_university(user_id: str, university_id: str):
    """Remove a university from user's saved items"""
    if user_id in saved_universities:
        saved_universities[user_id] = [
            u for u in saved_universities[user_id] 
            if u.get("university_id") != university_id
        ]
    
    return {
        "success": True,
        "message": "University removed from saved items",
        "user_id": user_id,
        "university_id": university_id
    }

@router.get("/saved-universities/{user_id}")
async def get_saved_universities(user_id: str):
    """Get all saved universities for a user"""
    universities = saved_universities.get(user_id, [])
    return {
        "success": True,
        "user_id": user_id,
        "universities": universities,
        "count": len(universities)
    }

print("✅ Profile module loaded with saved items support")
