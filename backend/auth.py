import secrets
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

_sessions: dict[str, int] = {}

# Use HTTPBearer without auto_error so we can handle it ourselves
bearer_scheme = HTTPBearer(auto_error=False)


def create_token(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    _sessions[token] = user_id
    return token


def delete_token(token: str) -> None:
    _sessions.pop(token, None)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> int:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user_id = _sessions.get(credentials.credentials)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return user_id
