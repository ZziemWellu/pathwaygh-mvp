from starlette.requests import Request

from core.rate_limit import user_or_ip
from core.security import create_access_token


def _request(authorization=None, client_ip="203.0.113.7"):
    headers = [(b"authorization", authorization.encode())] if authorization else []
    return Request({"type": "http", "headers": headers, "client": (client_ip, 1234)})


def test_signed_in_requests_are_keyed_per_user_not_per_ip():
    # Two students behind the same school IP get separate buckets.
    a = user_or_ip(_request(f"Bearer {create_access_token(1)}"))
    b = user_or_ip(_request(f"Bearer {create_access_token(2)}"))
    assert a == "user:1"
    assert b == "user:2"


def test_anonymous_requests_fall_back_to_the_ip():
    assert user_or_ip(_request()) == "203.0.113.7"


def test_an_invalid_token_falls_back_to_the_ip_instead_of_a_fresh_bucket():
    # Otherwise rotating garbage tokens would mint unlimited buckets.
    assert user_or_ip(_request("Bearer not-a-real-token")) == "203.0.113.7"
