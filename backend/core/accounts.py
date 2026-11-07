"""Finding accounts, usernames, temporary passwords and level corrections,
shared by sign-up, school-issued logins and the admin tools."""

import re
import secrets
import unicodedata
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from core.levels import level_from_grade
from models.level_change import LevelChange
from models.user import User

USERNAME_PATTERN = re.compile(r"^[a-z][a-z0-9_.]{2,29}$")
# No 0/O or 1/l/I: this gets read off a printed slip by a child.
_TEMP_PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"


def normalize_username(raw: str) -> str:
    """Lower-cases and checks a username. Raises ValueError if it isn't valid."""
    username = (raw or "").strip().lower()
    if not USERNAME_PATTERN.match(username):
        raise ValueError(
            "A username needs 3 to 30 letters, numbers, dots or underscores, and must start with a letter"
        )
    return username


def find_user(db: Session, identifier: str) -> Optional[User]:
    """By email if it looks like one, otherwise by username. Usernames can't
    contain @, so the two can never collide."""
    value = (identifier or "").strip().lower()
    if not value:
        return None
    column = User.email if "@" in value else User.username
    return db.query(User).filter(func.lower(column) == value).first()


def username_taken(db: Session, username: str) -> bool:
    return db.query(User).filter(func.lower(User.username) == username).first() is not None


def _ascii_letters(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text)
    return re.sub(r"[^a-z]", "", decomposed.encode("ascii", "ignore").decode().lower())


def issue_username(db: Session, full_name: str) -> str:
    """'Ama Mensah' -> 'ama.m', then 'ama.m2', 'ama.m3'. Short enough for a
    young child to type, and it leaves out the surname."""
    parts = [p for p in (_ascii_letters(word) for word in full_name.split()) if p]
    first = (parts[0] if parts else "pupil")[:20]
    if len(first) < 2:
        first = f"pupil{first}"
    base = f"{first}.{parts[-1][0]}" if len(parts) > 1 else first
    candidate, number = base, 1
    while username_taken(db, candidate):
        number += 1
        candidate = f"{base}{number}"
    return candidate


def temporary_password() -> str:
    """Two groups of four: easy to read from a slip, and long enough given the
    login rate limits. The student has to replace it at first sign-in."""
    chars = [secrets.choice(_TEMP_PASSWORD_ALPHABET) for _ in range(8)]
    return "".join(chars[:4]) + "-" + "".join(chars[4:])


def correct_level(db: Session, student: User, new_level: str, changed_by: User, reason: str) -> None:
    """Sets a student's level, in either direction, and records who did it.
    A grade from the old level would contradict the new one and block their
    next profile save, so it's cleared. Doesn't commit - the caller commits."""
    db.add(
        LevelChange(
            user_id=student.id,
            changed_by_id=changed_by.id,
            from_level=student.level,
            to_level=new_level,
            reason=reason.strip()[:255],
        )
    )
    student.level = new_level
    if level_from_grade(student.grade) not in (new_level, "university"):
        student.grade = None
