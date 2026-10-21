"""
Peer Q&A Module Router (inspired by SyllabusGH's "Trending Questions").

Every post runs through modules/qa/moderation.py's cheap first-pass
filter at creation time; anything it flags starts as "pending_review"
instead of "visible". Independently, any visible post that collects
COMMUNITY_FLAG_THRESHOLD distinct reports is automatically pulled back
to "pending_review" too. Neither path deletes anything - an admin
(require_admin) makes the actual approve/remove call via the endpoints
at the bottom of this file.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db
from core.rate_limit import limiter, user_or_ip
from core.security import get_current_user, require_admin
from models.peer_answer import PeerAnswer
from models.peer_content_report import PeerContentReport
from models.peer_question import PeerQuestion
from models.user import User
from modules.qa.moderation import moderation_reason

router = APIRouter(tags=["qa"])

COMMUNITY_FLAG_THRESHOLD = 3


class CreateQuestionRequest(BaseModel):
    subject_id: Optional[str] = None
    body: str


class CreateAnswerRequest(BaseModel):
    body: str


class ReportRequest(BaseModel):
    reason: Optional[str] = None


def _question_out(q: PeerQuestion, include_answer_count: bool = True) -> dict:
    out = {
        "id": q.id,
        "subject_id": q.subject_id,
        "body": q.body,
        "author_name": q.user.full_name if q.user else "A student",
        "created_at": q.created_at.isoformat() if q.created_at else None,
    }
    if include_answer_count:
        out["answer_count"] = sum(1 for a in q.answers if a.status == "visible")
    return out


def _answer_out(a: PeerAnswer) -> dict:
    return {
        "id": a.id,
        "question_id": a.question_id,
        "body": a.body,
        "author_name": a.user.full_name if a.user else "A student",
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


@router.get("/")
def qa_root():
    return {"module": "qa", "status": "active"}


@router.get("/questions")
def list_questions(subject_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(PeerQuestion).filter(PeerQuestion.status == "visible")
    if subject_id:
        query = query.filter(PeerQuestion.subject_id == subject_id)
    questions = query.order_by(PeerQuestion.created_at.desc()).limit(100).all()
    return {"success": True, "questions": [_question_out(q) for q in questions]}


@router.post("/questions")
@limiter.limit("10/hour", key_func=user_or_ip)
def create_question(
    request: Request,
    body: CreateQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    text = body.body.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Question body is required")

    reason = moderation_reason(text)
    question = PeerQuestion(
        user_id=current_user.id,
        subject_id=body.subject_id,
        body=text,
        status="pending_review" if reason else "visible",
        moderation_reason=reason,
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    return {"success": True, "question": _question_out(question), "pending_review": reason is not None}


@router.get("/questions/{question_id}")
def get_question(
    question_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    question = db.query(PeerQuestion).filter(PeerQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    # "removed" stays hidden from everyone but admins, including the
    # original author - once an admin has taken it down, it's down.
    # "pending_review" is visible to its own author too, so they can see
    # their post is awaiting review rather than it silently vanishing.
    if question.status == "removed" and not current_user.is_admin:
        raise HTTPException(status_code=404, detail="Question not found")
    if question.status == "pending_review" and question.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=404, detail="Question not found")

    answers = [
        a
        for a in question.answers
        if a.status == "visible"
        or (a.status == "pending_review" and (a.user_id == current_user.id or current_user.is_admin))
        or (a.status == "removed" and current_user.is_admin)
    ]
    return {
        "success": True,
        "question": _question_out(question, include_answer_count=False),
        "answers": [_answer_out(a) for a in answers],
    }


@router.post("/questions/{question_id}/answers")
@limiter.limit("20/hour", key_func=user_or_ip)
def create_answer(
    request: Request,
    question_id: int,
    body: CreateAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question = db.query(PeerQuestion).filter(PeerQuestion.id == question_id, PeerQuestion.status == "visible").first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    text = body.body.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Answer body is required")

    reason = moderation_reason(text)
    answer = PeerAnswer(
        question_id=question_id,
        user_id=current_user.id,
        body=text,
        status="pending_review" if reason else "visible",
        moderation_reason=reason,
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)

    return {"success": True, "answer": _answer_out(answer), "pending_review": reason is not None}


def _record_report(db: Session, current_user: User, target_type: str, target: object, reason: Optional[str]) -> None:
    existing = (
        db.query(PeerContentReport)
        .filter(
            PeerContentReport.reporter_user_id == current_user.id,
            PeerContentReport.target_type == target_type,
            PeerContentReport.target_id == target.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You've already reported this")

    db.add(
        PeerContentReport(
            reporter_user_id=current_user.id, target_type=target_type, target_id=target.id, reason=reason
        )
    )
    target.flagged_count += 1
    if target.status == "visible" and target.flagged_count >= COMMUNITY_FLAG_THRESHOLD:
        target.status = "pending_review"
        target.moderation_reason = f"community-flagged ({target.flagged_count} reports)"
    db.commit()


@router.post("/questions/{question_id}/report")
@limiter.limit("20/hour", key_func=user_or_ip)
def report_question(
    request: Request,
    question_id: int,
    body: Optional[ReportRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question = db.query(PeerQuestion).filter(PeerQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    _record_report(db, current_user, "question", question, body.reason if body else None)
    return {"success": True}


@router.post("/answers/{answer_id}/report")
@limiter.limit("20/hour", key_func=user_or_ip)
def report_answer(
    request: Request,
    answer_id: int,
    body: Optional[ReportRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    answer = db.query(PeerAnswer).filter(PeerAnswer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    _record_report(db, current_user, "answer", answer, body.reason if body else None)
    return {"success": True}


# --- Admin moderation queue ------------------------------------------------


def _report_reasons(db: Session, target_type: str, target_id: int) -> list:
    rows = (
        db.query(PeerContentReport)
        .filter(PeerContentReport.target_type == target_type, PeerContentReport.target_id == target_id, PeerContentReport.reason.isnot(None))
        .all()
    )
    return [r.reason for r in rows]


@router.get("/admin/pending")
def list_pending(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    questions = db.query(PeerQuestion).filter(PeerQuestion.status == "pending_review").order_by(PeerQuestion.created_at).all()
    answers = db.query(PeerAnswer).filter(PeerAnswer.status == "pending_review").order_by(PeerAnswer.created_at).all()
    return {
        "success": True,
        "questions": [
            {
                **_question_out(q, include_answer_count=False),
                "moderation_reason": q.moderation_reason,
                "flagged_count": q.flagged_count,
                "report_reasons": _report_reasons(db, "question", q.id),
            }
            for q in questions
        ],
        "answers": [
            {
                **_answer_out(a),
                "moderation_reason": a.moderation_reason,
                "flagged_count": a.flagged_count,
                "report_reasons": _report_reasons(db, "answer", a.id),
            }
            for a in answers
        ],
    }


@router.post("/admin/questions/{question_id}/approve")
def approve_question(question_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    question = db.query(PeerQuestion).filter(PeerQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    question.status = "visible"
    question.moderation_reason = None
    question.flagged_count = 0
    db.commit()
    return {"success": True}


@router.post("/admin/questions/{question_id}/remove")
def remove_question(question_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    question = db.query(PeerQuestion).filter(PeerQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    question.status = "removed"
    db.commit()
    return {"success": True}


@router.post("/admin/answers/{answer_id}/approve")
def approve_answer(answer_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    answer = db.query(PeerAnswer).filter(PeerAnswer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    answer.status = "visible"
    answer.moderation_reason = None
    answer.flagged_count = 0
    db.commit()
    return {"success": True}


@router.post("/admin/answers/{answer_id}/remove")
def remove_answer(answer_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    answer = db.query(PeerAnswer).filter(PeerAnswer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    answer.status = "removed"
    db.commit()
    return {"success": True}
