"""
Profile Module Router
"""

import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.user import User

router = APIRouter(tags=["profile"])

UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "avatars"


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
    language: Optional[str] = None


class SavedItemRequest(BaseModel):
    name: str


def _profile_out(user: User) -> dict:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "school": user.school,
        "grade": user.grade,
        "bio": user.bio,
        "phone": user.phone,
        "location": user.location,
        "interests": user.interests or [],
        "goals": user.goals or [],
        "subjects": user.subjects or [],
        "language": user.language,
        "avatar_url": f"/uploads/avatars/{user.avatar_filename}" if user.avatar_filename else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.get("/")
async def profile_root():
    return {"module": "profile", "status": "active"}


@router.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return _profile_out(current_user)


@router.put("/me")
async def update_my_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field in ("full_name", "school", "grade", "bio", "phone", "location", "interests", "goals", "subjects", "language"):
        value = getattr(request, field)
        if value is not None:
            setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return {"success": True, "profile": _profile_out(current_user)}


@router.post("/avatar")
async def upload_avatar(
    avatar: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    valid_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if avatar.content_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload JPG, PNG, WebP, or GIF.")

    content = await avatar.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    file_extension = avatar.filename.split(".")[-1] if avatar.filename else "jpg"
    filename = f"user{current_user.id}_{uuid.uuid4().hex[:8]}.{file_extension}"

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    if current_user.avatar_filename:
        old_path = UPLOAD_DIR / current_user.avatar_filename
        if old_path.exists():
            old_path.unlink()

    with open(UPLOAD_DIR / filename, "wb") as f:
        f.write(content)

    current_user.avatar_filename = filename
    db.commit()

    return {
        "success": True,
        "avatar_url": f"/uploads/avatars/{filename}",
        "message": "Avatar uploaded successfully",
    }


@router.delete("/avatar")
async def delete_avatar(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.avatar_filename:
        old_path = UPLOAD_DIR / current_user.avatar_filename
        if old_path.exists():
            old_path.unlink()
        current_user.avatar_filename = None
        db.commit()
    return {"success": True, "message": "Avatar deleted successfully"}


@router.get("/saved/careers")
async def get_saved_careers(current_user: User = Depends(get_current_user)):
    return {"success": True, "careers": current_user.saved_careers or []}


@router.post("/saved/careers")
async def save_career(
    item: SavedItemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    careers = list(current_user.saved_careers or [])
    if item.name not in careers:
        careers.append(item.name)
    current_user.saved_careers = careers
    db.commit()
    return {"success": True}


@router.get("/saved/universities")
async def get_saved_universities(current_user: User = Depends(get_current_user)):
    return {"success": True, "universities": current_user.saved_universities or []}


@router.get("/saved/scholarships")
async def get_saved_scholarships(current_user: User = Depends(get_current_user)):
    return {"success": True, "scholarships": current_user.saved_scholarships or []}
