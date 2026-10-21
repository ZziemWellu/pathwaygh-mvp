"""
Gamification Module Router - personal XP/streaks/achievements, plus an
opt-in, school-scoped leaderboard. Deliberately not SyllabusGH's public
national leaderboard with full real names: leaderboard_opt_in defaults
to false, a student must set a display_name (a pseudonym, never their
own full_name is pulled in automatically) to appear on it, and it only
ever shows students within the same school - never a nationwide list.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.gamification import EarnedAchievement, GamificationProfile
from models.user import User
from modules.gamification.achievements import ACHIEVEMENTS
from modules.gamification.service import get_or_create_profile

router = APIRouter(tags=["gamification"])


class LeaderboardOptInRequest(BaseModel):
    opt_in: bool
    display_name: Optional[str] = Field(default=None, max_length=50)


@router.get("/")
def gamification_root():
    return {"module": "gamification", "status": "active"}


@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, current_user.id)
    db.commit()

    earned_ids = {row.achievement_id for row in db.query(EarnedAchievement).filter(EarnedAchievement.user_id == current_user.id).all()}

    return {
        "success": True,
        "xp_points": profile.xp_points,
        "current_streak_days": profile.current_streak_days,
        "longest_streak_days": profile.longest_streak_days,
        "leaderboard_opt_in": profile.leaderboard_opt_in,
        "leaderboard_display_name": profile.leaderboard_display_name,
        "achievements_earned": len(earned_ids),
        "achievements_total": len(ACHIEVEMENTS),
    }


@router.get("/achievements")
def get_achievements(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    earned = {
        row.achievement_id: row.earned_at
        for row in db.query(EarnedAchievement).filter(EarnedAchievement.user_id == current_user.id).all()
    }
    return {
        "success": True,
        "achievements": [
            {
                "id": achievement_id,
                "name": definition["name"],
                "description": definition["description"],
                "icon": definition["icon"],
                "earned": achievement_id in earned,
                "earned_at": earned[achievement_id].isoformat() if achievement_id in earned else None,
            }
            for achievement_id, definition in ACHIEVEMENTS.items()
        ],
    }


@router.patch("/leaderboard-opt-in")
def set_leaderboard_opt_in(
    body: LeaderboardOptInRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    profile = get_or_create_profile(db, current_user.id)
    if body.opt_in and not body.display_name and not profile.leaderboard_display_name:
        raise HTTPException(status_code=400, detail="A display name is required to join the leaderboard")

    profile.leaderboard_opt_in = body.opt_in
    if body.display_name:
        profile.leaderboard_display_name = body.display_name
    db.commit()

    return {"success": True, "leaderboard_opt_in": profile.leaderboard_opt_in, "leaderboard_display_name": profile.leaderboard_display_name}


@router.get("/leaderboard")
def get_leaderboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.school_id:
        return {"success": True, "leaderboard": [], "reason": "You're not linked to a school yet"}

    rows = (
        db.query(GamificationProfile, User)
        .join(User, User.id == GamificationProfile.user_id)
        .filter(
            User.school_id == current_user.school_id,
            GamificationProfile.leaderboard_opt_in.is_(True),
            GamificationProfile.leaderboard_display_name.isnot(None),
        )
        .order_by(GamificationProfile.xp_points.desc())
        .limit(50)
        .all()
    )

    return {
        "success": True,
        "leaderboard": [
            {"rank": i + 1, "display_name": profile.leaderboard_display_name, "xp_points": profile.xp_points, "is_you": user.id == current_user.id}
            for i, (profile, user) in enumerate(rows)
        ],
    }
