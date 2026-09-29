"""
Vocabulary Module Router - Word of the Day, inspired by SyllabusGH's
feature of the same name. Each entry frames a real vocabulary word with
its BECE/WASSCE exam relevance, not just a bare dictionary definition.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.vocabulary_progress import VocabularyProgress
from modules.gamification.service import award_for_word_learned
from modules.vocabulary.service import find_word, word_of_the_day

router = APIRouter(tags=["vocabulary"])


@router.get("/")
async def vocabulary_root():
    return {"module": "vocabulary", "status": "active"}


@router.get("/word-of-the-day")
async def get_word_of_the_day(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    word = word_of_the_day()
    if not word:
        raise HTTPException(status_code=503, detail="No vocabulary content is available")

    learned = (
        db.query(VocabularyProgress)
        .filter(VocabularyProgress.user_id == current_user.id, VocabularyProgress.word_id == word["id"])
        .first()
        is not None
    )
    return {"success": True, "word": word, "learned": learned}


@router.post("/{word_id}/learned")
async def mark_word_learned(word_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    word = find_word(word_id)
    if not word:
        raise HTTPException(status_code=404, detail=f"Word '{word_id}' not found")

    existing = (
        db.query(VocabularyProgress)
        .filter(VocabularyProgress.user_id == current_user.id, VocabularyProgress.word_id == word_id)
        .first()
    )
    if existing:
        return {"success": True, "already_learned": True, "gamification": None}

    db.add(VocabularyProgress(user_id=current_user.id, word_id=word_id))
    gamification = award_for_word_learned(db, current_user)
    db.commit()

    return {"success": True, "already_learned": False, "gamification": gamification}


@router.get("/progress")
async def get_vocabulary_progress(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(VocabularyProgress).filter(VocabularyProgress.user_id == current_user.id).all()
    return {"success": True, "words_learned": len(rows), "word_ids": [r.word_id for r in rows]}
