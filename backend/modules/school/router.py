"""
School Administration Module Router - schools are self-service: any
authenticated user can create one (becoming its admin) or join one with a
short code. The admin dashboard is scoped strictly to the caller's own
school_id via require_school_admin - there is no school_id path/query param
anywhere in this router, which is the point: a school admin can never
address another school's roster by guessing or editing an id.
"""

import csv
import io
import os
import secrets
from datetime import datetime, timezone
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from core.csv_safe import csv_safe
from core.accounts import correct_level, find_user, issue_username, temporary_password
from core.database import get_db
from core.levels import STUDENT_LEVELS, level_from_grade
from core.phone import normalize_phone
from core.secrets_compare import secrets_match
from core.rate_limit import limiter
from core.security import create_access_token, get_current_user, hash_password, require_school_admin
from core.whatsapp import send_whatsapp_message
from models.school import School
from models.user import User
from modules.dashboard.aggregation import overview_for_users, summarize_overviews
from modules.licence.service import grant_trial, join_block_reason, licence_status
from modules.school.digest import build_school_digest_text, eligible_admins_for_digest

router = APIRouter(tags=["school"])

# Excludes visually ambiguous characters (0/O, 1/I/L) since this is typed by
# hand, not copy-pasted.
JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
JOIN_CODE_LENGTH = 6


class CreateSchoolRequest(BaseModel):
    name: str
    country: str | None = None


class RegisterSchoolRequest(BaseModel):
    school_name: str = Field(min_length=2, max_length=255)
    full_name: str = Field(min_length=1, max_length=255)
    role: Literal["headteacher", "assistant_headteacher", "teacher", "ict_coordinator", "administrator", "other"]
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    password: str = Field(min_length=8, max_length=128)
    country: Literal["GH", "NG", "SL", "LR", "GM"]
    authorised: bool


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
def school_root():
    return {"module": "school", "status": "active"}


