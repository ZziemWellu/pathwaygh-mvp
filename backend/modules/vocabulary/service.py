"""
Word of the Day content loading and selection. The word bank
(data/vocabulary/words.json) is static, curated content - same pattern
as modules/practice/mastery.py's load_questions for the question bank.
"""

import json
import logging
from datetime import date, datetime, timezone
from pathlib import Path
from typing import List, Optional

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
WORDS_FILE = PROJECT_ROOT / "data" / "vocabulary" / "words.json"


def load_words() -> List[dict]:
    try:
        if WORDS_FILE.exists():
            with open(WORDS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data.get("words"):
                    return data["words"]
    except Exception as e:
        logger.error(f"Error loading vocabulary words: {e}")
    return []


def find_word(word_id: str) -> Optional[dict]:
    for word in load_words():
        if word["id"] == word_id:
            return word
    return None


def word_of_the_day(on_date: Optional[date] = None) -> Optional[dict]:
    """Deterministic by calendar day - every student sees the same word on
    the same day (real "Word of the Day" semantics), rotating through the
    bank rather than picking randomly per request."""
    words = load_words()
    if not words:
        return None
    today = on_date or datetime.now(timezone.utc).date()
    index = today.toordinal() % len(words)
    return words[index]
