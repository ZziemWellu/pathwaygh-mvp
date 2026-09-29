"""
SM-2 spaced repetition (Wozniak, 1987 - the algorithm SuperMemo and Anki's
"simplified SM-2" mode are both built on). A pure function of the card's
current state plus one review rating, same "pure math, no side effects"
shape as modules/practice/mastery.py's update_mastery for BKT.

The 4 student-facing ratings (again/hard/good/easy) map to SM-2's 0-5
quality scale using Anki's well-established simplified mapping, rather
than exposing a raw 0-5 scale a student would have no intuition for.
"""

from typing import NamedTuple

RATING_TO_QUALITY = {
    "again": 0,
    "hard": 3,
    "good": 4,
    "easy": 5,
}

MIN_EASE_FACTOR = 1.3
DEFAULT_EASE_FACTOR = 2.5


class ReviewResult(NamedTuple):
    ease_factor: float
    interval_days: int
    repetitions: int


def review(rating: str, ease_factor: float, interval_days: int, repetitions: int) -> ReviewResult:
    """One SM-2 step. `rating` must be one of RATING_TO_QUALITY's keys."""
    if rating not in RATING_TO_QUALITY:
        raise ValueError(f"Unknown rating '{rating}' - must be one of {list(RATING_TO_QUALITY)}")
    quality = RATING_TO_QUALITY[rating]

    if quality < 3:
        # A lapse resets the review sequence, but not the ease factor by
        # itself (that's adjusted below like every other review) - the
        # card is due again tomorrow rather than immediately, so it isn't
        # shown again in the same session.
        return ReviewResult(ease_factor=_adjust_ease(ease_factor, quality), interval_days=1, repetitions=0)

    new_repetitions = repetitions + 1
    if new_repetitions == 1:
        new_interval = 1
    elif new_repetitions == 2:
        new_interval = 6
    else:
        new_interval = round(interval_days * ease_factor)

    return ReviewResult(
        ease_factor=_adjust_ease(ease_factor, quality),
        interval_days=new_interval,
        repetitions=new_repetitions,
    )


def _adjust_ease(ease_factor: float, quality: int) -> float:
    new_ease = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    return max(MIN_EASE_FACTOR, new_ease)
