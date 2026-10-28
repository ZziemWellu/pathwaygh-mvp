"""Constant-time comparison for shared secrets (webhook tokens, trigger
headers). A plain `!=` returns as soon as a character differs, so response
timing can leak how much of a guess was right."""

import hmac
from typing import Optional


def secrets_match(given: Optional[str], expected: Optional[str]) -> bool:
    if not given or not expected:
        return False
    return hmac.compare_digest(given.encode("utf-8"), expected.encode("utf-8"))
