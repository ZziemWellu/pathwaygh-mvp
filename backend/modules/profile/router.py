"""
Profile Module Router
"""

import re
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.user import User
from modules.auth.consent import issue_consent_otp

router = APIRouter(tags=["profile"])

UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "avatars"

E164_PATTERN = re.compile(r"^\+[1-9]\d{7,14}$")


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
    guardian_email: Optional[EmailStr] = None
    guardian_phone: Optional[str] = None
    guardian_whatsapp_opt_in: Optional[bool] = None
    school_digest_whatsapp_opt_in: Optional[bool] = None

    @field_validator("guardian_phone")
    @classmethod
    def _validate_e164(cls, value):
        if value is not None and not E164_PATTERN.match(value):
            raise ValueError("guardian_phone must be in E.164 format, e.g. +233241234567")
        return value


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
        "guardian_email": user.guardian_email,
        "consent_given_at": user.consent_given_at.isoformat() if user.consent_given_at else None,
        "consent_version": user.consent_version,
        "guardian_phone": user.guardian_phone,
        "guardian_whatsapp_opt_in": user.guardian_whatsapp_opt_in,
        "school_digest_whatsapp_opt_in": user.school_digest_whatsapp_opt_in,
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
    for field in ("full_name", "school", "grade", "bio", "phone", "location", "interests", "goals", "subjects", "language", "guardian_phone", "guardian_whatsapp_opt_in", "school_digest_whatsapp_opt_in"):
        value = getattr(request, field)
        if value is not None:
            setattr(current_user, field, value)

    # Cross-field: can't be a plain Pydantic field validator since it
    # depends on the *effective* phone, which may come from this request
    # or from a value already saved in an earlier one - checked after the
    # loop above so current_user.phone already reflects that.
    if current_user.school_digest_whatsapp_opt_in and not (current_user.phone and E164_PATTERN.match(current_user.phone)):
        raise HTTPException(status_code=400, detail="phone must be in E.164 format to enable the school WhatsApp digest, e.g. +233241234567")

    if request.guardian_email is not None and request.guardian_email != current_user.guardian_email:
        if request.guardian_email == current_user.email:
            raise HTTPException(status_code=400, detail="Guardian email must be different from your own email")
        # Changing the guardian contact always requires re-verifying it -
        # otherwise a previously-verified status would silently carry over
        # to a brand-new, never-confirmed address.
        current_user.guardian_email = request.guardian_email
        current_user.consent_given_at = None
        current_user.consent_version = None
        issue_consent_otp(current_user)

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
