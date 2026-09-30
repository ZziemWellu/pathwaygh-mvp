"""
Cheap first-pass content moderation for peer Q&A posts. Not a complete
moderation solution by itself - it exists to catch the obvious cases
automatically (profanity, a posted phone number/email) before a human
ever sees the post, while the "report" button and the admin review
queue (see router.py's require_admin-gated endpoints) remain the real
backstop for anything subtler this misses. On a platform used by minors,
posting a phone number or email publicly is a real safety concern on its
own, independent of whether the content is otherwise civil.

Uses better-profanity (a maintained third-party wordlist/library) rather
than a hand-rolled blocklist, since a curated, actively-maintained list
is a better bet than one written and kept up to date by this project.
"""

import re
from typing import Optional

from better_profanity import profanity

profanity.load_censor_words()

_EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
# A candidate run of digits and phone-like separators - checked further
# below by digit COUNT (not just character span), so a short numeric
# range like "1990-2026" (8 digits) doesn't false-positive as a phone
# number the way a naive character-length check would.
_PHONE_CANDIDATE_RE = re.compile(r"\d[\d\-\s()]{6,}\d")
MIN_PHONE_DIGITS = 9


def _contains_phone_number(text: str) -> bool:
    for match in _PHONE_CANDIDATE_RE.finditer(text):
        if sum(ch.isdigit() for ch in match.group()) >= MIN_PHONE_DIGITS:
            return True
    return False


def moderation_reason(text: str) -> Optional[str]:
    """Returns a short human-readable reason if `text` should be held for
    admin review before appearing publicly, or None if it can post
    immediately."""
    if profanity.contains_profanity(text):
        return "flagged by automatic profanity filter"
    if _EMAIL_RE.search(text):
        return "possible email address detected"
    if _contains_phone_number(text):
        return "possible phone number detected"
    return None
