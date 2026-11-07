"""
CSSPS school-choice helper for Ghanaian JHS students: build the ranked list
of schools, and check it against the year's selection rules before entering
it on the official form.

It only checks the rules. It holds no school list, because the only register
found online was an unofficial copy with an older A-D grouping, so students
enter each school's category from their own official register. It doesn't
predict placement either: GES publishes no cut-offs to base that on, and the
real outcome also depends on programme, boarding or day, and vacancies.
"""

import json
from pathlib import Path
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.user import User

router = APIRouter(tags=["school_choice"])

RULES_FILE = Path(__file__).resolve().parents[2] / "data" / "school_choice" / "cssps_2026.json"
RULES = json.loads(RULES_FILE.read_text(encoding="utf-8"))


class SchoolChoice(BaseModel):
    school: str = Field(default="", max_length=200)
    category: Optional[Literal["A", "B", "C"]] = None
    mode: Optional[Literal["boarding", "day"]] = None
    programme: str = Field(default="", max_length=100)


class DraftRequest(BaseModel):
    choices: List[SchoolChoice] = Field(max_length=RULES["total_choices"])


def _normalized_name(name: str) -> str:
    return " ".join(name.lower().split())


def check_choices(choices: List[SchoolChoice]) -> dict:
    """Returns rule errors (things the guide doesn't allow), reminders for
    what's still missing, and the running counts. Rows with no school name
    are empty slots, so a half-finished list isn't reported as breaking rules."""
    rows = [c for c in choices if c.school.strip()]
    counts = {
        "total": len(rows),
        "A": sum(c.category == "A" for c in rows),
        "B": sum(c.category == "B" for c in rows),
        "C": sum(c.category == "C" for c in rows),
        "boarding": sum(c.mode == "boarding" for c in rows),
        "day": sum(c.mode == "day" for c in rows),
    }

    errors = []
    if counts["A"] > RULES["max_category_a"]:
        errors.append(f"You can choose at most {RULES['max_category_a']} Category A schools. You have {counts['A']}.")
    if counts["B"] > RULES["max_category_b"]:
        errors.append(f"You can choose at most {RULES['max_category_b']} Category B schools. You have {counts['B']}.")
    if counts["boarding"] > RULES["max_boarding"]:
        errors.append(f"You can choose at most {RULES['max_boarding']} boarding schools. You have {counts['boarding']}.")
    if counts["day"] > RULES["max_day"]:
        errors.append(f"You can choose at most {RULES['max_day']} day schools. You have {counts['day']}.")

    seen = set()
    for choice in rows:
        name = _normalized_name(choice.school)
        if name in seen:
            errors.append(f"{choice.school.strip()} is on your list more than once. Each school can only be chosen once.")
        seen.add(name)

    reminders = []
    missing = RULES["total_choices"] - counts["total"]
    if missing > 0:
        reminders.append(f"Add {missing} more school{'s' if missing != 1 else ''} to reach {RULES['total_choices']}.")
    incomplete = sum(1 for c in rows if not (c.category and c.mode and c.programme.strip()))
    if incomplete:
        reminders.append(
            f"Finish the category, boarding or day, and programme for {incomplete} "
            f"school{'s' if incomplete != 1 else ''}."
        )

    return {
        "valid": not errors,
        "complete": not errors and not reminders,
        "errors": errors,
        "reminders": reminders,
        "counts": counts,
    }


def _require_eligible(user: User) -> None:
    # CSSPS is Ghana's placement system, for students finishing JHS. Staff can
    # open it to see what students see; an older account with no level yet
    # isn't shut out for not having chosen one.
    if user.is_admin or user.is_school_admin:
        return
    if user.country != "GH" or user.level not in (None, "jhs"):
        raise HTTPException(status_code=403, detail="The school-choice helper is for JHS students in Ghana")


@router.get("/rules")
def get_rules():
    return {"success": True, "rules": RULES}


@router.get("/draft")
def get_draft(current_user: User = Depends(get_current_user)):
    _require_eligible(current_user)
    stored = current_user.school_choice_draft or []
    choices = [SchoolChoice(**c) for c in stored]
    return {"success": True, "choices": [c.model_dump() for c in choices], "check": check_choices(choices)}


@router.put("/draft")
def save_draft(
    body: DraftRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Saves even when the list breaks a rule: it's a working draft, and a
    student shouldn't lose their list for having three Category A schools on
    the way to fixing it. The check in the reply says what's wrong."""
    _require_eligible(current_user)
    current_user.school_choice_draft = [c.model_dump() for c in body.choices]
    db.commit()
    return {"success": True, "check": check_choices(body.choices)}
