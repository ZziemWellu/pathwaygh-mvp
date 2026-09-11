"""
Shared slowapi Limiter instance. In-memory storage (slowapi's default) -
correct for a single-instance Render deployment; a multi-instance
deployment would need slowapi's Redis backend (storage_uri=REDIS_URL)
instead, since in-memory counters aren't shared across processes.
"""

import os

from slowapi import Limiter
from slowapi.util import get_remote_address

# RATE_LIMIT_REQUESTS/RATE_LIMIT_PERIOD have existed in .env.example since
# before any rate limiting was actually implemented - this finally makes
# them real, as a baseline applied to every endpoint. Auth-adjacent
# endpoints layer tighter, endpoint-specific @limiter.limit(...) calls on
# top of this (slowapi enforces both).
_DEFAULT_REQUESTS = os.getenv("RATE_LIMIT_REQUESTS", "100")
_DEFAULT_PERIOD_SECONDS = os.getenv("RATE_LIMIT_PERIOD", "60")

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{_DEFAULT_REQUESTS}/{_DEFAULT_PERIOD_SECONDS}second"],
)