@router.get("/me")
def get_my_school(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.school_id:
        return {"success": True, "school": None, "is_school_admin": False}
    school = db.query(School).filter(School.id == current_user.school_id).first()
    return {"success": True, "school": _school_out(school) if school else None, "is_school_admin": current_user.is_school_admin}


@router.post("/register")
@limiter.limit("20/hour")
def register_school(request: Request, body: RegisterSchoolRequest, db: Session = Depends(get_db)):
    """Sign-up for the adult who runs a school's account: creates the school,
    makes this person its admin and starts the free first term, in one step.
    An adult needs no parent consent and has no school level, so neither is
    asked for."""
    from modules.auth.router import _user_out

    if not body.authorised:
        raise HTTPException(status_code=400, detail="Please confirm you're authorised to register this school")
    if not body.school_name.strip() or not body.full_name.strip():
        raise HTTPException(status_code=400, detail="Please give the school's name and your name")
    email = body.email.strip().lower()
    if find_user(db, email):
        raise HTTPException(
            status_code=400,
            detail="This email already has an account. Sign in and create your school from Profile, or use another email.",
        )
    try:
        phone = normalize_phone(body.phone, body.country)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    admin = User(
        email=email,
        full_name=body.full_name.strip(),
        password_hash=hash_password(body.password),
        country=body.country,
        phone=phone,
        school=body.school_name.strip(),
        bio=f"School role: {body.role.replace('_', ' ')}",
        is_school_admin=True,
    )
    db.add(admin)
    db.flush()
    school = School(
        name=body.school_name.strip(),
        country=body.country,
        join_code=_generate_join_code(db),
        created_by_id=admin.id,
    )
    db.add(school)
    db.flush()
    grant_trial(db, school)
    admin.school_id = school.id
    db.commit()
    db.refresh(admin)
    return {"success": True, "token": create_access_token(admin.id, admin.token_version or 0), "user": _user_out(admin)}


@router.post("/create")
def create_school(
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
    # Every new school's first term is free, with the full licence.
    grant_trial(db, school)

    current_user.school_id = school.id
    current_user.is_school_admin = True
    db.commit()
    db.refresh(school)

    return {"success": True, "school": _school_out(school)}


@router.post("/join")
def join_school(
    request: JoinSchoolRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if current_user.school_id is not None:
        raise HTTPException(status_code=400, detail="You're already linked to a school")

    code = request.join_code.strip().upper()
    school = db.query(School).filter(School.join_code == code).first()
    if not school:
        raise HTTPException(status_code=404, detail="Invalid join code")

    blocked = join_block_reason(db, school)
    if blocked:
        raise HTTPException(status_code=403, detail=blocked)

    current_user.school_id = school.id
    db.commit()

    return {"success": True, "school": _school_out(school)}


@router.patch("/consent")
def set_school_consent(
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


class IssuedStudent(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    grade: str = Field(max_length=50)
    guardian_phone: Optional[str] = Field(default=None, max_length=30)


class IssueLoginsRequest(BaseModel):
    # Hashing each password takes real time, and this runs inside one request.
    students: List[IssuedStudent] = Field(min_length=1, max_length=50)


class CorrectLevelRequest(BaseModel):
    level: Literal["primary", "jhs", "shs"]
    reason: str = Field(min_length=3, max_length=255)


def _own_student(db: Session, admin: User, student_id: int) -> User:
    student = db.query(User).filter(User.id == student_id, User.school_id == admin.school_id).first()
    if not student or student.is_school_admin:
        raise HTTPException(status_code=404, detail="Student not found at your school")
    return student


@router.post("/students")
def issue_student_logins(
    request: IssueLoginsRequest,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db),
):
    """School-issued logins for pupils with no email: a username and a one-time
    password for the admin to print. It relies on the school's own consent
    process, so the school must have confirmed that first. The passwords are
    only ever returned here."""
    school = db.query(School).filter(School.id == current_user.school_id).first()
    if not school.parent_consent_attested:
        raise HTTPException(
            status_code=400,
            detail="Please first confirm on this page that your school has collected parents' consent.",
        )

    # Checked before creating any, so a class is never half issued.
    parsed = []
    for index, entry in enumerate(request.students, start=1):
        level = level_from_grade(entry.grade)
        if level not in STUDENT_LEVELS:
            raise HTTPException(status_code=400, detail=f"Line {index}: '{entry.grade}' isn't a class such as Primary 4 or JHS 2")
        phone = None
        if entry.guardian_phone and entry.guardian_phone.strip():
            try:
                phone = normalize_phone(entry.guardian_phone, school.country)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Line {index}: {e}") from e
        parsed.append((entry, level, phone))

    status = licence_status(db, school)
    if status["seat_limit"] is not None and status["students"] + len(parsed) > status["seat_limit"]:
        raise HTTPException(
            status_code=403,
            detail=f"That would take {school.name} past its limit of {status['seat_limit']} students. "
            f"You have {status['students']} now.",
        )

    issued = []
    for entry, level, phone in parsed:
        username = issue_username(db, entry.full_name)
        password = temporary_password()
        db.add(
            User(
                username=username,
                full_name=entry.full_name.strip(),
                password_hash=hash_password(password),
                must_change_password=True,
                country=school.country,
                level=level,
                grade=entry.grade.strip(),
                school_id=school.id,
                guardian_phone=phone,
            )
        )
        # So the next name in this batch sees this username as taken.
        db.flush()
        issued.append({"full_name": entry.full_name.strip(), "grade": entry.grade.strip(), "username": username, "temporary_password": password})
    db.commit()
    return {"success": True, "students": issued}


@router.post("/students/{student_id}/reset-password")
def reset_student_password(
    student_id: int,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db),
):
    """Only for school-issued logins. An account with its own email resets its
    own password, so an admin can't take over a personal account."""
    student = _own_student(db, current_user, student_id)
    if student.email:
        raise HTTPException(status_code=400, detail="This student has an email, so they can use 'Forgot password' themselves")
    password = temporary_password()
    student.password_hash = hash_password(password)
    student.must_change_password = True
    student.token_version = (student.token_version or 0) + 1
    db.commit()
    return {"success": True, "username": student.username, "temporary_password": password}


@router.patch("/students/{student_id}/level")
def correct_student_level(
    student_id: int,
    request: CorrectLevelRequest,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db),
):
    student = _own_student(db, current_user, student_id)
    correct_level(db, student, request.level, current_user, request.reason)
    db.commit()
    return {"success": True, "level": student.level, "grade": student.grade}


# Per-student stats in the roster are part of the paid licence; the free
# plan still shows who's enrolled and the school-wide summary.
_PER_STUDENT_FIELDS = (
    "courses_enrolled",
    "lessons_completed",
    "lessons_total",
    "quizzes_taken",
    "average_quiz_score",
    "average_quiz_time_seconds",
)


def _roster(db: Session, school_id: int) -> tuple:
    students = db.query(User).filter(User.school_id == school_id).all()
    overview_by_user = overview_for_users(db, [s.id for s in students])
    roster = [
        {
            "id": s.id,
            "full_name": s.full_name,
            "email": s.email,
            "username": s.username,
            "level": s.level,
            "grade": s.grade,
            "is_school_admin": s.is_school_admin,
            **overview_by_user[s.id],
        }
        for s in students
    ]
    return roster, summarize_overviews(list(overview_by_user.values()))


@router.get("/dashboard")
def get_school_dashboard(current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    roster, summary = _roster(db, current_user.school_id)
    licence = licence_status(db, school) if school else None

    if not (licence and licence["premium"]):
        for row in roster:
            for field in _PER_STUDENT_FIELDS:
                row.pop(field, None)

    return {
        "success": True,
        "school": _school_out(school) if school else None,
        "licence": licence,
        "roster": roster,
        "summary": summary,
    }


@router.get("/dashboard/export.csv")
def export_school_roster(current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    if not school or not licence_status(db, school)["premium"]:
        raise HTTPException(status_code=402, detail="Downloading reports is part of the school licence")

    roster, _ = _roster(db, school.id)
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["Name", "Login", "Level", "Grade", "Role", "Courses", "Lessons completed", "Lessons total",
                     "Quizzes taken", "Average quiz score (%)"])
    for row in roster:
        writer.writerow([
            csv_safe(row["full_name"]),
            csv_safe(row["email"] or row["username"] or ""),
            csv_safe(row["level"] or ""),
            csv_safe(row["grade"] or ""),
            "Admin" if row["is_school_admin"] else "Student",
            row["courses_enrolled"], row["lessons_completed"], row["lessons_total"], row["quizzes_taken"],
            row["average_quiz_score"] if row["quizzes_taken"] else "",
        ])

    filename = f"{school.join_code}-progress-{datetime.now(timezone.utc):%Y-%m-%d}.csv"
    return Response(
        content=out.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/send-digests")
def send_school_digests(x_digest_secret: str = Header(...), db: Session = Depends(get_db)):
    """Cron-callable (see .github/workflows/parent-digest.yml), not
    user-facing - gated by the same shared secret as the parent digest
    endpoint, not get_current_user."""
    expected = os.getenv("DIGEST_TRIGGER_SECRET")
    if not expected:
        raise HTTPException(status_code=503, detail="Digest sending is not configured")
    if not secrets_match(x_digest_secret, expected):
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
