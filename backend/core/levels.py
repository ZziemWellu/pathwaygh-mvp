"""School levels a student account belongs to, in the order a student moves
through them. Primary, JHS and SHS are the levels offered at sign-up."""

from typing import Optional

STUDENT_LEVELS = ("primary", "jhs", "shs")


def level_from_grade(grade: Optional[str]) -> Optional[str]:
    """'JHS 2' -> 'jhs', 'Primary 4' -> 'primary', 'University' -> 'university'.
    Grade is the profile's free-text field (the Profile form offers exactly
    these values), so match on the prefix rather than the exact string."""
    if not grade:
        return None
    g = grade.strip().lower()
    for level in STUDENT_LEVELS:
        if g.startswith(level):
            return level
    return "university" if g.startswith("univ") else None


def can_move_to_level(current: Optional[str], new: str) -> bool:
    """A student moves up as they progress, never back down. An account with
    no level yet (created before levels existed) may pick any."""
    if current not in STUDENT_LEVELS:
        return True
    return STUDENT_LEVELS.index(new) >= STUDENT_LEVELS.index(current)
