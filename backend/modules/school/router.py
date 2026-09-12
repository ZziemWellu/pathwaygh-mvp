"""
School Administration Module Router - schools are self-service: any
authenticated user can create one (becoming its admin) or join one with a
short code. The admin dashboard is scoped strictly to the caller's own
school_id via require_school_admin - there is no school_id path/query param
anywhere in this router, which is the point: a school admin can never
address another school's roster by guessing or editing an id.
"""

import os
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user, require_school_admin
from core.whatsapp import send_whatsapp_message
from models.school import School
from models.user import User
from modules.dashboard.aggregation import overview_for_users, summarize_overviews
from modules.school.digest import build_school_digest_text, eligible_admins_for_digest

router = APIRouter(tags=["school"])

# Excludes visually ambiguous characters (0/O, 1/I/L) since this is typed by
# hand, not copy-pasted.
JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
JOIN_CODE_LENGTH = 6


class CreateSchoolRequest(BaseModel):
    name: str
    country: str | None = None


class JoinSchoolRequest(BaseModel):
    join_code: str


class SchoolConsentRequest(BaseModel):
    attested: bool


def _generate_join_code(db: Session) -> str:
    for _ in range(10):
        code = "".join(secrets.choice(JOIN_CODE_ALPHABET) for _ in range(JOIN_CODE_LENGTH))
        if not db.query(School).filter(School.join_code == code).first():
            return code
    raise HTTPException(status_code=500, detail="Could not generate a unique join code, please retry")


def _school_out(school: School) -> dict:
    return {
        "id": school.id,
        "name": school.name,
        "country": school.country,
        "join_code": school.join_code,
        "parent_consent_attested": school.parent_consent_attested,
        "parent_consent_attested_at": school.parent_consent_attested_at.isoformat() if school.parent_consent_attested_at else None,
    }


@router.get("/")
async def school_root():
    return {"module": "school", "status": "active"}


@router.get("/me")
async def get_my_school(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.school_id:
        return {"success": True, "school": None, "is_school_admin": False}
    school = db.query(School).filter(School.id == current_user.school_id).first()
    return {"success": True, "school": _school_out(school) if school else None, "is_school_admin": current_user.is_school_admin}


@router.post("/create")
async def create_school(
    request: CreateSchoolRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if current_user.school_id is not None:
        raise HTTPException(status_code=400, detail="You're already linked to a school")

    school = School(
        name=request.name,
        country=request.country or current_user.country,
        join_code=_generate_join_code(db),
        created_by_id=current_user.id,
    )
    db.add(school)
    db.flush()

    current_user.school_id = school.id
    current_user.is_school_admin = True
    db.commit()
    db.refresh(school)

    return {"success": True, "school": _school_out(school)}


@router.post("/join")
async def join_school(
    request: JoinSchoolRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if current_user.school_id is not None:
        raise HTTPException(status_code=400, detail="You're already linked to a school")

    code = request.join_code.strip().upper()
    school = db.query(School).filter(School.join_code == code).first()
    if not school:
        raise HTTPException(status_code=404, detail="Invalid join code")

    current_user.school_id = school.id
    db.commit()

    return {"success": True, "school": _school_out(school)}


@router.patch("/consent")
async def set_school_consent(
    request: SchoolConsentRequest,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db),
):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    school.parent_consent_attested = request.attested
    school.parent_consent_attested_at = datetime.now(timezone.utc) if request.attested else None
    school.parent_consent_attested_by_id = current_user.id if request.attested else None
    db.commit()
    db.refresh(school)
    return {"success": True, "school": _school_out(school)}


@router.get("/dashboard")
async def get_school_dashboard(current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    students = db.query(User).filter(User.school_id == current_user.school_id).all()
    overview_by_user = overview_for_users(db, [s.id for s in students])

    roster = [
        {
            "id": s.id,
            "full_name": s.full_name,
            "email": s.email,
            "grade": s.grade,
            "is_school_admin": s.is_school_admin,
            **overview_by_user[s.id],
        }
        for s in students
    ]

    school = db.query(School).filter(School.id == current_user.school_id).first()

    return {
        "success": True,
        "school": _school_out(school) if school else None,
        "roster": roster,
        "summary": summarize_overviews(list(overview_by_user.values())),
    }


@router.post("/send-digests")
async def send_school_digests(x_digest_secret: str = Header(...), db: Session = Depends(get_db)):
    """Cron-callable (see .github/workflows/parent-digest.yml), not
    user-facing - gated by the same shared secret as the parent digest
    endpoint, not get_current_user."""
    expected = os.getenv("DIGEST_TRIGGER_SECRET")
    if not expected:
        raise HTTPException(status_code=503, detail="Digest sending is not configured")
    if x_digest_secret != expected:
        raise HTTPException(status_code=401, detail="Invalid digest secret")

    sent = skipped = failed = 0
    for admin in eligible_admins_for_digest(db):
        text = build_school_digest_text(db, admin)
        if not text:
            skipped += 1
            continue
        if send_whatsapp_message(to=admin.phone, body=text):
            admin.last_school_digest_sent_at = datetime.utcnow()
            db.commit()
            sent += 1
        else:
            failed += 1

    return {"success": True, "sent": sent, "skipped": skipped, "failed": failed}
