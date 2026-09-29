"""
Flashcards Module Router - student-created flashcards reviewed via SM-2
spaced repetition (see modules/flashcards/spaced_repetition.py).
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.flashcard import Flashcard, today_utc
from models.user import User
from modules.flashcards.spaced_repetition import RATING_TO_QUALITY, review
from modules.gamification.service import award_for_flashcard_reviewed

router = APIRouter(tags=["flashcards"])


class CreateFlashcardRequest(BaseModel):
    front: str
    back: str


class ReviewFlashcardRequest(BaseModel):
    rating: str


def _card_out(card: Flashcard) -> dict:
    return {
        "id": card.id,
        "front": card.front,
        "back": card.back,
        "due_date": card.due_date.isoformat() if card.due_date else None,
        "repetitions": card.repetitions,
        "interval_days": card.interval_days,
    }


def _get_own_card(db: Session, card_id: int, user_id: int) -> Optional[Flashcard]:
    return db.query(Flashcard).filter(Flashcard.id == card_id, Flashcard.user_id == user_id).first()


@router.get("/")
async def flashcards_root():
    return {"module": "flashcards", "status": "active"}


@router.post("")
async def create_flashcard(
    body: CreateFlashcardRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not body.front.strip() or not body.back.strip():
        raise HTTPException(status_code=400, detail="Both front and back are required")

    card = Flashcard(user_id=current_user.id, front=body.front, back=body.back)
    db.add(card)
    db.commit()
    db.refresh(card)
    return {"success": True, "card": _card_out(card)}


@router.get("")
async def list_flashcards(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cards = db.query(Flashcard).filter(Flashcard.user_id == current_user.id).order_by(Flashcard.created_at.desc()).all()
    return {"success": True, "cards": [_card_out(c) for c in cards]}


@router.get("/due")
async def get_due_flashcards(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cards = (
        db.query(Flashcard)
        .filter(Flashcard.user_id == current_user.id, Flashcard.due_date <= today_utc())
        .order_by(Flashcard.due_date.asc())
        .all()
    )
    return {"success": True, "cards": [_card_out(c) for c in cards], "total_due": len(cards)}


@router.post("/{card_id}/review")
async def review_flashcard(
    card_id: int, body: ReviewFlashcardRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    card = _get_own_card(db, card_id, current_user.id)
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    if body.rating not in RATING_TO_QUALITY:
        raise HTTPException(status_code=400, detail=f"rating must be one of {list(RATING_TO_QUALITY)}")

    result = review(body.rating, card.ease_factor, card.interval_days, card.repetitions)
    card.ease_factor = result.ease_factor
    card.interval_days = result.interval_days
    card.repetitions = result.repetitions
    card.due_date = today_utc() + timedelta(days=result.interval_days)
    card.last_reviewed_at = datetime.now(timezone.utc)

    gamification = award_for_flashcard_reviewed(db, current_user)
    db.commit()

    return {"success": True, "card": _card_out(card), "gamification": gamification}


@router.delete("/{card_id}")
async def delete_flashcard(card_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    card = _get_own_card(db, card_id, current_user.id)
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    db.delete(card)
    db.commit()
    return {"success": True}
