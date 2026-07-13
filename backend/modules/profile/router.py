"""
Profile Module Router
FIXED: Added avatar upload and retrieval endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
import uuid
import datetime
import os
import shutil
from pathlib import Path

router = APIRouter(tags=["profile"])

# ============================================================
# Data Models
# ============================================================

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    interests: Optional[List[str]] = None
    goals: Optional[List[str]] = None
    subjects: Optional[List[str]] = None

# ============================================================
# In-Memory Storage (Replace with database in production)
# ============================================================

profiles = {}
avatar_store = {}

# ============================================================
# Root Endpoint
# ============================================================

@router.get("/")
async def profile_root():
    return {"module": "profile", "status": "active"}

# ============================================================
# Get Profile
# ============================================================

@router.get("/{user_id}")
async def get_profile(user_id: str):
    """Get user profile by ID"""
    if user_id not in profiles:
        # Return default profile if not found
        return {
            "id": user_id,
            "full_name": "Student",
            "email": "student@example.com",
            "role": "student",
            "school": None,
            "grade": None,
            "bio": None,
            "phone": None,
            "location": None,
            "interests": [],
            "goals": [],
            "subjects": [],
            "avatar_url": None,
            "created_at": datetime.datetime.now().isoformat()
        }
    return profiles[user_id]

# ============================================================
# Update Profile
# ============================================================

@router.put("/{user_id}")
async def update_profile(user_id: str, request: ProfileUpdateRequest):
    """Update user profile"""
    if user_id not in profiles:
        # Create profile if it doesn't exist
        profiles[user_id] = {
            "id": user_id,
            "full_name": "Student",
            "email": "student@example.com",
            "role": "student",
            "created_at": datetime.datetime.now().isoformat()
        }
    
    # Update fields
    profile = profiles[user_id]
    if request.full_name is not None:
        profile["full_name"] = request.full_name
    if request.school is not None:
        profile["school"] = request.school
    if request.grade is not None:
        profile["grade"] = request.grade
    if request.bio is not None:
        profile["bio"] = request.bio
    if request.phone is not None:
        profile["phone"] = request.phone
    if request.location is not None:
        profile["location"] = request.location
    if request.interests is not None:
        profile["interests"] = request.interests
    if request.goals is not None:
        profile["goals"] = request.goals
    if request.subjects is not None:
        profile["subjects"] = request.subjects
    
    profile["updated_at"] = datetime.datetime.now().isoformat()
    profiles[user_id] = profile
    
    return {"success": True, "profile": profile}

# ============================================================
# Avatar Upload
# ============================================================

UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "avatars"

@router.post("/avatar")
async def upload_avatar(
    user_id: str = Form(...),
    avatar: UploadFile = File(...)
):
    """Upload user avatar image"""
    
    # Validate file type
    valid_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if avatar.content_type not in valid_types:
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Please upload JPG, PNG, WebP, or GIF."
        )
    
    # Validate file size (5MB max)
    content = await avatar.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 5MB."
        )
    
    # Generate unique filename
    file_extension = avatar.filename.split('.')[-1] if avatar.filename else 'jpg'
    filename = f"{user_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    try:
        # Ensure directory exists
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        
        # Delete old avatar if exists
        if user_id in avatar_store:
            old_file = avatar_store[user_id]
            old_path = UPLOAD_DIR / old_file
            if old_path.exists():
                old_path.unlink()
        
        # Save new file
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Store filename
        avatar_store[user_id] = filename
        
        # Update profile with avatar URL
        avatar_url = f"/uploads/avatars/{filename}"
        if user_id in profiles:
            profiles[user_id]["avatar_url"] = avatar_url
        else:
            profiles[user_id] = {
                "id": user_id,
                "avatar_url": avatar_url,
                "created_at": datetime.datetime.now().isoformat()
            }
        
        return {
            "success": True,
            "avatar_url": avatar_url,
            "filename": filename,
            "message": "Avatar uploaded successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload avatar: {str(e)}")

# ============================================================
# Delete Avatar
# ============================================================

@router.delete("/avatar")
async def delete_avatar(user_id: str):
    """Delete user avatar"""
    
    if user_id in avatar_store:
        filename = avatar_store[user_id]
        file_path = UPLOAD_DIR / filename
        if file_path.exists():
            file_path.unlink()
        del avatar_store[user_id]
        
        # Update profile
        if user_id in profiles:
            profiles[user_id]["avatar_url"] = None
        
        return {"success": True, "message": "Avatar deleted successfully"}
    
    return {"success": True, "message": "No avatar to delete"}

# ============================================================
# Saved Items Endpoints
# ============================================================

saved_careers = {}
saved_universities = {}
saved_scholarships = {}

@router.get("/saved/careers")
async def get_saved_careers(user_id: Optional[str] = None):
    if not user_id:
        return {"success": True, "careers": []}
    return {"success": True, "careers": saved_careers.get(user_id, [])}

@router.post("/saved/careers")
async def save_career(user_id: str, career: dict):
    if user_id not in saved_careers:
        saved_careers[user_id] = []
    saved_careers[user_id].append(career.get("name", career.get("title")))
    return {"success": True}

@router.get("/saved/universities")
async def get_saved_universities(user_id: Optional[str] = None):
    if not user_id:
        return {"success": True, "universities": []}
    return {"success": True, "universities": saved_universities.get(user_id, [])}

@router.get("/saved/scholarships")
async def get_saved_scholarships(user_id: Optional[str] = None):
    if not user_id:
        return {"success": True, "scholarships": []}
    return {"success": True, "scholarships": saved_scholarships.get(user_id, [])}

print("✅ Profile module loaded with avatar endpoints")
