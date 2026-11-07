"""
Profile Module Router
"""

import io
import re
import uuid
from pathlib import Path
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from core.database import get_db
from core.levels import STUDENT_LEVELS, can_move_to_level, level_from_grade
from core.phone import normalize_phone
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
    level: Optional[Literal["primary", "jhs", "shs"]] = None
    school_digest_whatsapp_opt_in: Optional[bool] = None


class SavedItemRequest(BaseModel):
    name: str


def _profile_out(user: User) -> dict:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "school": user.school,
        "grade": user.grade,
        "level": user.level,
        "country": user.country,
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


def _apply_level_change(user: User, request: ProfileUpdateRequest) -> None:
    """Level follows the student up through school and can't go back down.
    The Grade dropdown is the usual way it changes ('SHS 1' means shs)."""
    new_level = request.level
    if new_level is None and request.grade:
        from_grade = level_from_grade(request.grade)
        new_level = from_grade if from_grade in STUDENT_LEVELS else None
    if new_level is None or new_level == user.level:
        return
    if not can_move_to_level(user.level, new_level):
        raise HTTPException(
            status_code=400,
            detail="You can move up a level but not back down. If this was a mistake, please contact support.",
        )
    user.level = new_level


@router.get("/")
def profile_root():
    return {"module": "profile", "status": "active"}


@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_user)):
    return _profile_out(current_user)


@router.put("/me")
def update_my_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _apply_level_change(current_user, request)

    for field in ("full_name", "school", "grade", "bio", "phone", "location", "interests", "goals", "subjects", "language", "guardian_whatsapp_opt_in", "school_digest_whatsapp_opt_in"):
        value = getattr(request, field)
        if value is not None:
            setattr(current_user, field, value)

    # Cross-field: can't be a plain Pydantic field validator since it
    # depends on the *effective* phone, which may come from this request
    # or from a value already saved in an earlier one - checked after the
    # loop above so current_user.phone already reflects that.
    if current_user.school_digest_whatsapp_opt_in and not (current_user.phone and E164_PATTERN.match(current_user.phone)):
        raise HTTPException(status_code=400, detail="phone must be in E.164 format to enable the school WhatsApp digest, e.g. +233241234567")

    reverify_consent = False
    new_guardian_email = request.guardian_email.strip().lower() if request.guardian_email else None
    if new_guardian_email is not None and new_guardian_email != (current_user.guardian_email or "").lower():
        if new_guardian_email == current_user.email.lower():
            raise HTTPException(status_code=400, detail="Guardian email must be different from your own email")
        # Changing the guardian contact always requires re-verifying it -
        # otherwise a previously-verified status would silently carry over
        # to a brand-new, never-confirmed address.
        current_user.guardian_email = new_guardian_email
        current_user.consent_given_at = None
        current_user.consent_version = None
        reverify_consent = True

    if request.guardian_phone is not None:
        try:
            new_phone = normalize_phone(request.guardian_phone, current_user.country)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        if new_phone != current_user.guardian_phone:
            current_user.guardian_phone = new_phone
            # The phone is the only guardian contact, so a new number is an
            # unconfirmed one. With an email on file that stays the verified
            # contact, and this is only where the WhatsApp digest goes.
            if not current_user.guardian_email:
                current_user.consent_given_at = None
                current_user.consent_version = None
                reverify_consent = True

    if reverify_consent:
        issue_consent_otp(current_user)

    db.commit()
    db.refresh(current_user)
    return {"success": True, "profile": _profile_out(current_user)}


@router.post("/avatar")
def upload_avatar(
    avatar: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = avatar.file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    # The client-supplied Content-Type header (and filename/extension) is
    # trivially spoofable - a request can claim image/png while uploading
    # anything. Decode the actual bytes with Pillow and derive the saved
    # extension from what the image really is, so a non-image file (e.g.
    # an .svg or .html with embedded script) can never be written into
    # /uploads/avatars, regardless of what the request claimed.
    valid_formats = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp", "GIF": "gif"}
    try:
        image = Image.open(io.BytesIO(content))
        image.verify()
        image_format = image.format
    except (UnidentifiedImageError, OSError):
        image_format = None
    if image_format not in valid_formats:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload JPG, PNG, WebP, or GIF.")

    file_extension = valid_formats[image_format]
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
def delete_avatar(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.avatar_filename:
        old_path = UPLOAD_DIR / current_user.avatar_filename
        if old_path.exists():
            old_path.unlink()
        current_user.avatar_filename = None
        db.commit()
    return {"success": True, "message": "Avatar deleted successfully"}


@router.get("/saved/careers")
def get_saved_careers(current_user: User = Depends(get_current_user)):
    return {"success": True, "careers": current_user.saved_careers or []}


@router.post("/saved/careers")
def save_career(
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
def get_saved_universities(current_user: User = Depends(get_current_user)):
    return {"success": True, "universities": current_user.saved_universities or []}


@router.get("/saved/scholarships")
def get_saved_scholarships(current_user: User = Depends(get_current_user)):
    return {"success": True, "scholarships": current_user.saved_scholarships or []}
