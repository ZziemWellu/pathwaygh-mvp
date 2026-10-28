"""
Password hashing and JWT issuing/verification.
"""

import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from core.database import get_db
from models.user import User

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    # No fallback default - a silently-applied, publicly-known default
    # would let anyone forge a valid JWT for any user. Every legitimate
    # environment already sets this explicitly: backend/.env for local
    # dev, backend-tests.yml's job-level env for CI, and the Render
    # dashboard (render.yaml marks it sync: false) for production.
    raise RuntimeError(
        "SECRET_KEY environment variable is not set. Refusing to start with a "
        "default JWT signing key - set SECRET_KEY in your .env (local) or in "
        "the Render dashboard (production)."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(user_id: int, token_version: int = 0) -> str:
    # "ver" ties the token to the user's current session version: bumping
    # User.token_version (e.g. on password reset) invalidates every token
    # issued before it.
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "ver": token_version, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _credentials_exception(detail: str = "Could not validate credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _decode_claims(token: str) -> tuple:
    """(user_id, token_version). Tokens issued before versioning carry no
    "ver" and count as version 0, so existing sessions stay valid until the
    user's first version bump."""
    try:
        # PyJWT (python-jose was dropped: unmaintained, with an unpatched
        # algorithm-confusion advisory). algorithms= pins HS256 explicitly.
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"require": ["exp", "sub"]})
        return int(payload["sub"]), int(payload.get("ver", 0))
    except (jwt.PyJWTError, ValueError, TypeError) as e:
        raise _credentials_exception() from e


def _decode_token(token: str) -> int:
    return _decode_claims(token)[0]


def _user_for_token(token: str, db: Session):
    user_id, version = _decode_claims(token)
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if version != (user.token_version or 0):
        raise _credentials_exception("Session expired - please sign in again")
    return user


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _user_for_token(token, db)


def get_current_user_optional(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    """Like get_current_user, but returns None instead of raising when unauthenticated."""
    if not token:
        return None
    try:
        return _user_for_token(token, db)
    except HTTPException:
        return None


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def require_school_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_school_admin or not user.school_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="School admin access required")
    return user
