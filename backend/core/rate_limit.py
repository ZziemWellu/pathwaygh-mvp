"""
Shared slowapi Limiter instance.

Storage: in-memory by default, which is only correct for ONE process.
The VPS runs uvicorn with --workers 2, and in-memory counters aren't
shared across processes, so every limit there was silently doubled. Set
RATE_LIMIT_STORAGE_URI=redis://127.0.0.1:6379/0 wherever more than one
process serves the API (see deploy/vps/README.md).

Keys: most students reach the API from a school network, where a whole
classroom shares one public IP. Keying a limit by IP alone therefore
makes the classroom share it - the 11th student to log in within a
minute was locked out, and a class shared 20 tutor messages an hour.
Authenticated endpoints use user_or_ip (one bucket per signed-in user);
login/forgot-password add a per-account check (hit_per_account) on top
of a looser per-IP flood limit.

Client IP: get_remote_address reads request.client.host, which is only
the real client when uvicorn is told to trust the proxy in front of it
(--proxy-headers --forwarded-allow-ips=...). Without that, every request
appears to come from the proxy and all users share every limit.
"""

import logging
import os

from fastapi import HTTPException
from limits import parse
from slowapi import Limiter
from slowapi.util import get_remote_address

# RATE_LIMIT_REQUESTS/RATE_LIMIT_PERIOD: the baseline applied to every
# endpoint, per IP. Sized for a classroom behind one IP - a single page
# load fires several API calls per student, so 100/minute was reachable
# by a class just opening the dashboard together.
_DEFAULT_REQUESTS = os.getenv("RATE_LIMIT_REQUESTS", "600")
_DEFAULT_PERIOD_SECONDS = os.getenv("RATE_LIMIT_PERIOD", "60")

logger = logging.getLogger(__name__)


def user_or_ip(request) -> str:
    """Rate-limit key: the signed-in user when the request carries a valid
    bearer token, otherwise the client IP. Only decodes the JWT (no DB
    query) - an invalid or expired token just falls back to the IP, and
    the endpoint's own auth dependency still rejects the request."""
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        from core.security import _decode_token

        try:
            return f"user:{_decode_token(auth[7:].strip())}"
        except HTTPException:
            pass
    return get_remote_address(request)


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{_DEFAULT_REQUESTS}/{_DEFAULT_PERIOD_SECONDS}second"],
    storage_uri=os.getenv("RATE_LIMIT_STORAGE_URI", "memory://"),
    # If Redis becomes unreachable, degrade to per-process counters
    # rather than failing every rate-limited request (login included).
    in_memory_fallback_enabled=True,
)


def hit_per_account(
    limit: str,
    scope: str,
    account: str,
    detail: str = "Too many attempts for this account - please wait and try again",
) -> None:
    """Counts one attempt against `account` (e.g. an email address) under
    `scope`, in the same storage as the decorator limits, and raises 429
    once `limit` is exceeded. For endpoints where the account isn't known
    until the body is parsed, so slowapi's key_func can't see it."""
    try:
        allowed = limiter.limiter.hit(parse(limit), scope, account.strip().lower())
    except Exception as e:
        # Storage outage: fail open, as the decorator limits do via the
        # in-memory fallback - an unreachable Redis must not lock out logins.
        logger.warning(f"Per-account rate limit check skipped (storage error): {e}")
        return
    if not allowed:
        raise HTTPException(status_code=429, detail=detail)
