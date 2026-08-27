"""
Video URL parsing/validation for lesson videos (YouTube/Vimeo only).
"""

import re
from typing import Optional, Tuple

YOUTUBE_PATTERNS = [
    r"(?:youtube\.com/watch\?v=|youtube\.com/embed/|youtu\.be/)([\w-]{6,})",
]
VIMEO_PATTERN = r"vimeo\.com/(?:video/)?(\d+)"


def parse_video_url(url: str) -> Tuple[str, Optional[str]]:
    """Return (provider, video_id) for a YouTube/Vimeo URL, or ("unknown", None)."""
    if not url:
        return "unknown", None

    for pattern in YOUTUBE_PATTERNS:
        match = re.search(pattern, url)
        if match:
            return "youtube", match.group(1)

    match = re.search(VIMEO_PATTERN, url)
    if match:
        return "vimeo", match.group(1)

    return "unknown", None


def is_supported_video_url(url: str) -> bool:
    provider, _ = parse_video_url(url)
    return provider in ("youtube", "vimeo")
