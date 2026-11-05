"""Frontend addresses the backend serves.

FRONTEND_URL may hold one address or several, separated by commas, so the
site can run on more than one domain at once (for example the new
learninghotspot.africa domain and the old onrender.com address while people
move over). The first address is the primary one: payment redirects go
there. Every address is allowed by CORS.
"""

import os

DEFAULT_FRONTEND_URL = "https://pathwaygh-frontend.onrender.com"


def frontend_urls() -> list[str]:
    raw = os.getenv("FRONTEND_URL", "") or DEFAULT_FRONTEND_URL
    urls = []
    for part in raw.split(","):
        url = part.strip().rstrip("/")
        if url and url not in urls:
            urls.append(url)
    return urls or [DEFAULT_FRONTEND_URL]


def primary_frontend_url() -> str:
    return frontend_urls()[0]
