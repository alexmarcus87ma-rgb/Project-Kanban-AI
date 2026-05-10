import secrets
import time
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SESSION_TTL_SECONDS = 7 * 24 * 3600  # 7 days

_sessions: dict[str, tuple[int, int]] = {}  # token -> (user_id, expires_at)

bearer_scheme = HTTPBearer(auto_error=False)


def create_token(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    _sessions[token] = (user_id, int(time.time()) + SESSION_TTL_SECONDS)
    return token


def delete_token(token: str) -> None:
    _sessions.pop(token, None)


def _cleanup_expired() -> None:
    now = int(time.time())
    expired = [t for t, (_, exp) in _sessions.items() if exp < now]
    for t in expired:
        del _sessions[t]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> int:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    _cleanup_expired()
    session = _sessions.get(credentials.credentials)
    if session is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user_id, expires_at = session
    return user_id
