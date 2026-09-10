"""
Certificate module - GET /me and POST /check/{course_slug} require auth;
GET /verify/{code} is deliberately unauthenticated (no dependency at all),
since a public verification link/code must return the same result no
matter who - or whether anyone with an account - is asking.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.certificate import Certificate
from models.course import Course
from models.user import User
from modules.certificates.service import check_and_issue_certificate

router = APIRouter(tags=["certificates"])


def _format_code(code: str) -> str:
    return "-".join(code[i : i + 4] for i in range(0, len(code), 4))


def _normalize_code(raw: str) -> str:
    return raw.replace("-", "").replace(" ", "").strip().upper()


def _certificate_out(certificate: Certificate) -> dict:
    return {
        "code": certificate.code,
        "code_display": _format_code(certificate.code),
        "course_slug": certificate.course.slug if certificate.course else None,
        "course_title": certificate.course_title,
        "recipient_name": certificate.recipient_name,
        "lesson_count": certificate.lesson_count,
        "issued_at": certificate.issued_at.isoformat() if certificate.issued_at else None,
    }


@router.get("/me")
async def list_my_certificates(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    certificates = (
        db.query(Certificate)
        .filter(Certificate.user_id == current_user.id)
        .order_by(Certificate.issued_at.desc())
        .all()
    )
    return {"success": True, "certificates": [_certificate_out(c) for c in certificates]}


@router.post("/check/{course_slug}")
async def check_course_completion(
    course_slug: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.slug == course_slug).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    certificate, created = check_and_issue_certificate(db, current_user, course)
    return {
        "success": True,
        "complete": certificate is not None,
        "issued": created,
        "certificate": _certificate_out(certificate) if certificate else None,
    }


@router.get("/verify/{code}")
async def verify_certificate(code: str, db: Session = Depends(get_db)):
    certificate = db.query(Certificate).filter(Certificate.code == _normalize_code(code)).first()
    if not certificate or certificate.is_revoked:
        return {"success": True, "valid": False}

    return {
        "success": True,
        "valid": True,
        "certificate": {
            "recipient_name": certificate.recipient_name,
            "course_title": certificate.course_title,
            "lesson_count": certificate.lesson_count,
            "issued_at": certificate.issued_at.isoformat() if certificate.issued_at else None,
            "code_display": _format_code(certificate.code),
        },
    }
